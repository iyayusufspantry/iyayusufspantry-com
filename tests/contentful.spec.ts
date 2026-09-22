import { test, expect } from "@playwright/test";
import seed from "../scripts/contentful/seed.json";
import { mapContent, type CmsResource } from "../lib/content/map";
import { handleContentfulWebhook } from "../lib/content/webhook";

function resources() {
  return {
    entries: structuredClone(seed.entries).map((e) => ({
      sys: { id: e.id, contentType: { sys: { id: e.contentType } } },
      fields: e.fields,
    })) as CmsResource[],
    assets: seed.assets.map((a) => ({
      sys: { id: a.id },
      fields: {
        title: a.title,
        description: a.description,
        file: { url: `https://images.ctfassets.net/test/${a.id}/photo.jpg` },
      },
    })),
  };
}

test("published CMS values drive prices, copy, menus and media", () => {
  const { entries, assets } = resources();
  const variant = entries.find(
    (e) => e.fields.variantId === "plantain-chips:Small:Vegan",
  )!;
  variant.fields.priceCents = 123;
  const home = entries.find((e) => e.fields.route === "/")!;
  (
    home.fields.content as { blocks: { key: string; text: string }[] }
  ).blocks[0].text = "Edited in Contentful";
  const nav = entries.find((e) => e.fields.key === "main")!;
  nav.fields.items = [{ label: "Fresh menu", href: "/shop" }];
  const result = mapContent(entries, assets);
  expect(result.products.find((p) => p.slug === "plantain-chips")?.price).toBe(
    1.23,
  );
  expect(Object.values(result.copy["app/page.tsx"])).toContain(
    "Edited in Contentful",
  );
  expect(result.navigation.main).toEqual([["Fresh menu", "/shop"]]);
  expect(result.settings.logo.src).toMatch(/^https:\/\/images.ctfassets.net\//);
});

test("unpublished entries disappear without being restored from local fixtures", () => {
  const { entries, assets } = resources();
  const product = entries.find((e) => e.fields.slug === "plantain-chips")!;
  const result = mapContent(
    entries.filter(
      (e) => e !== product && e.sys.contentType?.sys.id !== "pantryArticle",
    ),
    assets,
  );
  expect(result.products.some((p) => p.slug === "plantain-chips")).toBe(false);
  expect(result.variants.some((v) => v.productSlug === "plantain-chips")).toBe(
    false,
  );
  expect(result.posts).toEqual([]);
  expect(() => mapContent([], assets)).toThrow(/Publish.*settings/);
});

test("invalid prices and unsafe CMS destinations are rejected", () => {
  const { entries, assets } = resources();
  entries.find(
    (e) => e.sys.contentType?.sys.id === "pantryVariant",
  )!.fields.priceCents = -1;
  expect(() => mapContent(entries, assets)).toThrow(/variant price/);
  const second = resources();
  second.entries.find((e) => e.fields.key === "main")!.fields.items = [
    { label: "Bad", href: "javascript:alert(1)" },
  ];
  expect(() => mapContent(second.entries, second.assets)).toThrow(/navigation/);
});

const config = {
  secret: "test-secret",
  space: "test-space",
  environment: "master",
};
function eventRequest({
  secret = config.secret,
  topic = "Entry.publish",
  environment = "master",
  body,
}: {
  secret?: string;
  topic?: string;
  environment?: string;
  body?: string;
} = {}) {
  return new Request("https://example.test/api/contentful/revalidate", {
    method: "POST",
    headers: {
      "x-contentful-webhook-secret": secret,
      "x-contentful-topic": `ContentManagement.${topic}`,
    },
    body:
      body ??
      JSON.stringify({
        sys: {
          id: "entry-id",
          space: { sys: { id: config.space } },
          environment: { sys: { id: environment } },
        },
      }),
  });
}

test("webhook rejects forged, malformed and wrong-environment events without invalidating", async () => {
  let calls = 0;
  const invalidate = async () => {
    calls++;
  };
  for (const [request, status] of [
    [eventRequest({ secret: "wrong" }), 401],
    [eventRequest({ environment: "other" }), 400],
    [eventRequest({ topic: "Entry.save" }), 400],
    [eventRequest({ body: "{" }), 400],
    [eventRequest({ body: "x".repeat(262145) }), 413],
  ] as const)
    expect(
      (await handleContentfulWebhook(request, config, invalidate)).status,
    ).toBe(status);
  expect(
    (
      await handleContentfulWebhook(
        eventRequest(),
        { ...config, secret: undefined },
        invalidate,
      )
    ).status,
  ).toBe(503);
  expect(calls).toBe(0);
});

test("publish, unpublish and asset events invalidate; transient delivery errors remain retryable", async () => {
  for (const topic of [
    "Entry.publish",
    "Entry.unpublish",
    "Entry.delete",
    "Asset.publish",
    "Asset.unpublish",
    "Asset.delete",
  ]) {
    const response = await handleContentfulWebhook(
      eventRequest({ topic }),
      config,
      async (event) => {
        expect(event.kind).toBe(
          topic.startsWith("Entry") ? "entries" : "assets",
        );
        expect(event.removed).toBe(!topic.endsWith(".publish"));
      },
    );
    expect(response.status).toBe(200);
  }
  expect(
    (
      await handleContentfulWebhook(eventRequest(), config, async () => {
        throw new Error("delivery pending");
      })
    ).status,
  ).toBe(503);
});

test("live webhook requires its secret and catalog photos use Contentful", async ({
  request,
  page,
}) => {
  expect(
    (await request.post("/api/contentful/revalidate", { data: {} })).status(),
  ).toBe(401);
  await page.goto("/shop/palm-oil");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Palm Oil",
  );
  expect(
    await page.locator(".brand-photograph img").first().getAttribute("src"),
  ).toContain("ctfassets.net");
});

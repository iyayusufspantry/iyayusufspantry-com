import { test } from "node:test";
import assert from "node:assert/strict";
import {
  contactEmail,
  newsletterEmail,
  sandboxOrderEmail,
} from "../lib/emails/messages";

test("newsletter preserves confirmation and unsubscribe tokens in HTML and plain text", async () => {
  const confirmationUrl = `https://pantry.example/newsletter/confirm#token=${"a".repeat(64)}`;
  const unsubscribeUrl = `https://pantry.example/newsletter/unsubscribe#token=${"b".repeat(64)}`;
  const { html, text } = await newsletterEmail({
    confirmationUrl,
    unsubscribeUrl,
  });
  for (const body of [html, text]) {
    assert.ok(body.includes(confirmationUrl));
    assert.ok(body.includes(unsubscribeUrl));
    assert.match(body, /24 hours/);
    assert.doesNotMatch(body, /Design preview/);
  }
  assert.match(html, /Confirm my subscription/);
  assert.match(
    html,
    /https:\/\/www\.iyayusufspantry\.com\/brand\/iya-yusufs-pantry-horizontal\.png/,
  );
  assert.match(html, /A taste of home\. A world of good food\./);
});

test("contact messages escape customer content and preserve paragraphs and reply destination", async () => {
  const { html, text } = await contactEmail({
    name: '<img src=x onerror="alert(1)">',
    email: "customer@example.com",
    subject: "product",
    message: 'First line\n<script>alert("unsafe")</script>\nLast line',
    reference: "contact-123",
  });
  assert.doesNotMatch(html, /<script>|<img src=x/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /href="mailto:customer@example.com"/);
  assert.match(text, /First line/);
  assert.match(text, /Last line/);
  assert.match(text, /contact-123/);
  assert.match(text, /Product inquiry/);
});

test("sandbox receipt keeps the test disclaimer, correct cents, and order reference in both formats", async () => {
  const content = await sandboxOrderEmail({
    reference: "order-123",
    subtotalCents: 2401,
    currency: "USD",
  });
  for (const body of [content.html, content.text]) {
    assert.match(body, /24\.01 USD/);
    assert.match(body, /order-123/);
    assert.match(
      body,
      /No real payment was collected and no goods will be shipped/,
    );
    assert.match(body, /Item subtotal/);
  }
});

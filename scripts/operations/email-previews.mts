import nextEnv from "@next/env";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import {
  contactEmail,
  newsletterEmail,
  sandboxOrderEmail,
} from "../../lib/emails/messages";
import { sendWithResend } from "../../lib/operations/mail";
import { emailAddress } from "../../lib/operations/validation";
import type { MailPayload } from "../../lib/operations/store";

nextEnv.loadEnvConfig(process.cwd(), true);
const send = process.argv.includes("--send");
const recipientIndex = process.argv.indexOf("--to");
if (send && recipientIndex < 0)
  throw new Error("Sending previews requires --to recipient@example.com");
const recipient =
  recipientIndex < 0
    ? "preview@example.com"
    : emailAddress(process.argv[recipientIndex + 1]);
if (
  send &&
  (!process.env.EMAIL_FROM ||
    !process.env.RESEND_API_KEY ||
    process.env.EMAIL_DELIVERY_ENABLED !== "true")
)
  throw new Error(
    "Configure the sender and enable email delivery before sending previews",
  );
const from =
  process.env.EMAIL_FROM ||
  "Iya Yusuf's Pantry <notifications@iyayusufspantry.com>";
const origin = "https://www.iyayusufspantry.com";
const previewOnly = true;
const previews = [
  {
    name: "newsletter",
    subject: "[New design 1/3] A seat at the pantry table",
    content: await newsletterEmail({
      confirmationUrl: `${origin}/newsletter/confirm#token=preview-not-active`,
      unsubscribeUrl: `${origin}/newsletter/unsubscribe#token=preview-not-active`,
      previewOnly,
    }),
  },
  {
    name: "contact",
    subject: "[New design 2/3] A new pantry message",
    content: await contactEmail({
      name: "Amara (sample customer)",
      email: recipient,
      subject: "product",
      message:
        "Hello! I’m putting together a pantry order for my family.\n\nCould you tell me more about your Nigerian snacks and drinks? I’d love to bring a little taste of home to our table.\n\nThank you!",
      reference: "PREVIEW-CONTACT-001",
      previewOnly,
    }),
  },
  {
    name: "sandbox-order",
    subject: "[New design 3/3] Your pantry test payment",
    content: await sandboxOrderEmail({
      reference: "PREVIEW-ORDER-001",
      subtotalCents: 2400,
      currency: "USD",
      previewOnly,
    }),
  },
];
const directory = "artifacts/email-previews/react-email";
await mkdir(directory, { recursive: true });
const accepted: {
  name: string;
  recipient: string;
  id: string;
  acceptedAt: string;
}[] = [];
for (const preview of previews) {
  await writeFile(`${directory}/${preview.name}.html`, preview.content.html);
  await writeFile(`${directory}/${preview.name}.txt`, preview.content.text);
  if (send) {
    const payload: MailPayload = {
      from,
      to: [recipient],
      reply_to:
        preview.name === "contact" ? recipient : process.env.EMAIL_REPLY_TO,
      subject: preview.subject,
      ...preview.content,
    };
    const hash = createHash("sha256")
      .update(JSON.stringify(payload))
      .digest("hex");
    const id = await sendWithResend(
      payload,
      `pantry-react-email-preview-${hash}`,
    );
    accepted.push({
      name: preview.name,
      recipient,
      id,
      acceptedAt: new Date().toISOString(),
    });
    await writeFile(
      `${directory}/sent.json`,
      JSON.stringify(accepted, null, 2),
    );
    console.log(`Resend accepted ${preview.name} for ${recipient}: ${id}`);
    await new Promise((resolve) => setTimeout(resolve, 700));
  } else console.log(`Rendered ${directory}/${preview.name}.html`);
}
if (!send)
  console.log(
    "No emails sent. Add --send --to recipient@example.com to send these sample designs.",
  );

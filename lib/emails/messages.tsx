import type { ReactElement } from "react";
import { Link, Section, Text, render, toPlainText } from "react-email";
import {
  EmailButton,
  EmailLayout,
  EmailSignoff,
  emailBrand,
  panel,
  paragraph,
  small,
} from "./layout";

type PreviewProps = { previewOnly?: boolean };
export type NewsletterEmailProps = PreviewProps & {
  confirmationUrl: string;
  unsubscribeUrl: string;
};
export type ContactEmailProps = PreviewProps & {
  name: string;
  email: string;
  subject: string;
  message: string;
  reference: string;
};
export type OrderEmailProps = PreviewProps & {
  reference: string;
  subtotalCents: number;
  currency: string;
};

export function NewsletterEmail({
  confirmationUrl,
  unsubscribeUrl,
  previewOnly,
}: NewsletterEmailProps) {
  return (
    <EmailLayout
      preview="One little step to recipes, pantry favorites, and a taste of home."
      eyebrow="A SEAT AT OUR TABLE"
      title="Good food. Good company."
      reason="You received this email because this address requested the pantry newsletter."
      unsubscribeUrl={unsubscribeUrl}
      previewOnly={previewOnly}
    >
      <Text style={paragraph}>
        Welcome to Iya Yusuf&apos;s Pantry. We&apos;re glad you&apos;re here.
      </Text>
      <Text style={paragraph}>
        Confirm your email to receive Nigerian recipes, pantry favorites, and
        stories that bring you a little closer to home.
      </Text>
      <Section style={panel}>
        <Text
          style={{
            ...paragraph,
            color: emailBrand.ink,
            fontWeight: "bold",
            margin: "0 0 18px",
          }}
        >
          Your place at the table is waiting.
        </Text>
        <EmailButton href={confirmationUrl}>
          Confirm my subscription
        </EmailButton>
        <Text style={{ ...small, margin: "16px 0 0" }}>
          This confirmation link is valid for 24 hours.
        </Text>
      </Section>
      <Text style={small}>
        Didn&apos;t ask to join? You can ignore this email. You won&apos;t be
        subscribed unless you confirm.
      </Text>
      <Text
        style={{ ...small, overflowWrap: "anywhere", wordBreak: "break-all" }}
      >
        If the button doesn&apos;t work, copy this link into your browser:
        <br />
        <Link
          href={confirmationUrl}
          style={{ color: emailBrand.green, textDecoration: "underline" }}
        >
          {confirmationUrl}
        </Link>
      </Text>
      <EmailSignoff />
    </EmailLayout>
  );
}

const topics: Record<string, string> = {
  general: "General inquiry",
  product: "Product inquiry",
  order: "Order inquiry",
  other: "Other inquiry",
};
export function ContactEmail({
  name,
  email,
  subject,
  message,
  reference,
  previewOnly,
}: ContactEmailProps) {
  return (
    <EmailLayout
      preview={`${name} sent a message to the pantry.`}
      eyebrow="PANTRY INBOX"
      title="A new message has arrived."
      reason="This notification was sent to the business inbox for a website contact request."
      previewOnly={previewOnly}
    >
      <Text style={paragraph}>
        Someone has reached out through your website. Their message and contact
        details are below.
      </Text>
      <Section style={panel}>
        <Text
          style={{
            ...small,
            margin: "0 0 6px",
            color: emailBrand.green,
            fontWeight: "bold",
          }}
        >
          {topics[subject] || subject}
        </Text>
        <Text
          style={{
            ...paragraph,
            margin: "0 0 4px",
            color: emailBrand.ink,
            fontWeight: "bold",
            overflowWrap: "anywhere",
          }}
        >
          {name}
        </Text>
        <Link
          href={`mailto:${email}`}
          style={{
            color: emailBrand.green,
            fontSize: "14px",
            wordBreak: "break-all",
          }}
        >
          {email}
        </Link>
      </Section>
      <Text
        style={{
          ...small,
          letterSpacing: "1.5px",
          fontSize: "11px",
          fontWeight: "bold",
          margin: "0 0 12px",
        }}
      >
        MESSAGE
      </Text>
      <Section
        style={{
          borderLeft: "3px solid #087862",
          paddingLeft: "20px",
          marginBottom: "28px",
        }}
      >
        {message.split(/\r?\n/).map((line, index) => (
          <Text
            key={index}
            style={{
              ...paragraph,
              color: emailBrand.ink,
              margin: "0 0 8px",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {line || "\u00a0"}
          </Text>
        ))}
      </Section>
      <EmailButton href={`mailto:${email}`}>Reply to customer</EmailButton>
      <Text style={{ ...small, margin: "16px 0 0" }}>
        You can also reply directly to this email to reach the sender.
      </Text>
      <Text
        style={{
          ...small,
          margin: "24px 0 0",
          fontSize: "12px",
          wordBreak: "break-all",
        }}
      >
        Message reference: {reference}
      </Text>
    </EmailLayout>
  );
}

export function SandboxOrderEmail({
  reference,
  subtotalCents,
  currency,
  previewOnly,
}: OrderEmailProps) {
  const amount = `${(subtotalCents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  return (
    <EmailLayout
      preview="Your pantry sandbox payment is confirmed. No real charge or shipment."
      eyebrow="SANDBOX ORDER CONFIRMATION"
      title="Your test payment is confirmed."
      reason="You received this receipt for a sandbox checkout using this email address."
      previewOnly={previewOnly}
    >
      <Text style={paragraph}>
        Thank you for trying Iya Yusuf&apos;s Pantry. Your sandbox checkout has
        been completed successfully.
      </Text>
      <Section style={panel}>
        <Text
          style={{
            ...small,
            color: emailBrand.green,
            fontWeight: "bold",
            letterSpacing: "1px",
            margin: "0 0 10px",
          }}
        >
          TEST PAYMENT CONFIRMED
        </Text>
        <Text
          style={{
            color: emailBrand.ink,
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "36px",
            lineHeight: "44px",
            margin: "0 0 4px",
          }}
        >
          {amount}
        </Text>
        <Text style={{ ...small, margin: "0 0 20px" }}>
          Item subtotal · Sandbox checkout
        </Text>
        <Text style={{ ...small, margin: "0", wordBreak: "break-all" }}>
          Order reference
          <br />
          <strong style={{ color: emailBrand.ink }}>{reference}</strong>
        </Text>
      </Section>
      <Text style={{ ...paragraph, color: emailBrand.ink, fontWeight: "bold" }}>
        This is a test order.
      </Text>
      <Text style={paragraph}>
        No real payment was collected and no goods will be shipped.
      </Text>
      <EmailButton href={`${emailBrand.origin}/shop`}>
        Back to the pantry
      </EmailButton>
      <EmailSignoff />
    </EmailLayout>
  );
}

async function renderMessage(element: ReactElement) {
  const html = await render(element);
  return { html, text: toPlainText(html) };
}
export const newsletterEmail = (props: NewsletterEmailProps) =>
  renderMessage(<NewsletterEmail {...props} />);
export const contactEmail = (props: ContactEmailProps) =>
  renderMessage(<ContactEmail {...props} />);
export const sandboxOrderEmail = (props: OrderEmailProps) =>
  renderMessage(<SandboxOrderEmail {...props} />);

import type { CSSProperties, ReactNode } from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "react-email";

export const emailBrand = {
  origin: "https://www.iyayusufspantry.com",
  ink: "#29325f",
  green: "#087862",
  mint: "#e7f4ec",
  cream: "#fcfaf5",
  muted: "#586760",
};
export const paragraph: CSSProperties = {
  color: emailBrand.muted,
  fontSize: "16px",
  lineHeight: "27px",
  margin: "0 0 20px",
};
export const small: CSSProperties = {
  ...paragraph,
  fontSize: "13px",
  lineHeight: "21px",
};
export const panel: CSSProperties = {
  backgroundColor: emailBrand.mint,
  borderRadius: "12px",
  padding: "24px",
  margin: "24px 0",
};

export function EmailHeader() {
  return (
    <Section
      className="email-padding"
      style={{
        padding: "32px 40px",
        backgroundColor: emailBrand.cream,
        borderBottom: "1px solid #e2e8df",
      }}
    >
      <Link href={emailBrand.origin}>
        <Img
          src={`${emailBrand.origin}/brand/iya-yusufs-pantry-horizontal.png`}
          width="218"
          alt="Iya Yusuf's Pantry"
          style={{
            display: "block",
            width: "218px",
            maxWidth: "100%",
            height: "auto",
          }}
        />
      </Link>
      <Text
        style={{
          ...small,
          margin: "14px 0 0",
          fontSize: "11px",
          letterSpacing: "1.4px",
          color: emailBrand.green,
        }}
      >
        EXPERIENCE AUTHENTIC NIGERIAN FOODS.
      </Text>
    </Section>
  );
}

export function EmailFooter({
  reason,
  unsubscribeUrl,
}: {
  reason: string;
  unsubscribeUrl?: string;
}) {
  return (
    <Section
      className="email-padding"
      style={{
        padding: "28px 40px 32px",
        backgroundColor: emailBrand.cream,
        borderTop: "1px solid #e2e8df",
      }}
    >
      <Text
        style={{
          color: emailBrand.ink,
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "20px",
          lineHeight: "28px",
          margin: "0 0 16px",
        }}
      >
        A taste of home. A world of good food.
      </Text>
      <Text style={{ ...small, margin: "0 0 20px" }}>
        <Link href={`${emailBrand.origin}/shop`} style={footerLink}>
          Visit the pantry
        </Link>
        {" · "}
        <Link href={`${emailBrand.origin}/recipes`} style={footerLink}>
          Recipes
        </Link>
        {" · "}
        <Link href={`${emailBrand.origin}/contact`} style={footerLink}>
          Contact us
        </Link>
      </Text>
      <Text style={{ ...small, margin: "0 0 8px", fontSize: "12px" }}>
        {reason}
      </Text>
      {unsubscribeUrl && (
        <Text style={{ ...small, margin: "0 0 8px" }}>
          <Link href={unsubscribeUrl} style={footerLink}>
            Unsubscribe
          </Link>
        </Text>
      )}
      <Text style={{ ...small, margin: "0", fontSize: "12px" }}>
        Iya Yusuf&apos;s Pantry
      </Text>
    </Section>
  );
}
const footerLink: CSSProperties = {
  color: emailBrand.green,
  textDecoration: "underline",
};

export function EmailLayout({
  preview,
  eyebrow,
  title,
  reason,
  unsubscribeUrl,
  previewOnly,
  children,
}: {
  preview: string;
  eyebrow: string;
  title: string;
  reason: string;
  unsubscribeUrl?: string;
  previewOnly?: boolean;
  children: ReactNode;
}) {
  return (
    <Html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <style>{`@media only screen and (max-width: 620px) { .email-outer > tbody > tr > td { padding: 16px 8px !important; } .email-padding > tbody > tr > td { padding-left: 24px !important; padding-right: 24px !important; } .email-title { font-size: 30px !important; line-height: 36px !important; } }`}</style>
      </Head>
      <Preview>{previewOnly ? `Design preview · ${preview}` : preview}</Preview>
      <Body
        style={{
          margin: "0",
          backgroundColor: "#f1f2ed",
          fontFamily: "Arial, Helvetica, sans-serif",
          color: emailBrand.ink,
        }}
      >
        <Section className="email-outer" style={{ padding: "40px 12px" }}>
          <Container
            style={{
              maxWidth: "600px",
              width: "100%",
              backgroundColor: "#ffffff",
              border: "1px solid #dce3d9",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            <EmailHeader />
            <Section
              className="email-padding"
              style={{ padding: "36px 40px 40px" }}
            >
              {previewOnly && (
                <Text
                  style={{
                    ...small,
                    margin: "0 0 24px",
                    padding: "10px 14px",
                    border: "1px solid #dce3d9",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                >
                  Design preview · Sample details. No transaction or
                  subscription was created. Newsletter links are inactive.
                </Text>
              )}
              <Text
                style={{
                  color: emailBrand.green,
                  fontSize: "11px",
                  fontWeight: "bold",
                  letterSpacing: "2px",
                  lineHeight: "18px",
                  margin: "0 0 14px",
                }}
              >
                {eyebrow}
              </Text>
              <Heading
                as="h1"
                className="email-title"
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "36px",
                  lineHeight: "43px",
                  fontWeight: "normal",
                  letterSpacing: "-0.8px",
                  color: emailBrand.ink,
                  margin: "0 0 24px",
                }}
              >
                {title}
              </Heading>
              {children}
            </Section>
            <EmailFooter reason={reason} unsubscribeUrl={unsubscribeUrl} />
          </Container>
        </Section>
      </Body>
    </Html>
  );
}

export function EmailButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Button
      href={href}
      style={{
        backgroundColor: emailBrand.green,
        color: "#ffffff",
        fontSize: "15px",
        fontWeight: "bold",
        padding: "16px 24px",
        borderRadius: "8px",
        textDecoration: "none",
        textAlign: "center",
      }}
    >
      {children}
    </Button>
  );
}

export function EmailSignoff() {
  return (
    <>
      <Hr style={{ borderColor: "#e2e8df", margin: "28px 0 22px" }} />
      <Text style={{ ...small, margin: "0" }}>
        From our pantry to your home,
        <br />
        <strong style={{ color: emailBrand.ink }}>
          The Iya Yusuf&apos;s Pantry team
        </strong>
      </Text>
    </>
  );
}

import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { getImageProps } from "next/image";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { CartProvider } from "@/components/cart-provider";
import { SiteHeader, SiteFooter } from "@/components/site-shell";
import "./globals.css";
import { getContent } from "@/lib/content/server";
import { ContentProvider } from "@/components/content-provider";
import { AuthModalAccessibility } from "@/components/auth-controls";
import { AnimatedMain } from "@/components/animated-main";
export async function generateMetadata(): Promise<Metadata> {
  const copy = (await getContent()).copy["app/layout.tsx"];

  const { settings } = await getContent();
  return {
    title: {
      default: settings.businessName,
      template: copy["template-1"].replaceAll(
        "{0}",
        String(settings.businessName),
      ),
    },
    description: copy["copy-3"],
    icons: { icon: settings.icon.src },
    robots: { index: false, follow: false },
  };
}
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = await getContent();
  const copy = content.copy["app/layout.tsx"];
  const colors = content.settings.brandColors;
  const brandStyle = Object.fromEntries(
    Object.entries(colors)
      .filter(([, value]) => /^#[0-9a-f]{6}$/i.test(value))
      .map(([key, value]) => [`--brand-${key}`, value]),
  ) as CSSProperties;
  Object.assign(brandStyle, {
    "--pantry-auth-image": `url(${JSON.stringify(getImageProps({ src: content.brandPhotos.snackJars.src, alt: "", width: 450, height: 650 }).props.src)})`,
    "--pantry-auth-caption": JSON.stringify(content.settings.tagline),
  });
  return (
    <html lang="en" style={brandStyle}>
      <body>
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/"
          signUpFallbackRedirectUrl="/"
          appearance={{
            ...clerkAppearance,
            variables: {
              ...clerkAppearance.variables,
              colorPrimary: colors.deep,
              colorForeground: colors.ink,
              colorBackground: colors.paper,
              colorMuted: colors.mint,
            },
            options: {
              ...clerkAppearance.options,
              logoImageUrl: content.settings.logo.src,
            },
          }}
          localization={{
            signIn: {
              start: {
                title: copy["copy-4"],
                subtitle: copy["copy-5"],
              },
            },
            signUp: {
              start: {
                title: copy["copy-6"],
                subtitle: copy["copy-7"],
              },
            },
          }}
        >
          <ContentProvider content={content}>
            <AuthModalAccessibility />
            <CartProvider>
              <SiteHeader />
              <AnimatedMain>{children}</AnimatedMain>
              <SiteFooter />
            </CartProvider>
          </ContentProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

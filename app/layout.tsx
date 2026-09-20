import type { Metadata } from "next";
import { CartProvider } from "@/components/cart-provider";
import { SiteHeader, SiteFooter } from "@/components/site-shell";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Iya Yusuf's Pantry — A taste of home",
    template: "%s | Iya Yusuf's Pantry",
  },
  description:
    "A visual project-scope prototype for Iya Yusuf's Pantry. Sample products, content, and checkout; no real orders or payments.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <SiteHeader />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}

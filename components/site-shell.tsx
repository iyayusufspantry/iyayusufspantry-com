"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  ShoppingBag,
  Search,
  Menu,
  X,
  ArrowRight,
  Camera,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";

const navigation = [
  ["Shop", "/shop"],
  ["Recipes", "/recipes"],
  ["Blog", "/blog"],
  ["About", "/about"],
  ["Contact", "/contact"],
];
export function PrototypeBadge() {
  return (
    <span className="prototype-badge">
      <span className="size-1.5 rounded-full bg-neutral-500" />
      Project Scope Prototype
    </span>
  );
}
export function SiteHeader() {
  const pathname = usePathname();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="prototype-bar">
        <div className="site-container flex items-center justify-between gap-3">
          <PrototypeBadge />
          <Link
            href="/scope"
            className="inline-flex items-center gap-1.5 text-xs"
          >
            View project scope <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
      <header className="site-header">
        <div className="site-container flex h-21 items-center justify-between">
          <Link href="/" aria-label="Simbiat home" className="wordmark">
            simbiat<span className="wordmark-dot">.</span>
          </Link>
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-8 md:flex"
          >
            {navigation.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname.startsWith(href) ? "page" : undefined}
                className="nav-link"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/search" aria-label="Search the store">
                <Search size={20} />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link
                href="/cart"
                aria-label={`Shopping bag, ${count} items`}
                className="relative"
              >
                <ShoppingBag size={20} />
                {count > 0 && <span className="cart-count">{count}</span>}
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        {open && (
          <nav
            id="mobile-menu"
            aria-label="Mobile navigation"
            className="mobile-menu"
          >
            {navigation.map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}>
                {label}
                <ArrowUpRight size={15} />
              </Link>
            ))}
            <Link href="/prototype" onClick={() => setOpen(false)}>
              All prototype screens
              <ArrowUpRight size={15} />
            </Link>
          </nav>
        )}
      </header>
    </>
  );
}
export function Newsletter() {
  return (
    <section className="newsletter">
      <div>
        <span className="eyebrow">A LITTLE SOMETHING FROM HOME</span>
        <h2>Good food. Fresh stories. Your inbox.</h2>
        <p>
          Recipes, new discoveries, and a little inspiration for your kitchen.
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast("Prototype only — newsletter integration is not connected.");
        }}
        className="newsletter-form"
      >
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="newsletter-email">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            placeholder="Your email address"
            required
            autoComplete="off"
          />
          <Button type="submit" aria-label="Subscribe to newsletter">
            <ArrowRight />
          </Button>
        </div>
        <span className="fine-print">
          Newsletter preview · No email is saved or sent.
        </span>
      </form>
    </section>
  );
}
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="footer-grid">
          <div>
            <Link href="/" className="wordmark">
              simbiat.
            </Link>
            <p className="mt-4 max-w-65 text-sm leading-6 text-neutral-500">
              A taste of home.
              <br />A world of good food.
            </p>
            <div className="mt-5 flex gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Instagram placeholder"
                onClick={() =>
                  toast("Prototype only — Instagram link to be supplied.")
                }
              >
                <Camera />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Facebook placeholder"
                onClick={() =>
                  toast("Prototype only — Facebook link to be supplied.")
                }
              >
                <UsersRound />
              </Button>
            </div>
          </div>
          <div>
            <h3>Explore</h3>
            {[
              ["Shop all products", "/shop"],
              ["Recipes", "/recipes"],
              ["Journal / Blog", "/blog"],
              ["Our story", "/about"],
            ].map(([title, href]) => (
              <Link key={href} href={href}>
                {title}
              </Link>
            ))}
          </div>
          <div>
            <h3>Here to help</h3>
            {[
              ["Contact us", "/contact"],
              ["Shipping information", "/shipping"],
              ["Privacy policy", "/privacy"],
              ["Terms & conditions", "/terms"],
            ].map(([title, href]) => (
              <Link key={href} href={href}>
                {title}
              </Link>
            ))}
          </div>
          <div>
            <h3>A work in progress</h3>
            <p className="text-sm leading-6 text-neutral-500">
              Thoughtfully prepared for
              <br />
              our scope conversation.
            </p>
            <Link href="/scope">
              Project scope <ArrowUpRight size={13} />
            </Link>
            <Link href="/prototype">
              Explore all screens <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Simbiat · Visual scope prototype</span>
          <span>
            Sample products, prices, and copy. Final details to be confirmed.
          </span>
        </div>
      </div>
    </footer>
  );
}

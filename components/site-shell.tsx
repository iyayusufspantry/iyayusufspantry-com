"use client";
import { useContent } from "@/components/content-provider";
import Link from "next/link";
import Image from "next/image";
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
import { selectCartCount } from "@/lib/cart-store";
import { AuthControls } from "@/components/auth-controls";

export function PrototypeBadge() {
  const { copy: allCopy } = useContent();
  const copy = allCopy["components/site-shell.tsx"];

  return (
    <span className="prototype-badge">
      <span className="size-1.5 rounded-full bg-neutral-500" />{" "}
      {copy["copy-6"]}{" "}
    </span>
  );
}
export function SiteHeader() {
  const { copy: allCopy } = useContent();
  const copy = allCopy["components/site-shell.tsx"];
  const { navigation: menus, settings } = useContent();
  const navigation = menus.main;

  const pathname = usePathname();
  const count = useCart(selectCartCount);
  const [open, setOpen] = useState(false);
  return (
    <>
      <a href="#main-content" className="skip-link">
        {" "}
        {copy["copy-7"]}{" "}
      </a>
      <div className="prototype-bar">
        <div className="site-container flex items-center justify-between gap-3">
          <PrototypeBadge />
          <Link
            href="/scope"
            className="inline-flex items-center gap-1.5 text-xs"
          >
            {" "}
            {copy["copy-8"]} <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
      <header className="site-header">
        <div className="site-container flex h-21 items-center justify-between">
          <Link href="/" aria-label={copy["copy-9"]} className="wordmark">
            <Image
              src={settings.logo.src}
              alt={copy["copy-10"]}
              width={464}
              height={104}
              className="brand-logo"
              unoptimized
            />
          </Link>
          <nav
            aria-label={copy["copy-11"]}
            className="hidden items-center gap-6 lg:flex"
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
            <div className="mr-2 hidden lg:block">
              <AuthControls />
            </div>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/search" aria-label={copy["copy-12"]}>
                <Search size={20} />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link
                href="/cart"
                aria-label={copy["template-1"].replaceAll("{0}", String(count))}
                className="relative"
              >
                <ShoppingBag size={20} />
                {count > 0 && <span className="cart-count">{count}</span>}
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label={open ? copy["copy-13"] : copy["copy-14"]}
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
            aria-label={copy["copy-15"]}
            className="mobile-menu lg:hidden"
          >
            {navigation.map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}>
                {label}
                <ArrowUpRight size={15} />
              </Link>
            ))}
            <Link href="/prototype" onClick={() => setOpen(false)}>
              {" "}
              {copy["copy-16"]} <ArrowUpRight size={15} />
            </Link>
            <div className="mt-3 border-t border-border pt-4">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                {" "}
                {copy["copy-17"]}{" "}
              </p>
              <AuthControls />
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
export function Newsletter({ enabled = false }: { enabled?: boolean }) {
  const { copy: allCopy } = useContent();
  const copy = allCopy["components/site-shell.tsx"];
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  return (
    <section className="newsletter">
      <div>
        <span className="eyebrow">{copy["copy-18"]}</span>
        <h2>{copy["copy-19"]}</h2>
        <p> {copy["copy-20"]} </p>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!enabled) {
            toast(copy["copy-21"]);
            return;
          }
          if (busy) return;
          const form = e.currentTarget;
          const data = new FormData(form);
          setBusy(true);
          setStatus("");
          try {
            const response = await fetch("/api/newsletter", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: data.get("email"),
                consent: data.get("consent") === "on",
                website: data.get("website"),
              }),
              signal: AbortSignal.timeout(15000),
            });
            const result = await response.json();
            if (!response.ok)
              throw new Error(result.error || "Please try again.");
            setStatus(result.message);
            form.reset();
          } catch (error) {
            setStatus(
              error instanceof Error ? error.message : "Please try again.",
            );
          } finally {
            setBusy(false);
          }
        }}
        className="newsletter-form"
      >
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="newsletter-email">
            {" "}
            {copy["copy-22"]}{" "}
          </label>
          <input
            id="newsletter-email"
            name="email"
            maxLength={254}
            type="email"
            placeholder={copy["copy-23"]}
            required
            autoComplete="off"
          />
          <Button type="submit" aria-label={copy["copy-24"]} disabled={busy}>
            <ArrowRight />
          </Button>
        </div>
        <div hidden aria-hidden="true">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        {enabled ? (
          <label className="fine-print mt-3 flex gap-2">
            <input type="checkbox" name="consent" required />I agree to receive
            pantry news and recipes by email. I can unsubscribe at any time.
          </label>
        ) : (
          <span className="fine-print">{copy["copy-25"]}</span>
        )}
        <p role="status" className="mt-3 text-sm">
          {status}
        </p>
      </form>
    </section>
  );
}
export function SiteFooter() {
  const { navigation: menus, settings } = useContent();
  const { copy: allCopy } = useContent();
  const copy = allCopy["components/site-shell.tsx"];

  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="footer-grid">
          <div>
            <Link href="/" aria-label={copy["copy-26"]} className="wordmark">
              <Image
                src={settings.logo.src}
                alt={settings.businessName}
                width={464}
                height={104}
                className="brand-logo"
                unoptimized
              />
            </Link>
            <p className="mt-4 max-w-65 text-sm leading-6">
              {" "}
              {copy["copy-28"]} <br />
              {copy["copy-29"]}{" "}
            </p>
            <div className="mt-5 flex gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label={copy["copy-30"]}
                onClick={() => toast(copy["copy-31"])}
              >
                <Camera />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label={copy["copy-32"]}
                onClick={() => toast(copy["copy-33"])}
              >
                <UsersRound />
              </Button>
            </div>
          </div>
          <div>
            <h3>{copy["copy-34"]}</h3>
            {menus.explore.map(([title, href]) => (
              <Link key={href} href={href}>
                {title}
              </Link>
            ))}
          </div>
          <div>
            <h3>{copy["copy-39"]}</h3>
            {menus.help.map(([title, href]) => (
              <Link key={href} href={href}>
                {title}
              </Link>
            ))}
          </div>
          <div>
            <h3>{copy["copy-44"]}</h3>
            <p className="text-sm leading-6">
              {" "}
              {copy["copy-45"]} <br /> {copy["copy-46"]}{" "}
            </p>
            <Link href="/scope">
              {" "}
              {copy["copy-47"]} <ArrowUpRight size={13} />
            </Link>
            <Link href="/prototype">
              {" "}
              {copy["copy-48"]} <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{copy["copy-49"]}</span>
          <span> {copy["copy-50"]} </span>
        </div>
      </div>
    </footer>
  );
}

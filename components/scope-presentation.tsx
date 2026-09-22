"use client";
import { useContent } from "@/components/content-provider";
import type { ReactNode } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleHelp,
  FileText,
  Layers3,
  LockKeyhole,
  X,
  Monitor,
  ShoppingBag,
  BookOpen,
  Package,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/catalog";
import { useLoadDemoCart } from "@/components/cart-provider";

export function ScopeSection({
  number,
  title,
  children,
  id,
}: {
  number: string;
  title: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section className="scope-section" id={id}>
      <div className="scope-section-title">
        <span>{number}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
export function ScopeFeatureCard({
  title,
  description,
  index,
}: {
  title: string;
  description: string;
  index: number;
}) {
  const { copy: allCopy } = useContent();
  const copy = allCopy["components/scope-presentation.tsx"];

  const Icon = [Monitor, ShoppingBag, BookOpen, Package][index % 4];
  return (
    <article className="scope-feature">
      <Icon size={20} strokeWidth={1.4} />
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="scope-feature-status">
        <Check size={12} /> {copy["copy-1"]}{" "}
      </span>
    </article>
  );
}
function QuestionsList() {
  const { openDecisions } = useContent();

  return (
    <ol className="questions-list">
      {openDecisions.map(([title, question], index) => (
        <li key={title}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div>
            <h3>{title}</h3>
            <p>{question}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
export function ScopeQuestions() {
  const { copy: allCopy } = useContent();
  const copy = allCopy["components/scope-presentation.tsx"];

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="outline">
          <CircleHelp /> {copy["copy-2"]}{" "}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <div className="dialog-heading">
            <span className="eyebrow">{copy["copy-3"]}</span>
            <Dialog.Title>{copy["copy-4"]}</Dialog.Title>
            <Dialog.Description> {copy["copy-5"]} </Dialog.Description>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="dialog-close"
                aria-label={copy["copy-6"]}
              >
                <X />
              </Button>
            </Dialog.Close>
          </div>
          <div
            className="dialog-scroll"
            tabIndex={0}
            role="region"
            aria-label={copy["copy-7"]}
          >
            <QuestionsList />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function ScopePage() {
  const {
    scopeFeatures,
    clientMaterials,
    exclusions,
    copy: allCopy,
  } = useContent();
  const copy = allCopy["components/scope-presentation.tsx"];

  const flow = [
    [copy["copy-8"], "/"],
    [copy["copy-9"], "/shop"],
    [copy["copy-10"], "/shop/plantain-chips"],
    [copy["copy-11"], "/cart"],
    [copy["copy-12"], "/checkout"],
    [copy["copy-13"], "/order-confirmation"],
  ];
  return (
    <div className="site-container page-bottom scope-page">
      <div className="scope-hero">
        <div>
          <span className="eyebrow">
            <FileText size={14} /> {copy["copy-14"]}{" "}
          </span>
          <h1>
            {" "}
            {copy["copy-15"]} <span>{copy["copy-16"]}</span>
          </h1>
          <p> {copy["copy-17"]} </p>
          <div className="flex flex-wrap gap-3 mt-7">
            <Button asChild>
              <Link href="/prototype">
                {" "}
                {copy["copy-18"]} <ArrowUpRight />
              </Link>
            </Button>
            <ScopeQuestions />
          </div>
        </div>
        <div className="scope-overview">
          <Layers3 size={28} strokeWidth={1.2} />
          <span>{copy["copy-19"]}</span>
          <dl>
            <div>
              <dt>{copy["copy-20"]}</dt>
              <dd>{copy["copy-21"]}</dd>
            </div>
            <div>
              <dt>{copy["copy-22"]}</dt>
              <dd>{copy["copy-23"]}</dd>
            </div>
            <div>
              <dt>{copy["copy-24"]}</dt>
              <dd>{copy["copy-25"]}</dd>
            </div>
            <div>
              <dt>{copy["copy-26"]}</dt>
              <dd>{copy["copy-27"]}</dd>
            </div>
          </dl>
          <p>{copy["copy-28"]}</p>
        </div>
      </div>
      <div className="prototype-notice">
        <FileText size={23} strokeWidth={1.4} />
        <div>
          <h2> {copy["copy-29"]} </h2>
          <p> {copy["copy-30"]} </p>
          <p> {copy["copy-31"]} </p>
        </div>
      </div>
      <nav className="scope-nav" aria-label={copy["copy-32"]}>
        <a href="#objective">{copy["copy-33"]}</a>
        <a href="#customer-flow">{copy["copy-34"]}</a>
        <a href="#included">{copy["copy-35"]}</a>
        <a href="#security">{copy["copy-36"]}</a>
        <a href="#materials">{copy["copy-37"]}</a>
        <a href="#decisions">{copy["copy-38"]}</a>
      </nav>
      <ScopeSection number="01" title={copy["copy-39"]} id="objective">
        <p className="scope-lead"> {copy["copy-40"]} </p>
        <p className="scope-body-copy"> {copy["copy-41"]} </p>
      </ScopeSection>
      <ScopeSection number="02" title={copy["copy-42"]} id="customer-flow">
        <p className="scope-body-copy"> {copy["copy-43"]} </p>
        <ol className="customer-flow">
          {flow.map(([title, href], index) => (
            <li key={title}>
              <Link href={href}>
                <span>
                  {copy["copy-44"]}
                  {index + 1}
                </span>
                <strong>{title}</strong>
                <ArrowUpRight size={14} />
              </Link>
              {index < flow.length - 1 && (
                <ArrowRight className="flow-arrow" size={16} />
              )}
            </li>
          ))}
        </ol>
        <div className="content-flows">
          <div>
            <BookOpen size={21} />
            <h3>{copy["copy-45"]}</h3>
            <p>
              <Link href="/recipes">{copy["copy-46"]}</Link>
              <ArrowRight size={14} /> {copy["copy-47"]}{" "}
              <ArrowRight size={14} />
              <Link href="/shop">{copy["copy-48"]}</Link>
            </p>
          </div>
          <div>
            <FileText size={21} />
            <h3>{copy["copy-49"]}</h3>
            <p>
              <Link href="/blog">{copy["copy-50"]}</Link>
              <ArrowRight size={14} /> {copy["copy-51"]}{" "}
              <ArrowRight size={14} />
              <Link href="/">{copy["copy-52"]}</Link>
            </p>
          </div>
        </div>
      </ScopeSection>
      <ScopeSection number="03" title={copy["copy-53"]}>
        <div className="assumption-grid">
          {[
            copy["copy-54"],
            copy["copy-55"],
            copy["copy-56"],
            copy["copy-57"],
            copy["copy-58"],
            copy["copy-59"],
            copy["copy-60"],
            copy["copy-61"],
          ].map((item) => (
            <div key={item}>
              <Check size={16} />
              {item}
            </div>
          ))}
        </div>
        <p className="fine-print mt-5"> {copy["copy-62"]} </p>
      </ScopeSection>
      <ScopeSection number="04" title={copy["copy-63"]} id="included">
        <p className="scope-body-copy"> {copy["copy-64"]} </p>
        <div className="scope-feature-grid">
          {scopeFeatures.map(([title, description], index) => (
            <ScopeFeatureCard
              key={title}
              title={title}
              description={description}
              index={index}
            />
          ))}
        </div>
        <p className="notice mt-6"> {copy["copy-65"]} </p>
      </ScopeSection>
      <ScopeSection number="05" title={copy["copy-66"]} id="security">
        <div className="security-grid">
          <div className="security-statement">
            <ShieldCheck size={35} strokeWidth={1.2} />
            <h3> {copy["copy-67"]} </h3>
            <p> {copy["copy-68"]} </p>
          </div>
          <div className="security-points">
            {[
              [copy["copy-69"], copy["copy-70"]],
              [copy["copy-71"], copy["copy-72"]],
              [copy["copy-73"], copy["copy-74"]],
              [copy["copy-75"], copy["copy-76"]],
            ].map(([title, text]) => (
              <div key={title}>
                <LockKeyhole size={17} />
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScopeSection>
      <ScopeSection number="06" title={copy["copy-77"]}>
        <p className="scope-lead">{copy["copy-78"]}</p>
        <p className="scope-body-copy"> {copy["copy-79"]} </p>
        <div className="content-management-tags">
          {[
            copy["copy-80"],
            copy["copy-81"],
            copy["copy-82"],
            copy["copy-83"],
          ].map((item) => (
            <span key={item}>
              <Check size={14} />
              {item}
            </span>
          ))}
        </div>
      </ScopeSection>
      <ScopeSection number="07" title={copy["copy-84"]} id="materials">
        <p className="scope-body-copy"> {copy["copy-85"]} </p>
        <div className="materials-checklist">
          {clientMaterials.map((item, index) => (
            <label key={item} htmlFor={`material-${index}`}>
              <input type="checkbox" id={`material-${index}`} />
              {item}
            </label>
          ))}
        </div>
      </ScopeSection>
      <ScopeSection number="08" title={copy["copy-86"]} id="decisions">
        <p className="scope-body-copy"> {copy["copy-87"]} </p>
        <QuestionsList />
      </ScopeSection>
      <ScopeSection number="09" title={copy["copy-88"]}>
        <p className="scope-body-copy"> {copy["copy-89"]} </p>
        <div className="exclusions-grid">
          {exclusions.map((item) => (
            <div key={item}>
              <span>{copy["copy-90"]}</span>
              {item}
            </div>
          ))}
        </div>
      </ScopeSection>
      <section className="scope-closing">
        <span className="eyebrow">{copy["copy-91"]}</span>
        <h2>{copy["copy-92"]}</h2>
        <p> {copy["copy-93"]} </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">
              {" "}
              {copy["copy-94"]} <ArrowUpRight />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <a href="#customer-flow">
              {" "}
              {copy["copy-95"]} <ArrowRight />
            </a>
          </Button>
          <ScopeQuestions />
        </div>
      </section>
    </div>
  );
}
export function PrototypeDirectory() {
  const { prototypeScreens, copy: allCopy } = useContent();
  const copy = allCopy["components/scope-presentation.tsx"];

  const loadDemo = useLoadDemoCart();
  return (
    <div className="site-container page-bottom">
      <PageHeading
        eyebrow={copy["copy-96"]}
        title={copy["copy-97"]}
        description={copy["copy-98"]}
      />
      <div className="notice directory-note">
        <div>
          <h2>{copy["copy-99"]}</h2>
          <p> {copy["copy-100"]} </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={loadDemo}>
            {" "}
            {copy["copy-101"]}{" "}
          </Button>
          <Button asChild>
            <Link href="/scope">
              {" "}
              {copy["copy-102"]} <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
      <div className="directory-grid">
        {prototypeScreens.map((screen, index) => (
          <Link key={screen.href} href={screen.href} className="directory-card">
            <div className="flex justify-between">
              <span className="eyebrow">
                {String(index + 1).padStart(2, "0")} {copy["copy-103"]}{" "}
                {screen.group}
              </span>
              <ArrowUpRight size={20} strokeWidth={1.3} />
            </div>
            <h2>{screen.name}</h2>
            <p>{screen.purpose}</p>
            <div className="flex justify-between gap-2 mt-auto pt-7">
              <span className="badge">{copy["copy-104"]}</span>
              <code>
                {screen.href.length > 30
                  ? screen.href.split("/").slice(0, 2).join("/") + "/[slug]"
                  : screen.href}
              </code>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

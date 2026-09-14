"use client";
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
import { useCart } from "@/components/cart-provider";
import {
  openDecisions,
  scopeFeatures,
  clientMaterials,
  exclusions,
  prototypeScreens,
} from "@/data/scope";
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
  const Icon = [Monitor, ShoppingBag, BookOpen, Package][index % 4];
  return (
    <article className="scope-feature">
      <Icon size={20} strokeWidth={1.4} />
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="scope-feature-status">
        <Check size={12} />
        Proposed scope
      </span>
    </article>
  );
}
function QuestionsList() {
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
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="outline">
          <CircleHelp />
          Scope questions
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <div className="dialog-heading">
            <span className="eyebrow">BEFORE FINAL PRICING</span>
            <Dialog.Title>Let’s confirm the details.</Dialog.Title>
            <Dialog.Description>
              These decisions may affect the final project scope, timeline, and
              price.
            </Dialog.Description>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="dialog-close"
                aria-label="Close scope questions"
              >
                <X />
              </Button>
            </Dialog.Close>
          </div>
          <div
            className="dialog-scroll"
            tabIndex={0}
            role="region"
            aria-label="Open scope decisions"
          >
            <QuestionsList />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function ScopePage() {
  const flow = [
    ["Discover", "/"],
    ["Browse", "/shop"],
    ["Product", "/shop/plantain-chips"],
    ["Cart", "/cart"],
    ["Secure Checkout", "/checkout"],
    ["Confirmation", "/order-confirmation"],
  ];
  return (
    <div className="site-container page-bottom scope-page">
      <div className="scope-hero">
        <div>
          <span className="eyebrow">
            <FileText size={14} />
            PREPARED FOR SIMBIAT · DISCOVERY FOLLOW-UP
          </span>
          <h1>
            Proposed E-Commerce Website <span>— Project Scope</span>
          </h1>
          <p>
            Visual scope prepared following our initial discovery conversation.
          </p>
          <div className="flex flex-wrap gap-3 mt-7">
            <Button asChild>
              <Link href="/prototype">
                Explore the prototype
                <ArrowUpRight />
              </Link>
            </Button>
            <ScopeQuestions />
          </div>
        </div>
        <div className="scope-overview">
          <Layers3 size={28} strokeWidth={1.2} />
          <span>AT A GLANCE</span>
          <dl>
            <div>
              <dt>Initial products</dt>
              <dd>~15</dd>
            </div>
            <div>
              <dt>Product categories</dt>
              <dd>~5</dd>
            </div>
            <div>
              <dt>Checkout approach</dt>
              <dd>Guest</dd>
            </div>
            <div>
              <dt>Project stage</dt>
              <dd>Scope review</dd>
            </div>
          </dl>
          <p>Proposed direction. Final pricing follows scope confirmation.</p>
        </div>
      </div>
      <div className="prototype-notice">
        <FileText size={23} strokeWidth={1.4} />
        <div>
          <h2>
            This prototype is a visual project-scoping tool, not the final
            website.
          </h2>
          <p>
            The layout, imagery, wording, colors, technical architecture,
            integrations, and features may change after scope approval.
          </p>
          <p>
            No real customer data or payments are processed by this prototype.
          </p>
        </div>
      </div>
      <nav className="scope-nav" aria-label="Scope sections">
        <a href="#objective">Objective</a>
        <a href="#customer-flow">Customer flow</a>
        <a href="#included">Proposed scope</a>
        <a href="#security">Security</a>
        <a href="#materials">Your materials</a>
        <a href="#decisions">Open decisions</a>
      </nav>
      <ScopeSection number="01" title="Project objective" id="objective">
        <p className="scope-lead">
          Build a professional, secure, mobile-friendly e-commerce experience
          for approximately 15 initial African food products and snacks, with
          room for the catalog and content strategy to grow.
        </p>
        <p className="scope-body-copy">
          The aim is a clear, welcoming place to discover the business,
          understand the products, find cooking inspiration, and shop with
          confidence.
        </p>
      </ScopeSection>
      <ScopeSection
        number="02"
        title="Proposed customer experience"
        id="customer-flow"
      >
        <p className="scope-body-copy">
          A straightforward guest shopping journey. Select any step to preview
          its screen.
        </p>
        <ol className="customer-flow">
          {flow.map(([title, href], index) => (
            <li key={title}>
              <Link href={href}>
                <span>0{index + 1}</span>
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
            <h3>Recipe discovery</h3>
            <p>
              <Link href="/recipes">Recipes</Link>
              <ArrowRight size={14} />
              Educational content
              <ArrowRight size={14} />
              <Link href="/shop">Relevant products</Link>
            </p>
          </div>
          <div>
            <FileText size={21} />
            <h3>Stories & education</h3>
            <p>
              <Link href="/blog">Blog</Link>
              <ArrowRight size={14} />
              Business / educational content
              <ArrowRight size={14} />
              <Link href="/">Store discovery</Link>
            </p>
          </div>
        </div>
      </ScopeSection>
      <ScopeSection number="03" title="Initial catalog assumptions">
        <div className="assumption-grid">
          {[
            "Approximately 15 products",
            "Approximately 5 product categories",
            "Product size variants where required",
            "Dietary variants where required",
            "Client supplies final product photos",
            "Client supplies / approves product descriptions",
            "Client supplies final prices",
            "Client supplies shipping rules",
          ].map((item) => (
            <div key={item}>
              <Check size={16} />
              {item}
            </div>
          ))}
        </div>
        <p className="fine-print mt-5">
          Sample products and dietary labels illustrate possible configurations.
          They do not represent a confirmed inventory.
        </p>
      </ScopeSection>
      <ScopeSection
        number="04"
        title="Included in proposed scope"
        id="included"
      >
        <p className="scope-body-copy">
          These capabilities form the proposed starting point for discussion and
          pricing. Production integrations are represented visually here.
        </p>
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
        <p className="notice mt-6">
          Payment provider, hosting provider, CMS, authentication approach, and
          analytics implementation are not finalized in this prototype. The
          prototype stack does not commit the production architecture.
        </p>
      </ScopeSection>
      <ScopeSection
        number="05"
        title="A thoughtful approach to security"
        id="security"
      >
        <div className="security-grid">
          <div className="security-statement">
            <ShieldCheck size={35} strokeWidth={1.2} />
            <h3>
              Handle less sensitive information. Rely on established providers.
            </h3>
            <p>
              The production implementation should minimize how much sensitive
              information the custom application handles directly.
            </p>
          </div>
          <div className="security-points">
            {[
              [
                "Payment processing",
                "Use an established third-party payment provider such as Stripe, subject to approval. Full card data should not be stored by the custom application.",
              ],
              [
                "Administrative access",
                "Use established authentication and security practices for administrative access. The approach and provider remain to be confirmed.",
              ],
              [
                "Practical safeguards",
                "Use appropriate security practices and trusted providers. Security cannot be represented as an absolute guarantee.",
              ],
              [
                "Customer privacy",
                "Guest checkout is the default prototype flow. Customer accounts remain an open decision rather than a committed feature.",
              ],
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
      <ScopeSection number="06" title="Content management">
        <p className="scope-lead">Everyday updates should be everyday work.</p>
        <p className="scope-body-copy">
          The production website is expected to support routine management of
          products, categories, recipes, and blog posts without requiring a
          developer for every ordinary content change. The content platform,
          administrative roles, and editing workflow will be agreed during
          scoping.
        </p>
        <div className="content-management-tags">
          {["Products", "Categories", "Recipes", "Blog posts"].map((item) => (
            <span key={item}>
              <Check size={14} />
              {item}
            </span>
          ))}
        </div>
      </ScopeSection>
      <ScopeSection
        number="07"
        title="Client-provided materials"
        id="materials"
      >
        <p className="scope-body-copy">
          A checklist of materials needed to turn this neutral prototype into a
          store that feels like your business. Checkboxes are for this review
          session only.
        </p>
        <div className="materials-checklist">
          {clientMaterials.map((item, index) => (
            <label key={item} htmlFor={`material-${index}`}>
              <input type="checkbox" id={`material-${index}`} />
              {item}
            </label>
          ))}
        </div>
      </ScopeSection>
      <ScopeSection
        number="08"
        title="Open items / decisions required"
        id="decisions"
      >
        <p className="scope-body-copy">
          These decisions may affect the final project scope, timeline, and
          price.
        </p>
        <QuestionsList />
      </ScopeSection>
      <ScopeSection number="09" title="Not included / not yet confirmed">
        <p className="scope-body-copy">
          The following capabilities should not automatically be assumed. Any
          additions need a separate scope discussion before they are included in
          pricing.
        </p>
        <div className="exclusions-grid">
          {exclusions.map((item) => (
            <div key={item}>
              <span>—</span>
              {item}
            </div>
          ))}
        </div>
      </ScopeSection>
      <section className="scope-closing">
        <span className="eyebrow">THE NEXT STEP</span>
        <h2>Scope Review</h2>
        <p>
          Please review the proposed pages, customer flow, and functionality.
          Features can be added, removed, or simplified before the project scope
          and price are finalized.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">
              Review storefront
              <ArrowUpRight />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <a href="#customer-flow">
              View customer flow
              <ArrowRight />
            </a>
          </Button>
          <ScopeQuestions />
        </div>
      </section>
    </div>
  );
}
export function PrototypeDirectory() {
  const { loadDemo } = useCart();
  return (
    <div className="site-container page-bottom">
      <PageHeading
        eyebrow="SIMBIAT · PRESENTATION DIRECTORY"
        title="One project. Every perspective."
        description="A guided collection of the proposed screens. Explore the customer experience, review the scope, and capture the layouts for your conversation."
      />
      <div className="notice directory-note">
        <div>
          <h2>Ready for your walkthrough</h2>
          <p>
            Every screen uses sample content. Load a sample cart to populate the
            shopping flow, or begin with the project scope.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={loadDemo}>
            Load sample cart
          </Button>
          <Button asChild>
            <Link href="/scope">
              Review scope
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
      <div className="directory-grid">
        {prototypeScreens.map((screen, index) => (
          <Link key={screen.href} href={screen.href} className="directory-card">
            <div className="flex justify-between">
              <span className="eyebrow">
                {String(index + 1).padStart(2, "0")} / {screen.group}
              </span>
              <ArrowUpRight size={20} strokeWidth={1.3} />
            </div>
            <h2>{screen.name}</h2>
            <p>{screen.purpose}</p>
            <div className="flex justify-between gap-2 mt-auto pt-7">
              <span className="badge">Scope Prototype</span>
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

"use client";
import { Mail, Phone, MessageCircle, ArrowRight, Plus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { PageHeading } from "@/components/catalog";
import { Button } from "@/components/ui/button";
const faqs = [
  [
    "Where do you ship?",
    "Shipping regions and delivery methods are still being confirmed. The finished website will clearly explain where delivery is available.",
  ],
  [
    "How do I find ingredient and allergen information?",
    "Each final product page is expected to include client-approved ingredients, allergen information, and relevant dietary options. Current labels are illustrative only.",
  ],
  [
    "Can I get help choosing a product?",
    "The proposed contact form and approved business contact channels will give customers a way to ask questions. Contact details have not yet been supplied.",
  ],
  [
    "Are these products available to order now?",
    "This is a visual scope prototype. Products, prices, and stock labels are examples; no orders can be placed here.",
  ],
];
export function ContactPage() {
  return (
    <div className="site-container page-bottom">
      <PageHeading
        eyebrow="LET’S START A CONVERSATION"
        title="We’d love to hear from you."
        description="A question about an ingredient, an order, or something else? There’s a place for it here."
      />
      <div className="contact-grid">
        <form
          className="contact-form"
          onSubmit={(e) => {
            e.preventDefault();
            toast(
              "Prototype only — contact form integration will be implemented during development.",
            );
          }}
        >
          <h2>Send a little hello</h2>
          <p className="text-sm text-neutral-500 mb-7">
            Form preview · Please use sample details only.
          </p>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="contact-name">Name</label>
              <input
                id="contact-name"
                placeholder="Your name"
                required
                autoComplete="off"
              />
            </div>
            <div className="field">
              <label htmlFor="contact-email">Email address</label>
              <input
                id="contact-email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="off"
              />
            </div>
            <div className="field col-span-2">
              <label htmlFor="contact-subject">What can we help with?</label>
              <select id="contact-subject" defaultValue="general">
                <option value="general">General question</option>
                <option value="product">Product information</option>
                <option value="order">Order question</option>
                <option value="other">Something else</option>
              </select>
            </div>
            <div className="field col-span-2">
              <label htmlFor="contact-message">Your message</label>
              <textarea
                id="contact-message"
                placeholder="Tell us a little more…"
                rows={6}
                required
              />
            </div>
          </div>
          <Button type="submit" className="mt-6">
            Send message
            <ArrowRight />
          </Button>
          <p className="fine-print mt-4">
            No message is transmitted or stored by this prototype.
          </p>
        </form>
        <aside className="contact-details">
          <span className="eyebrow">OTHER WAYS TO CONNECT</span>
          <h2>
            Good conversations
            <br />
            start somewhere.
          </h2>
          <p>
            Final contact channels will be added when the business details are
            confirmed.
          </p>
          {[
            {
              icon: Mail,
              title: "Email",
              detail: "hello@your-business.example",
            },
            {
              icon: Phone,
              title: "Phone",
              detail: "Phone number to be supplied",
            },
            {
              icon: MessageCircle,
              title: "WhatsApp",
              detail: "Business WhatsApp to be confirmed",
            },
          ].map(({ icon: Icon, title, detail }) => (
            <div className="contact-channel" key={title}>
              <Icon size={20} strokeWidth={1.4} />
              <div>
                <h3>{title}</h3>
                <span>{detail}</span>
                <small>Placeholder</small>
              </div>
            </div>
          ))}
          <p className="fine-print">
            Response times and opening hours need client approval.
          </p>
        </aside>
      </div>
      <section className="faq-section">
        <div>
          <span className="eyebrow">A FEW HELPFUL ANSWERS</span>
          <h2>Before you ask.</h2>
          <p>Sample questions for the finished store.</p>
          <Link className="text-link mt-5" href="/shipping">
            Shipping information
            <ArrowRight size={15} />
          </Link>
        </div>
        <div>
          {faqs.map(([question, answer]) => (
            <details key={question}>
              <summary>
                {question}
                <Plus size={16} />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

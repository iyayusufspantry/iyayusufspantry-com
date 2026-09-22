"use client";
import { useContent } from "@/components/content-provider";
import { Mail, Phone, MessageCircle, ArrowRight, Plus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { PageHeading } from "@/components/catalog";
import { Button } from "@/components/ui/button";

export function ContactPage() {
  const { copy: allCopy } = useContent();
  const copy = allCopy["components/contact.tsx"];
  const { faqs, settings } = useContent();

  return (
    <div className="site-container page-bottom">
      <PageHeading
        eyebrow={copy["copy-9"]}
        title={copy["copy-10"]}
        description={copy["copy-11"]}
      />
      <div className="contact-grid">
        <form
          className="contact-form"
          onSubmit={(e) => {
            e.preventDefault();
            toast(copy["copy-12"]);
          }}
        >
          <h2>{copy["copy-13"]}</h2>
          <p className="text-sm text-neutral-500 mb-7"> {copy["copy-14"]} </p>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="contact-name">{copy["copy-15"]}</label>
              <input
                id="contact-name"
                placeholder={copy["copy-16"]}
                required
                autoComplete="off"
              />
            </div>
            <div className="field">
              <label htmlFor="contact-email">{copy["copy-17"]}</label>
              <input
                id="contact-email"
                type="email"
                placeholder={copy["copy-18"]}
                required
                autoComplete="off"
              />
            </div>
            <div className="field col-span-2">
              <label htmlFor="contact-subject">{copy["copy-19"]}</label>
              <select id="contact-subject" defaultValue="general">
                <option value="general">{copy["copy-20"]}</option>
                <option value="product">{copy["copy-21"]}</option>
                <option value="order">{copy["copy-22"]}</option>
                <option value="other">{copy["copy-23"]}</option>
              </select>
            </div>
            <div className="field col-span-2">
              <label htmlFor="contact-message">{copy["copy-24"]}</label>
              <textarea
                id="contact-message"
                placeholder={copy["copy-25"]}
                rows={6}
                required
              />
            </div>
          </div>
          <Button type="submit" className="mt-6">
            {" "}
            {copy["copy-26"]} <ArrowRight />
          </Button>
          <p className="fine-print mt-4"> {copy["copy-27"]} </p>
        </form>
        <aside className="contact-details">
          <span className="eyebrow">{copy["copy-28"]}</span>
          <h2>
            {" "}
            {copy["copy-29"]} <br /> {copy["copy-30"]}{" "}
          </h2>
          <p> {copy["copy-31"]} </p>
          {[
            {
              icon: Mail,
              title: copy["copy-32"],
              detail: String(settings.contactDetails.email),
            },
            {
              icon: Phone,
              title: copy["copy-34"],
              detail: String(settings.contactDetails.phone),
            },
            {
              icon: MessageCircle,
              title: copy["copy-36"],
              detail: String(settings.contactDetails.whatsapp),
            },
          ].map(({ icon: Icon, title, detail }) => (
            <div className="contact-channel" key={title}>
              <Icon size={20} strokeWidth={1.4} />
              <div>
                <h3>{title}</h3>
                <span>{detail}</span>
                <small>{copy["copy-38"]}</small>
              </div>
            </div>
          ))}
          <p className="fine-print"> {copy["copy-39"]} </p>
        </aside>
      </div>
      <section className="faq-section">
        <div>
          <span className="eyebrow">{copy["copy-40"]}</span>
          <h2>{copy["copy-41"]}</h2>
          <p>{copy["copy-42"]}</p>
          <Link className="text-link mt-5" href="/shipping">
            {" "}
            {copy["copy-43"]} <ArrowRight size={15} />
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

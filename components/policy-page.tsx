import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { PageHeading } from "@/components/catalog";
export function PolicyPage({
  type,
}: {
  type: "shipping" | "privacy" | "terms";
}) {
  const content = {
    shipping: {
      title: "Shipping, thoughtfully explained.",
      subtitle: "A preview of where customers will find delivery information.",
      sections: [
        [
          "Where we deliver",
          "Shipping regions are not yet confirmed. The final page will list supported destinations and any product-specific restrictions.",
        ],
        [
          "Delivery methods & timing",
          "Delivery services, dispatch times, and estimated transit times will be supplied and approved by the client.",
        ],
        [
          "Shipping charges",
          "The calculation method, rates, and any free-shipping threshold remain open scope decisions. Prices shown elsewhere exclude shipping and tax.",
        ],
        [
          "Returns & delivery questions",
          "The client will supply or approve the applicable returns, damaged-item, and delivery policies. No return terms or delivery commitments are established by this prototype.",
        ],
      ],
    },
    privacy: {
      title: "Your privacy matters.",
      subtitle: "A placeholder for the client’s approved privacy policy.",
      sections: [
        [
          "About this prototype",
          "Contact, address, payment, and newsletter details are not sent or saved by this application. Sample cart selections are stored in this browser tab’s session storage. The optional availability check sends only variant IDs and quantities to this website’s server. The owner preview uses fictional data that resets on refresh.",
        ],
        [
          "Production policy to be supplied",
          "The final policy should describe approved data collection, purposes, service providers, retention, customer choices, and business contact information.",
        ],
        [
          "Provider decisions",
          "Payment, hosting, analytics, content management, and administrative authentication providers have not been finalized.",
        ],
        [
          "Before launch",
          "This page is a content placeholder, not an approved legal policy. The final wording and applicable requirements need to be reviewed and supplied before the store launches.",
        ],
      ],
    },
    terms: {
      title: "Clear terms. Shared expectations.",
      subtitle: "A placeholder for the client’s approved terms and conditions.",
      sections: [
        [
          "A visual scope only",
          "This prototype does not accept orders or establish a sales agreement. Products, prices, dietary options, and availability are illustrative.",
        ],
        [
          "Proposed policy content",
          "The final terms may cover ordering, pricing, payment, fulfillment, cancellations, returns, and customer support, based on the client’s approved operating policies.",
        ],
        [
          "Details still to confirm",
          "Business identity, contact details, shipping policies, payment provider, and relevant customer rights need to be reflected in the final approved content.",
        ],
        [
          "Before launch",
          "This is not an approved legal document. Final terms must be supplied or reviewed as part of the agreed launch requirements.",
        ],
      ],
    },
  }[type];
  return (
    <div className="site-container page-bottom">
      <PageHeading
        eyebrow="CUSTOMER INFORMATION · POLICY PREVIEW"
        title={content.title}
        description={content.subtitle}
      />
      <div className="policy-layout">
        <aside>
          <FileText size={28} strokeWidth={1.3} />
          <h2>Awaiting approved content</h2>
          <p>
            The location and layout are shown for review. Final policy wording
            remains a client-provided material.
          </p>
          <Link href="/scope#decisions" className="text-link">
            View open decisions
            <ArrowRight size={14} />
          </Link>
        </aside>
        <div>
          {content.sections.map(([title, text]) => (
            <section key={title}>
              <h2>{title}</h2>
              <p>{text}</p>
            </section>
          ))}
          <Link className="text-link" href="/contact">
            Contact page preview
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}

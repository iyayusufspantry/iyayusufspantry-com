import { getContent } from "@/lib/content/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { PageHeading } from "@/components/catalog";
export async function PolicyPage({
  type,
}: {
  type: "shipping" | "privacy" | "terms";
}) {
  const { copy: allCopy } = await getContent();
  const copy = allCopy["components/policy-page.tsx"];

  const content = (await getContent()).policies[type];
  if (!content) notFound();
  return (
    <div className="site-container page-bottom">
      <PageHeading
        eyebrow={copy["copy-33"]}
        title={content.title}
        description={content.subtitle}
      />
      <div className="policy-layout">
        <aside>
          <FileText size={28} strokeWidth={1.3} />
          <h2>{copy["copy-34"]}</h2>
          <p> {copy["copy-35"]} </p>
          <Link href="/scope#decisions" className="text-link">
            {" "}
            {copy["copy-36"]} <ArrowRight size={14} />
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
            {" "}
            {copy["copy-37"]} <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}

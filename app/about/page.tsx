import { getContent } from "@/lib/content/server";
import Link from "next/link";
import { ArrowRight, Heart, Sprout, Globe } from "lucide-react";
import { MockImage, PageHeading } from "@/components/catalog";
import { Button } from "@/components/ui/button";

export async function generateMetadata() {
  const copy = (await getContent()).copy["app/about/page.tsx"];
  return { title: copy["copy-1"] };
}
export default async function Page() {
  const { brandPhotos, copy: allCopy } = await getContent();
  const copy = allCopy["app/about/page.tsx"];

  return (
    <div className="site-container page-bottom">
      <PageHeading
        eyebrow={copy["copy-2"]}
        title={copy["copy-3"]}
        description={copy["copy-4"]}
      />
      <div className="about-hero">
        <MockImage kind="story" photo={brandPhotos.assortment} />
        <div className="story-copy">
          <span className="eyebrow">{copy["copy-5"]}</span>
          <h2>
            {" "}
            {copy["copy-6"]} <br />
            {copy["copy-7"]}{" "}
          </h2>
          <p> {copy["copy-8"]} </p>
          <p> {copy["copy-9"]} </p>
          <p className="fine-print"> {copy["copy-10"]} </p>
        </div>
      </div>
      <section className="section">
        <div className="about-values">
          {[
            {
              icon: Globe,
              title: copy["copy-11"],
              text: copy["copy-12"],
            },
            {
              icon: Sprout,
              title: copy["copy-13"],
              text: copy["copy-14"],
            },
            {
              icon: Heart,
              title: copy["copy-15"],
              text: copy["copy-16"],
            },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title}>
              <Icon size={30} strokeWidth={1.3} />
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="scope-closing">
        <span className="eyebrow">{copy["copy-17"]}</span>
        <h2>{copy["copy-18"]}</h2>
        <p> {copy["copy-19"]} </p>
        <Button asChild>
          <Link href="/shop">
            {" "}
            {copy["copy-20"]} <ArrowRight />
          </Link>
        </Button>
      </section>
    </div>
  );
}

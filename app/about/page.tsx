import Link from "next/link";
import { ArrowRight, Heart, Sprout, Globe } from "lucide-react";
import { MockImage, PageHeading } from "@/components/catalog";
import { Button } from "@/components/ui/button";
export const metadata = { title: "Our story" };
export default function Page() {
  return (
    <div className="site-container page-bottom">
      <PageHeading
        eyebrow="THE STORY BEHIND THE PANTRY"
        title="Rooted in home. Shared with you."
        description="Authentic African food, familiar connections, and a thoughtful place to discover something good."
      />
      <div className="about-hero">
        <MockImage
          kind="story"
          label="Simbiat’s story & sourcing photography"
        />
        <div className="story-copy">
          <span className="eyebrow">MEET THE BUSINESS</span>
          <h2>
            Food brings us
            <br />a little closer.
          </h2>
          <p>
            Simbiat owns a small business selling authentic African food items
            and snacks in the United States. With approximately three years in
            business, she is exploring a more professional, thoughtfully
            structured online store.
          </p>
          <p>
            Some products are imported directly from Nigeria. Her work with
            local farmers and fishermen reflects a focus on authentic sourcing
            and quality rather than heavily modified substitutes.
          </p>
          <p className="fine-print">
            Draft copy based on the discovery conversation. Exact dates,
            supplier details, personal biography, and final wording require
            client approval.
          </p>
        </div>
      </div>
      <section className="section">
        <div className="about-values">
          {[
            {
              icon: Globe,
              title: "A connection to Nigeria",
              text: "A place to share the origins, food traditions, and stories behind the products. Specific product origins will be confirmed before publication.",
            },
            {
              icon: Sprout,
              title: "Relationships that matter",
              text: "Room to highlight direct sourcing relationships with farmers, fishermen, and suppliers through client-approved stories and photography.",
            },
            {
              icon: Heart,
              title: "Good food, made approachable",
              text: "Clear product information and practical recipes to help customers discover familiar ingredients and snacks, or try something new.",
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
        <span className="eyebrow">FROM OUR PANTRY TO YOURS</span>
        <h2>A little taste of home awaits.</h2>
        <p>
          Explore the sample collection and imagine what the final Simbiat store
          could become.
        </p>
        <Button asChild>
          <Link href="/shop">
            Discover the collection
            <ArrowRight />
          </Link>
        </Button>
      </section>
    </div>
  );
}

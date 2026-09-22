import { getContent } from "@/lib/content/server";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Sprout } from "lucide-react";

export async function AuthPage({
  mode,
  children,
}: {
  mode: "sign-in" | "sign-up";
  children: React.ReactNode;
}) {
  const { brandPhotos, copy: allCopy } = await getContent();
  const copy = allCopy["components/auth-page.tsx"];

  return (
    <section className="site-container pantry-auth-page">
      <div className="pantry-auth-story">
        <Link href="/shop" className="pantry-auth-back">
          <ArrowLeft size={16} aria-hidden="true" /> {copy["copy-1"]}{" "}
        </Link>
        <span className="eyebrow">{copy["copy-2"]}</span>
        <h1>
          {mode === "sign-in" ? copy["copy-3"] : copy["copy-4"]}
          <em>{mode === "sign-in" ? copy["copy-5"] : copy["copy-6"]}</em>
        </h1>
        <p>{mode === "sign-in" ? copy["copy-7"] : copy["copy-8"]}</p>
        <div className="pantry-auth-photo">
          <Image
            src={brandPhotos.assortment.src}
            alt={brandPhotos.assortment.alt}
            fill
            sizes="(max-width: 767px) 100vw, 45vw"
            className="object-cover"
          />
          <span>
            <Sprout size={20} aria-hidden="true" /> {copy["copy-9"]}{" "}
          </span>
        </div>
      </div>
      <div className="pantry-auth-form">{children}</div>
    </section>
  );
}

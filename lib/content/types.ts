import type { Product } from "@/data/products";
import type { Recipe } from "@/data/recipes";
import type { Post } from "@/data/posts";
import type { BrandPhoto } from "@/data/brand-assets";
import type { Variant } from "@/lib/commerce/catalog";

export type { Product, Recipe, Post, BrandPhoto, Variant };
export type Category = {
  slug: string;
  name: string;
  description: string;
  icon: "snacks" | "pantry" | "grains" | "spices" | "specialty";
};
export type Policy = {
  title: string;
  subtitle: string;
  sections: [string, string][];
};
export type SiteContent = {
  products: Product[];
  variants: Variant[];
  categories: Category[];
  recipes: Recipe[];
  posts: Post[];
  productPhotos: Record<string, BrandPhoto>;
  journalPhotos: Record<string, BrandPhoto>;
  recipePhotos: Record<string, BrandPhoto>;
  productGalleries: Record<string, BrandPhoto[]>;
  brandPhotos: Record<
    "assortment" | "snackJars" | "coconut" | "drinks" | "palmOil",
    BrandPhoto
  >;
  settings: {
    businessName: string;
    tagline: string;
    logo: BrandPhoto;
    icon: BrandPhoto;
    brandColors: Record<string, string>;
    contactDetails: Record<string, string | boolean>;
  };
  navigation: Record<string, [string, string][]>;
  policies: Record<string, Policy>;
  faqs: [string, string][];
  copy: Record<string, Record<string, string>>;
  featured: { products: string[]; recipes: string[]; posts: string[] };
  openDecisions: string[][];
  scopeFeatures: string[][];
  clientMaterials: string[];
  exclusions: string[];
  prototypeScreens: {
    name: string;
    href: string;
    purpose: string;
    group: string;
  }[];
};

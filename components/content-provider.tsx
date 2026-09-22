"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { SiteContent } from "@/lib/content/types";

const ContentContext = createContext<SiteContent | null>(null);
export function ContentProvider({
  content,
  children,
}: {
  content: SiteContent;
  children: ReactNode;
}) {
  return (
    <ContentContext.Provider value={content}>
      {children}
    </ContentContext.Provider>
  );
}
export function useContent() {
  const content = useContext(ContentContext);
  if (!content) throw new Error("Published Contentful content is unavailable");
  return content;
}

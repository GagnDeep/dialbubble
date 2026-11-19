import type { Metadata } from "next";
import { comparePages } from "@/content/registry/compare";
import { errorsPages } from "@/content/registry/errors";
import { guidesPages } from "@/content/registry/guides";
import { legalPages } from "@/content/registry/legal";
import { productPages } from "@/content/registry/product";
import { solutionsPages } from "@/content/registry/solutions";
import { toolsPages } from "@/content/registry/tools";
import { pageMeta } from "@/lib/seo";
import type { RegistryEntry, Section } from "@/lib/registry-types";

export type { RegistryEntry, Section };

export const registry: RegistryEntry[] = [
  ...productPages,
  ...solutionsPages,
  ...comparePages,
  ...toolsPages,
  ...guidesPages,
  ...errorsPages,
  ...legalPages,
];

const byPath = new Map<string, RegistryEntry>();
for (const entry of registry) {
  if (byPath.has(entry.path)) throw new Error(`Duplicate registry path: ${entry.path}`);
  if (entry.path !== "/" && (!entry.path.startsWith("/") || entry.path.endsWith("/"))) {
    throw new Error(`Registry path must start with "/" and not end with "/": ${entry.path}`);
  }
  byPath.set(entry.path, entry);
}

/** Section index pages. They are listed in the sitemap but left out of their own listings. */
export const sectionHubs: Partial<Record<Section, string>> = {
  tools: "/tools",
  compare: "/compare",
  guides: "/guides",
  errors: "/twilio-errors",
};

const hubPaths = new Set(Object.values(sectionHubs));

export function getEntry(path: string): RegistryEntry | undefined {
  return byPath.get(path);
}

/** Pages in a section, without the section's hub page. Newest first when dates exist, otherwise file order. */
export function sectionPages(section: Section): RegistryEntry[] {
  const pages = registry.filter((e) => e.section === section && !hubPaths.has(e.path));
  return pages
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      const dateA = a.entry.published ?? "";
      const dateB = b.entry.published ?? "";
      return dateB.localeCompare(dateA) || a.index - b.index;
    })
    .map(({ entry }) => entry);
}

export function indexablePages(): RegistryEntry[] {
  return registry.filter((e) => !e.noindex);
}

/**
 * Picks 3 to 6 links for a page: explicit `related` first, then the same section,
 * then the core product pages so that a new section never renders too few cards.
 */
export function relatedFor(path: string, max = 6): RegistryEntry[] {
  const entry = byPath.get(path);
  const picked: RegistryEntry[] = [];
  const add = (candidate: RegistryEntry | undefined) => {
    if (!candidate || candidate.noindex || candidate.path === path || candidate.path === "/") return;
    if (picked.length >= max || picked.some((p) => p.path === candidate.path)) return;
    picked.push(candidate);
  };
  entry?.related?.forEach((p) => add(byPath.get(p)));
  if (entry) sectionPages(entry.section).forEach(add);
  if (picked.length < 3) sectionPages("product").forEach((p) => picked.length < 3 && add(p));
  return picked;
}

/** Metadata for a registered page, so titles and descriptions live in one place. */
export function metaFor(path: string, overrides: { image?: string; type?: "website" | "article" } = {}): Metadata {
  const entry = byPath.get(path);
  if (!entry) throw new Error(`No registry entry for ${path}. Add it to content/registry/.`);
  return pageMeta({
    title: entry.title,
    description: entry.description,
    path: entry.path,
    keywords: entry.keywords,
    noindex: entry.noindex,
    published: entry.published,
    updated: entry.updated,
    ...overrides,
  });
}

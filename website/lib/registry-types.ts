export type Section = "product" | "solutions" | "compare" | "tools" | "guides" | "errors" | "legal";

export type RegistryEntry = {
  /** Site path with a leading slash and no trailing slash, for example "/guides/twilio-a2p-10dlc". */
  path: string;
  /** Page title without the site name. Used for meta titles, cards and feeds. */
  title: string;
  /** Meta description and card text. Aim for 120 to 160 characters. */
  description: string;
  section: Section;
  keywords: string[];
  /** Paths to feature in RelatedLinks. Unknown paths are skipped, so you can reference pages still being written. */
  related?: string[];
  /** Short name for footer links and breadcrumbs. Falls back to title. */
  label?: string;
  /** ISO date (YYYY-MM-DD). Required for guides to appear in /feed.xml. */
  published?: string;
  /** ISO date (YYYY-MM-DD) of the last meaningful edit. Used in the sitemap and feed. */
  updated?: string;
  /** Keeps the page out of the sitemap and llms.txt and adds a noindex robots tag. */
  noindex?: boolean;
};

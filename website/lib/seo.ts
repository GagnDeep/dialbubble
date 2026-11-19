import type { Metadata } from "next";
import { site } from "@/content/site";

export { JsonLd } from "@/components/JsonLd";

export const DEFAULT_OG_IMAGE = "/og.png";

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return path === "/" ? `${site.url}/` : `${site.url}${path}`;
}

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  /** Root-relative or absolute. Must be 1200x630. Defaults to the generated site image. */
  image?: string;
  type?: "website" | "article";
  keywords?: string[];
  noindex?: boolean;
  published?: string;
  updated?: string;
};

export function pageMeta({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  keywords,
  noindex,
  published,
  updated,
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  const images = [{ url: absoluteUrl(image), width: 1200, height: 630, alt: `${site.name}: ${site.tagline}` }];
  // The home title already names the product, so it skips the "| Dialbubble" template.
  const fullTitle = title.includes(site.name) ? { absolute: title } : title;
  const socialTitle = title.includes(site.name) ? title : `${title} | ${site.name}`;

  return {
    title: fullTitle,
    description,
    keywords,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph:
      type === "article"
        ? {
            type: "article",
            title: socialTitle,
            description,
            url,
            siteName: site.name,
            images,
            publishedTime: published,
            modifiedTime: updated ?? published,
          }
        : { type: "website", title: socialTitle, description, url, siteName: site.name, images },
    twitter: { card: "summary_large_image", title: socialTitle, description, images: [absoluteUrl(image)] },
  };
}

export function softwareAppLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: site.name,
    description: site.description,
    url: site.url,
    image: absoluteUrl("/app-icon.png"),
    applicationCategory: "BusinessApplication",
    operatingSystem: "iOS 26 or later",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    isAccessibleForFree: true,
    license: "https://opensource.org/licenses/MIT",
    codeRepository: site.repo,
    downloadUrl: site.repo,
    author: { "@type": "Person", name: site.developer },
    softwareRequirements: "iPhone with iOS 26 or later, and a Twilio account for real calls and texts",
    featureList: [
      "Two-way calls through your Twilio number",
      "Text-to-speech voice message calls",
      "Play audio and custom TwiML calls",
      "Call recording and call history",
      "SMS and MMS conversations",
      "Broadcast, templates and scheduled texts",
      "Multiple Twilio accounts and numbers",
      "Number lookup, balance and usage",
      "Face ID app lock",
      "Siri and Shortcuts",
      "Demo Mode",
      "Offline history and CSV export",
      "Optional app icon badge and background alerts",
      "Open source (MIT)",
    ],
  };
}

export function faqLd(items: { q: string; text: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, text }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text },
    })),
  };
}

export function breadcrumbLd(items: { name: string; href?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };
}

export function articleLd({
  title,
  description,
  path,
  published,
  updated,
  image = DEFAULT_OG_IMAGE,
}: {
  title: string;
  description: string;
  path: string;
  published: string;
  updated?: string;
  image?: string;
}) {
  const publisher = { "@type": "Organization", name: site.name, url: site.url };
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    mainEntityOfPage: absoluteUrl(path),
    image: absoluteUrl(image),
    datePublished: published,
    dateModified: updated ?? published,
    author: publisher,
    publisher,
  };
}

export function howToLd({
  name,
  description,
  steps,
  path,
}: {
  name: string;
  description: string;
  steps: { name: string; text: string }[];
  path?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    ...(path ? { url: absoluteUrl(path) } : {}),
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

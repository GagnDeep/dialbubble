import { site } from "@/content/site";
import { sectionPages } from "@/lib/registry";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-static";

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function GET() {
  const guides = sectionPages("guides").filter((page) => page.published && !page.noindex);
  const items = guides.map((page) => {
    const url = absoluteUrl(page.path);
    return [
      "    <item>",
      `      <title>${escapeXml(page.title)}</title>`,
      `      <link>${url}</link>`,
      `      <guid isPermaLink="true">${url}</guid>`,
      `      <description>${escapeXml(page.description)}</description>`,
      `      <pubDate>${new Date(`${page.published}T12:00:00Z`).toUTCString()}</pubDate>`,
      "    </item>",
    ].join("\n");
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(`${site.name} guides`)}</title>`,
    `    <link>${absoluteUrl("/guides")}</link>`,
    `    <description>${escapeXml("Twilio guides in plain English, from Dialbubble.")}</description>`,
    "    <language>en</language>",
    `    <atom:link href="${absoluteUrl("/feed.xml")}" rel="self" type="application/rss+xml"/>`,
    ...items,
    "  </channel>",
    "</rss>",
  ].join("\n");

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}

# Contributing to the Dialbubble website

Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, pnpm. The site is a fully static export (`output: "export"`), published to GitHub Pages at https://gagndeep.github.io/dialbubble by `.github/workflows/pages.yml` on every push to `main` that touches `website/`, and once a day (so the App Store button flips to the live listing on its own). No trackers and no third-party origins.

Everything is served under the `/dialbubble` base path. `<Link>` handles it for you; for plain `src`/`href` strings that point at files in `public/`, use `withBase()` from `@/lib/basePath`. To move to a custom domain, build with `NEXT_PUBLIC_BASE_PATH=""` and `NEXT_PUBLIC_SITE_URL="https://example.com"`.

```bash
pnpm install
pnpm dev            # http://localhost:47391/dialbubble
pnpm lint && pnpm typecheck && pnpm build   # must all pass before you hand off
```

## Adding a page

You only need two things, so parallel work doesn't collide:

1. A folder: `app/guides/<slug>/page.tsx`, `app/tools/<slug>/page.tsx`, `app/compare/<slug>/page.tsx`, `app/twilio-errors/<code>/page.tsx` or `app/solutions/<slug>/page.tsx`.
2. One entry in your section's file in `content/registry/`.

The sitemap, footer, hub pages, home teasers, `/feed.xml`, `/llms.txt` and `<RelatedLinks>` all read the registry. Don't edit them, and don't edit `lib/registry.ts`.

```ts
// content/registry/guides.ts
{
  path: "/guides/twilio-a2p-10dlc",     // no trailing slash
  title: "A2P 10DLC, explained",        // no site name, the template adds it
  label: "A2P 10DLC",                   // optional, short name for footer and breadcrumbs
  description: "120 to 160 characters. Used for meta tags, cards and the feed.",
  section: "guides",
  keywords: ["twilio a2p 10dlc"],
  related: ["/pricing", "/guides/other"], // optional, unknown paths are skipped
  published: "2026-11-10",              // required for guides to appear in the feed
  updated: "2026-11-12",                // optional
}
```

The build throws on a duplicate path, and warns if a registered path has no `page.tsx`. Sections: `product`, `solutions`, `compare`, `tools`, `guides`, `errors`, `legal`. Hub pages (`/tools`, `/compare`, `/guides`, `/twilio-errors`) are in the registry already, and are left out of their own listings.

## A guide, start to finish

```tsx
// app/guides/twilio-a2p-10dlc/page.tsx
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { PageHero } from "@/components/PageHero";
import { Prose } from "@/components/Prose";
import { RelatedLinks } from "@/components/RelatedLinks";
import { TocSidebar } from "@/components/TocSidebar";
import { getEntry, metaFor } from "@/lib/registry";
import { articleLd, JsonLd } from "@/lib/seo";

const path = "/guides/twilio-a2p-10dlc";
export const metadata = metaFor(path, { type: "article" });

export default function Page() {
  const entry = getEntry(path)!;
  return (
    <>
      <JsonLd data={articleLd({ title: entry.title, description: entry.description, path, published: entry.published! })} />
      <Breadcrumbs path={path} />
      <PageHero eyebrow="Guide" title={entry.title} lede="One or two plain sentences." />
      <Container>
        <div className="toc-layout">
          <TocSidebar items={[{ id: "what", title: "What it is" }]} />
          <Prose>
            <h2 id="what">What it is</h2>
            <p>Text.</p>
          </Prose>
        </div>
      </Container>
      <RelatedLinks path={path} />
      <CtaBand />
    </>
  );
}
```

## Components

All live in `components/` and are server components unless noted. Import as `@/components/Name`.

| Component | Usage |
|---|---|
| `Container` | `<Container as="section" width="narrow" className="mt-20">`. Page gutter and max width. `width` is `wide` (default) or `narrow`. |
| `PageHero` | `<PageHero eyebrow="Guide" title="..." lede="..." cta={<DownloadButton />} />`. Holds the page's h1. All props but `title` are optional. |
| `Prose` | `<Prose>...</Prose>`. Long-form typography for plain HTML. Start at `h2`, and give headings an `id` if the TOC links to them. |
| `Callout` | `<Callout type="tip" title="Optional">...</Callout>`. Types: `info`, `tip`, `warning`, `cost`. |
| `Faq` | `<Faq items={[{ q, a: "text" }, { q, a: <>JSX</>, text: "plain version" }]} />`. Native details, and adds FAQ JSON-LD. Pass `jsonLd={false}` on a second Faq on the same page. |
| `Breadcrumbs` | `<Breadcrumbs path="/guides/x" />` builds from the registry, or `items={[{ name, href }]}`. Adds JSON-LD. Put it above `PageHero`. |
| `CtaBand` | `<CtaBand title="Optional" text="Optional" />`. The conversion band, once per page, near the end. |
| `DownloadButton` | `<DownloadButton size="sm" tone="onBrand" className="w-full" />`. Flips by itself when the app goes live. Async server component, so it can't be imported from a client component. |
| `ToolShell` | See below. |
| `CodeBlock` | `<CodeBlock title="curl" code={"..."} />`. Copy button included. Long lines scroll inside the block. |
| `ComparisonTable` | `<ComparisonTable caption="..." columns={["Dialbubble", "Other"]} highlight={0} rows={[{ label: "Free", values: [true, "From $5/mo"] }]} />`. Booleans render as Yes or No with an icon. Scrolls inside its own frame. |
| `TocSidebar` | `<TocSidebar items={[{ id, title }]} />`. First child of a `div.toc-layout`, followed by `Prose`. Sticky on wide screens, collapsed on small. |
| `RelatedLinks` | `<RelatedLinks path="/guides/x" title="Optional" max={6} />`. 3 to 6 cards: `related`, then the same section, then core pages. |
| `PhoneFrame` | `<PhoneFrame screen="messages" sizes="260px" className="w-[260px]" />`. Picks the dark or light capture. Set `priority` only on a hero. Screens are in `public/screens`. |
| `Steps` | `<Steps items={[{ title, text }]} />`. Numbered keypad markers. Only for real sequences. |
| `SectionHub`, `SectionTeaser`, `LinkCard`, `DirectDiagram`, `TalkDemo` | Already wired into hubs and the home page. Reuse them if useful. |

### Tools

The shell stays on the server so the page remains static. Your widget is the only client code.

```tsx
// app/tools/sms-segment-calculator/page.tsx
import { ToolShell } from "@/components/ToolShell";
import { metaFor } from "@/lib/registry";
import { Calculator } from "./Calculator"; // "use client"

const path = "/tools/sms-segment-calculator";
export const metadata = metaFor(path);

export default function Page() {
  return (
    <ToolShell
      path={path}
      title="SMS segment calculator"
      intro="What the tool does, in a sentence."
      seo={<><h2>How segments work</h2><p>Text.</p></>}
      faq={[{ q: "Question?", a: "Answer." }]}
    >
      <Calculator />
    </ToolShell>
  );
}
```

Tools run entirely in the browser. The CSP has `connect-src 'self'`, so a call to another origin is blocked. Don't send what people type to any server, because the privacy policy says it stays in the browser.

## SEO helpers (`lib/seo.ts`)

- `metaFor(path, { type, image })` from `lib/registry.ts` is what you'll normally use. `pageMeta({ title, description, path, image?, type? })` is the lower-level version, and gives you canonical, Open Graph and Twitter tags.
- `softwareAppLd()`, `faqLd(items)`, `breadcrumbLd(items)`, `articleLd({ title, description, path, published, updated?, image? })`, `howToLd({ name, description, steps, path? })`.
- `<JsonLd data={...} />` renders any of them.
- Never add `aggregateRating` or `review` to any schema.

## Design rules

- Use the tokens: `bg-canvas`, `bg-surface`, `bg-sunken`, `text-ink`, `text-ink-soft`, `border-line`, `text-mint-text`, `bg-mint-tint`. They switch with `prefers-color-scheme`, so don't write `dark:` variants.
- **White on `#0E9C8A` is only 3.4:1**, so it passes AA for large text only. `.btn` (19px bold) is safe. For anything smaller, use `bg-mint-strong` (`#0B7D71`, 5:1) or `.btn-sm`, which already does.
- Mint text uses `text-mint-text`, never the fill color.
- Type classes: `display-1`, `display-2`, `display-3`, `lede`. Buttons: `btn` with `btn-mint`, `btn-ghost`, `btn-white` or `btn-ghost-white`, and optionally `btn-sm`. Links: `link`.
- The giant speech bubble (`.bubble`, add `on-brand`) is the brand's one bold move. It's for the home hero, `CtaBand` and the 404. Don't add more.
- Radii: `rounded-sm` 12, `rounded-md` 18, `rounded-lg` 24, `rounded-xl` 30. Eyebrows are sentence case, never all caps. Don't use numbered markers unless the content is a real sequence.
- One load animation exists, on the hero phone. Don't add scroll or entrance animations. Anything that moves must respect reduced motion (the global rule catches CSS).
- Mobile first. No page-level horizontal scroll at 320px. Targets are at least 44px. Everything works with a keyboard.
- Use `next/image` for images. Fonts are vendored in `app/fonts`, so don't add others. Don't add scripts, analytics or external stylesheets.

## Voice and hard rules

Write plain, confident and friendly. Use short sentences and everyday verbs, and write to "you". No hype ("revolutionary", "seamless", "supercharge"). Go easy on em dashes, and don't use "not just X, but Y".

**Facts you must keep exact:**

- Free iPhone app, iOS 26 or later, iPhone only. No server, no Dialbubble account, no subscription, no markup. Talks directly to Twilio, with credentials in the iPhone Keychain. You pay Twilio's normal rates.
- Talk calls: Twilio rings your phone first, you press any key, and only then is the other person dialed. They see your Twilio number.
- **Limits to state honestly, and never contradict:** no in-app VoIP, so a Talk call rings your regular phone and bills two Twilio legs. No push notifications for texts (it checks every 20 seconds while open). No Android. Real use needs a Twilio account (Demo Mode doesn't). MMS you send needs a public https link. Scheduled texts need a Twilio Messaging Service. Dialbubble doesn't answer incoming calls.

**Never:**

- Invent testimonials, ratings, download counts, customer logos, awards, press or quotes.
- Say or imply that Dialbubble is affiliated with or endorsed by Twilio, or use the Twilio logo. The footer disclaimer is global.
- Say the app is available until it is. Use `<DownloadButton />` rather than a hand-written App Store link or "download now" copy.
- Quote exact Twilio rates on core pages. Rates change, and they belong in the pricing calculator, with a date and a link to Twilio's pricing.

## Infrastructure notes

- **Static export only:** every page is prerendered to HTML at build time. Don't use `cookies()`, `headers()`, `searchParams`, route handlers without `export const dynamic = "force-static"`, or ISR. `DownloadButton` looks up the App Store listing once per build; the daily scheduled build keeps it fresh.
- **Images:** `images.unoptimized` is on (GitHub Pages has no optimizer). Screens in `public/screens` are pre-sized PNGs.
- **Social image:** `public/og.png` (1200×630). Regenerate it if the brand changes.
- **URLs:** no trailing slashes. `/privacy` is written as `privacy.html`, which GitHub Pages serves at `/privacy`.
- **Deploy:** push to `main`. `.github/workflows/pages.yml` builds with `NEXT_PUBLIC_BASE_PATH=/dialbubble` and deploys `out/` to GitHub Pages.
- **Preview locally:** `NEXT_PUBLIC_BASE_PATH=/dialbubble pnpm build`, then serve `out/` under `/dialbubble` and run `node scripts/qa.mjs http://127.0.0.1:47395/dialbubble`.

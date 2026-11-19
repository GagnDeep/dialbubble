import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { LinkCard } from "@/components/LinkCard";
import { PageHero } from "@/components/PageHero";
import { getEntry, metaFor, sectionPages } from "@/lib/registry";

export const metadata = metaFor("/compare");

const pointers = [
  { need: "A team that shares a number", pick: "Quo", href: "/compare/dialbubble-vs-quo" },
  { need: "A free or Workspace number", pick: "Google Voice", href: "/compare/dialbubble-vs-google-voice" },
  { need: "AI call notes and meetings", pick: "Dialpad", href: "/compare/dialbubble-vs-dialpad" },
  { need: "A flat bill and call routing", pick: "Grasshopper", href: "/compare/dialbubble-vs-grasshopper" },
  { need: "To set up your Twilio account", pick: "the Twilio Console", href: "/compare/dialbubble-vs-twilio-console" },
];

export default function CompareHub() {
  const entry = getEntry("/compare")!;
  const pages = sectionPages("compare").filter((page) => !page.noindex);
  const providers = pages.filter((page) => page.path.includes("twilio-alternatives") || page.path.includes("telnyx"));
  const apps = pages.filter((page) => !providers.includes(page));
  return (
    <>
      <Breadcrumbs path="/compare" />
      <PageHero
        title={entry.title}
        lede="Dialbubble suits one person using their own Twilio account on iPhone, with few calls and no plan. For a lot of people, something else is a better fit, and these pages say so. Every price is dated and links to its source."
      />

      <Container as="section">
        <h2 className="display-2">Who should choose something else?</h2>
        <ul className="mt-6 border-t-4 border-ink">
          {pointers.map((item) => (
            <li key={item.href} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line py-4">
              <span className="text-ink-soft">{item.need}</span>
              <Link href={item.href} className="link font-display text-xl font-semibold">{item.pick}</Link>
            </li>
          ))}
        </ul>
      </Container>

      <Container as="section" className="mt-16">
        <h2 className="display-2">Dialbubble compared with phone apps and tools</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((page) => (
            <LinkCard key={page.path} href={page.path} title={page.label ?? page.title} description={page.description} />
          ))}
        </div>
      </Container>

      <Container as="section" className="mt-16">
        <h2 className="display-2">Comparing API providers</h2>
        <p className="lede mt-3 text-ink-soft">These pages are about choosing a provider, and Dialbubble only works with Twilio today.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {providers.map((page) => (
            <LinkCard key={page.path} href={page.path} title={page.label ?? page.title} description={page.description} />
          ))}
        </div>
      </Container>

      <CtaBand />
    </>
  );
}

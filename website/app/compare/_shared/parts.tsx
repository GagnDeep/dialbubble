import Link from "next/link";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ComparisonTable } from "@/components/ComparisonTable";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { Faq, type FaqItem } from "@/components/Faq";
import { PageHero } from "@/components/PageHero";
import { RelatedLinks } from "@/components/RelatedLinks";
import { getEntry } from "@/lib/registry";
import { articleLd, JsonLd } from "@/lib/seo";
import { CHECKED, monthlyOnTwilio, SCENARIOS, TWILIO, URLS, rate, usd } from "./rates";

/** External link to a source. */
export function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="link" rel="noopener">
      {children}
    </a>
  );
}

/** Article and breadcrumb data for a registered page. */
export function PageData({ path }: { path: string }) {
  const entry = getEntry(path)!;
  return (
    <>
      <JsonLd data={articleLd({ title: entry.title, description: entry.description, path, published: entry.published!, updated: entry.updated })} />
      <Breadcrumbs path={path} />
    </>
  );
}

/** FAQ beside its heading. */
export function FaqSection({ title = "Common questions", items }: { title?: string; items: FaqItem[] }) {
  return (
    <Container as="section" className="mt-20 grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
      <h2 className="display-2">{title}</h2>
      <Faq items={items} />
    </Container>
  );
}

function VerdictColumn({ heading, points, rule }: { heading: string; points: ReactNode[]; rule: string }) {
  return (
    <div className={`border-t-4 pt-4 ${rule}`}>
      <h2 className="font-display text-2xl font-semibold leading-tight">{heading}</h2>
      <ul className="mt-4 list-disc space-y-2.5 pl-5 marker:text-ink-soft">
        {points.map((point, index) => (
          <li key={index}>{point}</li>
        ))}
      </ul>
    </div>
  );
}

/** Two lists under heavy rules. The other option goes first, on purpose. */
export function Verdict({
  other,
  otherPoints,
  dialbubblePoints,
  dialbubbleHeading = "Choose Dialbubble if",
}: {
  other: string;
  otherPoints: ReactNode[];
  dialbubblePoints: ReactNode[];
  dialbubbleHeading?: string;
}) {
  return (
    <Container as="section" className="mt-4 grid gap-10 md:grid-cols-2 md:gap-12">
      <VerdictColumn heading={`Choose ${other} if`} points={otherPoints} rule="border-ink" />
      <VerdictColumn heading={dialbubbleHeading} points={dialbubblePoints} rule="border-mint-text" />
    </Container>
  );
}

/** Cited sources at the foot of a page. */
export function Sources({ items }: { items: { name: string; href: string }[] }) {
  return (
    <Container as="section" className="mt-20">
      <h2 className="font-display text-2xl font-semibold">Sources, checked {CHECKED}</h2>
      <p className="mt-2 max-w-[42rem] text-ink-soft">Prices and plans change. If one of these pages disagrees with us, trust the page.</p>
      <ul className="mt-4 grid gap-x-10 gap-y-2 md:grid-cols-2">
        {items.map((item) => (
          <li key={item.href}>
            <Ext href={item.href}>{item.name}</Ext>
          </li>
        ))}
      </ul>
    </Container>
  );
}

/** What the estimate in CostScenarios assumes, with links to the rates. */
export function CostAssumptions() {
  return (
    <p className="mt-3 max-w-[46rem] text-[0.9375rem] text-ink-soft">
      Estimate from Twilio&apos;s US list prices, {CHECKED}: one local number at {usd(TWILIO.localNumber)} a month, Talk calls billed as two legs at {rate(TWILIO.callOut)} a minute each,{" "}
      texts sent at {rate(TWILIO.sms)} plus up to {rate(TWILIO.carrierHigh)} in carrier fees, and a {usd(TWILIO.a2pMonthly)} monthly Sole Proprietor campaign. It leaves out incoming calls and texts, recording, taxes and{" "}
      the one-time {usd(TWILIO.a2pOneTime)} registration. Sources: <Ext href={URLS.twilioVoice}>voice</Ext>, <Ext href={URLS.twilioSms}>SMS</Ext>, <Ext href={URLS.twilioA2p}>A2P 10DLC fees</Ext>. Try your own numbers in the{" "}
      <Link href="/tools/twilio-pricing-calculator" className="link">Twilio pricing calculator</Link>.
    </p>
  );
}

/** Monthly cost on your own Twilio account against a flat plan. Figures are computed from rates.ts. */
export function CostScenarios({ other, otherLabel, otherPrice }: { other: string; otherLabel: string; otherPrice: string }) {
  return (
    <>
      <ComparisonTable
        caption={`Estimated monthly cost for one person: Dialbubble on Twilio against ${other}`}
        columns={["Dialbubble on Twilio (estimate)", otherLabel]}
        highlight={0}
        rows={SCENARIOS.map((s) => ({
          label: `${s.name}: ${s.minutes} call minutes, ${s.texts} texts sent`,
          values: [`About ${usd(monthlyOnTwilio(s.minutes, s.texts))}`, otherPrice],
        }))}
      />
      <CostAssumptions />
    </>
  );
}

/** The frame for a comparison page: answer, then the page's own content, FAQ and sources. */
export function CompareShell({
  path,
  title,
  lede,
  children,
  faq,
  sources,
  ctaTitle,
  ctaText,
}: {
  path: string;
  title: string;
  lede: ReactNode;
  children: ReactNode;
  faq: FaqItem[];
  sources: { name: string; href: string }[];
  ctaTitle: string;
  ctaText: string;
}) {
  return (
    <>
      <PageData path={path} />
      <PageHero eyebrow={`Compared ${CHECKED}`} title={title} lede={lede} />
      {children}
      <FaqSection items={faq} />
      <Sources items={sources} />
      <RelatedLinks path={path} />
      <CtaBand title={ctaTitle} text={ctaText} />
    </>
  );
}

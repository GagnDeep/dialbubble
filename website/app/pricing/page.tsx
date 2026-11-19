import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Callout } from "@/components/Callout";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { Faq } from "@/components/Faq";
import { PageHero } from "@/components/PageHero";
import { RelatedLinks } from "@/components/RelatedLinks";
import { metaFor } from "@/lib/registry";

export const metadata = metaFor("/pricing");

const twilioCosts = [
  { what: "A phone number", how: "A monthly fee for each number you keep." },
  { what: "Texts", how: "Charged per message segment. A long text or one with emoji can use more than one segment, and Dialbubble's segment counter shows you how many before you send." },
  { what: "Picture messages (MMS)", how: "Charged per message, separately from SMS." },
  { what: "Talk calls", how: "Two legs: one call to your phone and one to the other person. Twilio bills both." },
  { what: "Voice Message, Play Audio and Custom TwiML calls", how: "Normally one leg, to the other person. Custom TwiML can add more, depending on what you write." },
  { what: "Call recording", how: "Twilio charges for recording and for storing recordings, if you turn it on." },
  { what: "Number lookups", how: "Basic validation is included in Twilio Lookup. The line-type and caller-name add-ons are paid." },
  { what: "US texting registration", how: "Texting US numbers from a regular local number requires A2P 10DLC registration, which has its own Twilio and carrier fees." },
];

const faq = [
  {
    q: "Will Dialbubble ever charge me anything?",
    a: "Dialbubble is free today, with no in-app purchases and no subscription. If that ever changes, we'll say so plainly on this page and in the app before anything happens.",
  },
  {
    q: "Do you add a markup to Twilio's prices?",
    a: "No. Dialbubble doesn't handle your usage or your payments at all. Twilio bills your account directly.",
  },
  {
    q: "How do I keep an eye on what I'm spending?",
    a: "The Home dashboard shows your balance, and the usage view shows monthly usage and cost by category, straight from your Twilio account.",
  },
  {
    q: "Can I try it without paying anything?",
    a: "Yes. Demo Mode needs no Twilio account and costs nothing. Twilio also offers trial accounts, which can only reach verified numbers and don't allow two-way Talk calls or custom text. Real day-to-day use needs an upgraded Twilio account.",
  },
];

export default function PricingPage() {
  return (
    <>
      <Breadcrumbs path="/pricing" />
      <PageHero
        title="The app is free. You pay Twilio."
        lede="No subscription, no in-app purchases and no markup. Your calls, texts and numbers are billed to your own Twilio account at Twilio's normal rates."
      />

      <Container as="section" className="mt-4 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div>
          <div className="rounded-xl bg-surface p-7 shadow-[inset_0_0_0_1px_var(--line)]">
            <h2 className="display-3">Dialbubble</h2>
            <p className="mt-2 font-display text-6xl font-bold tracking-tight">$0</p>
            <p className="mt-2 text-ink-soft">Every feature, every account and every number, with no limits from us.</p>
          </div>
          <div className="mt-6 rounded-xl bg-mint-tint p-7">
            <h2 className="display-3">Work out your Twilio bill</h2>
            <p className="mt-2">Twilio&apos;s rates depend on the country and the type of number. Put in your own usage to get an estimate.</p>
            <p className="mt-4">
              <Link href="/tools/twilio-pricing-calculator" className="link">
                Open the Twilio pricing calculator
              </Link>
            </p>
            <p className="mt-2">
              <a href="https://www.twilio.com/en-us/pricing" className="link" rel="noopener">
                See Twilio&apos;s pricing
              </a>
            </p>
          </div>
        </div>
        <div>
          <h2 className="display-2 text-[1.75rem] sm:text-[2.25rem]">What Twilio charges for</h2>
          <p className="mt-3 text-ink-soft">We don&apos;t list rates here because they change and they&apos;re Twilio&apos;s to set. This is what you can expect to see on your bill.</p>
          <dl className="mt-6 border-t border-line">
            {twilioCosts.map((row) => (
              <div key={row.what} className="border-b border-line py-4">
                <dt className="font-display font-semibold">{row.what}</dt>
                <dd className="mt-1 text-ink-soft">{row.how}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6">
            <Callout type="cost" title="Why Talk calls cost more than you might expect">
              <p>
                A Talk call rings your regular phone through Twilio, so you pay for two calls rather than one. Your mobile carrier may also treat the call to you as a normal incoming call under your plan.{" "}
                <Link href="/how-it-works#talk" className="link">
                  How two-way calls work
                </Link>
              </p>
            </Callout>
          </div>
        </div>
      </Container>

      <Container as="section" className="mt-20 grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
        <h2 className="display-2">Pricing questions</h2>
        <Faq items={faq} />
      </Container>

      <RelatedLinks path="/pricing" />
      <CtaBand />
    </>
  );
}

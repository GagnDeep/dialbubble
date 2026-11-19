import Link from "next/link";
import { CostAssumptions, Ext, FaqSection, PageData, Sources } from "@/app/compare/_shared/parts";
import { CHECKED, monthlyOnTwilio, SCENARIOS, URLS, usd } from "@/app/compare/_shared/rates";
import { ComparisonTable } from "@/components/ComparisonTable";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { PageHero } from "@/components/PageHero";
import { PhoneFrame } from "@/components/PhoneFrame";
import { RelatedLinks } from "@/components/RelatedLinks";
import { metaFor } from "@/lib/registry";

const path = "/business-phone-app-iphone";
export const metadata = metaFor(path, { type: "article" });

const picks = [
  {
    need: "A small team sharing one number",
    app: "Quo (formerly OpenPhone)",
    price: "From $15 per user a month, billed annually",
    href: "/compare/dialbubble-vs-quo",
    why: "Calls and texts sit in a shared workspace, with apps for iOS, Android, Mac, Windows and the web.",
    source: URLS.quoPricing,
  },
  {
    need: "A team that wants AI notes and meetings too",
    app: "Dialpad Connect",
    price: "From $15 per user a month, billed annually ($27 monthly)",
    href: "/compare/dialbubble-vs-dialpad",
    why: "It bundles calling, meetings and live transcripts, and it can grow into sales and support plans.",
    source: URLS.dialpadInfo,
  },
  {
    need: "One business, one flat bill",
    app: "Grasshopper",
    price: "From $14 a month, billed annually ($18 monthly)",
    href: "/compare/dialbubble-vs-grasshopper",
    why: "Plans are priced per account and not per user, with call forwarding and business texting. US and Canada only.",
    source: URLS.grasshopperInfo,
  },
  {
    need: "A low or zero budget, or you're on Google Workspace",
    app: "Google Voice",
    price: "Free consumer number; paid plans from $10 per user a month",
    href: "/compare/dialbubble-vs-google-voice",
    why: "A free personal number suits very small US setups, and the paid plans fit neatly alongside Workspace.",
    source: URLS.gvPlans,
  },
  {
    need: "You already use Twilio and want no monthly plan",
    app: "Dialbubble (our app)",
    price: "Free, plus Twilio's usage charges",
    href: "/how-it-works",
    why: "It can undercut flat plans at low volume, and it's handy for voice messages and TwiML. But it has no in-app calling and no alerts for new texts, so it isn't the best general pick.",
    source: null,
  },
];

const faq = [
  {
    q: "What's the best business phone app for iPhone?",
    a: "For most small teams, an app with in-app calling and a shared inbox, such as Quo, is the easiest choice. Solo owners may prefer Grasshopper's flat price, and very small US setups can start with Google Voice. Dialbubble is a niche pick, for people who already use Twilio.",
  },
  {
    q: "Is there a free business phone app for iPhone?",
    a: "Google Voice offers a free consumer number to eligible US residents. Dialbubble's app is free too, though you pay Twilio for numbers and usage. Dialpad, Quo and Grasshopper are paid, with free trials.",
  },
  {
    q: "Can I keep my existing business number?",
    a: "Quo and Twilio both support porting numbers in. Check with any provider before you cancel your old service, as the old number must stay active until the port completes.",
  },
  {
    q: "Do these apps work with my personal iPhone?",
    a: "Yes. You keep your personal number and plan, and the app adds a business number on top. Dialbubble also uses your regular phone line for Talk calls.",
  },
];

export default function Page() {
  return (
    <>
      <PageData path={path} />
      <PageHero
        eyebrow={`Prices checked ${CHECKED}`}
        title="Best business phone app for iPhone"
        lede="The best one depends on who's calling and how much. For most small teams that's Quo; for a solo owner who wants a flat bill, Grasshopper; on a tight budget in the US, Google Voice. We make Dialbubble, and it's only the best pick in one narrow case, which we explain below."
      />

      <Container as="section">
        <h2 className="display-2">Which app suits your business?</h2>
        <div className="mt-8 border-t-4 border-ink">
          {picks.map((pick) => (
            <article key={pick.app} className="grid gap-x-10 gap-y-2 border-b border-line py-7 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <div>
                <p className="text-ink-soft">{pick.need}</p>
                <h3 className="mt-1 font-display text-[1.75rem] font-bold leading-tight">{pick.app}</h3>
              </div>
              <div>
                <p>{pick.why}</p>
                <p className="mt-2 font-semibold">
                  {pick.source ? <Ext href={pick.source}>{pick.price}</Ext> : pick.price}
                </p>
                <p className="mt-2"><Link href={pick.href} className="link">{pick.app.startsWith("Dialbubble") ? "How Dialbubble works" : `${pick.app.split(" (")[0]} compared with Dialbubble`}</Link></p>
              </div>
            </article>
          ))}
        </div>
      </Container>

      <Container as="section" className="mt-20">
        <h2 className="display-2">Side by side</h2>
        <div className="mt-6">
          <ComparisonTable
            caption="Business phone apps for iPhone compared"
            columns={["Quo", "Dialpad Connect", "Grasshopper", "Google Voice", "Dialbubble"]}
            highlight={4}
            rows={[
              { label: "Entry price", values: ["$15 per user a month, annual", "$15 per user a month, annual", "$14 a month, annual", "Free consumer; $10 per user a month", "$0, plus Twilio use"] },
              { label: "US and Canada usage", values: ["Unlimited, under a fair use policy", "Unlimited calling, excluding toll-free", "Unlimited calling and texting", "Most calls free; check Google's terms", "Pay per use"] },
              { label: "Calls in the app", values: [true, true, true, true, false] },
              { label: "Answers incoming calls", values: [true, true, true, true, false] },
              { label: "Shared team inbox", values: [true, "Not on the pages we checked", "Not on the pages we checked", "Not on the pages we checked", false] },
              { label: "Android", values: [true, true, true, true, false] },
              { label: "Spoken message calls, custom TwiML", values: ["Not on the pages we checked", "Not on the pages we checked", "Not on the pages we checked", "Not on the pages we checked", true] },
            ]}
          />
        </div>
      </Container>

      <section className="mt-20 bg-sunken py-16">
        <Container className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16">
          <div className="min-w-0">
            <h2 className="display-2">Flat plan or pay per use?</h2>
            <p className="lede mt-3 text-ink-soft">A flat plan costs the same whether you use it or not. Twilio charges for what you use, and Dialbubble&apos;s two-leg calls add up, so pay-per-use loses at higher volumes.</p>
            <ul className="mt-6 space-y-2">
              {SCENARIOS.map((s) => (
                <li key={s.name}><strong>{s.minutes} minutes and {s.texts} texts:</strong> about {usd(monthlyOnTwilio(s.minutes, s.texts))} a month on Twilio with Dialbubble.</li>
              ))}
            </ul>
            <p className="mt-4">Compared with a $14 to $15 flat plan, Dialbubble is cheaper at light use and costs more once you pass a few hundred call minutes a month.</p>
            <CostAssumptions />
          </div>
          <PhoneFrame screen="home" sizes="240px" className="mx-auto w-[200px] lg:w-[240px]" />
        </Container>
      </section>

      <Container as="section" className="mt-20 grid gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <h2 className="display-2">What should a business phone app include?</h2>
          <ul className="mt-6 list-disc space-y-2 pl-5">
            <li><strong>Incoming calls that reach you,</strong> with voicemail and a greeting. This matters more than most feature lists.</li>
            <li><strong>Text registration help.</strong> In the US, business texting needs <Link href="/guides/a2p-10dlc-registration-guide" className="link">A2P 10DLC registration</Link>, however you send it.</li>
            <li><strong>A way to leave.</strong> Check that you can port your number out later.</li>
            <li><strong>Emergency calling details.</strong> Read how each app handles it, as VoIP services can differ from a mobile line.</li>
          </ul>
        </div>
        <div>
          <h2 className="display-2">Just need one extra number?</h2>
          <p className="mt-6">You may not need a business phone system at all. An eSIM or a single number can do. We compare <Link href="/second-business-number-iphone" className="link">three ways to add a second business number on iPhone</Link>, with their costs.</p>
        </div>
      </Container>

      <FaqSection title="Business phone app questions" items={faq} />
      <Sources
        items={[
          { name: "Quo: pricing", href: URLS.quoPricing },
          { name: "Dialpad: pricing", href: URLS.dialpadPricing },
          { name: "Dialpad: plan summary", href: URLS.dialpadInfo },
          { name: "Dialpad: VoIP cost guide", href: URLS.dialpadVoip },
          { name: "Grasshopper: plan summary", href: URLS.grasshopperInfo },
          { name: "Google Voice: plans", href: URLS.gvPlans },
          { name: "Google Voice: calling costs", href: URLS.gvCalls },
          { name: "Twilio: US voice pricing", href: URLS.twilioVoice },
          { name: "Twilio: US SMS pricing", href: URLS.twilioSms },
        ]}
      />
      <RelatedLinks path={path} />
      <CtaBand title="Already on Twilio? See if Dialbubble fits" text="Try it in Demo Mode before you decide. It's free, and you don't need a Twilio account to look around." />
    </>
  );
}

import Link from "next/link";
import { CompareShell, CostAssumptions, Ext, Verdict } from "@/app/compare/_shared/parts";
import { CHECKED, monthlyOnTwilio, URLS, usd } from "@/app/compare/_shared/rates";
import { ComparisonTable } from "@/components/ComparisonTable";
import { Container } from "@/components/Container";
import { PhoneFrame } from "@/components/PhoneFrame";
import { metaFor } from "@/lib/registry";

const path = "/compare/dialbubble-vs-google-voice";
export const metadata = metaFor(path, { type: "article" });

export default function Page() {
  return (
    <CompareShell
      path={path}
      title="Dialbubble vs Google Voice for business"
      lede="If you're in the US and just want a simple second number, or your team is on Google Workspace, Google Voice is likely the better choice, and it's much easier to set up. Dialbubble suits you if you already use Twilio, or want what Twilio offers: spoken message calls, custom TwiML and several numbers with no per-user plan."
      ctaTitle="Want Twilio's flexibility on your iPhone?"
      ctaText="Try voice message calls and broadcast in Demo Mode, on simulated data and with no account."
      sources={[
        { name: "Google: Voice plans for Workspace", href: URLS.gvPlans },
        { name: "Google: standalone Starter and Standard plans", href: URLS.gvStandalone },
        { name: "Google: making calls and rates", href: URLS.gvCalls },
        { name: "Google Voice community: number eligibility", href: URLS.gvEligibility },
        { name: "Twilio: US voice pricing", href: URLS.twilioVoice },
        { name: "Twilio: US SMS pricing", href: URLS.twilioSms },
      ]}
      faq={[
        { q: "Is Google Voice free for business?", a: "Google's free consumer number is aimed at individuals. For business features, Google sells plans from $10 per user a month, either added to Google Workspace or, for one US user with a Gmail address, as a standalone plan." },
        { q: "Can I get Google Voice outside the US?", a: "The free consumer number is only for US residents, according to Google's community guide. Workspace plans are sold in more countries: Google says Starter is available in 14." },
        { q: "Can Google take back a free Google Voice number?", a: "Yes. The community guide says a free number can be reclaimed after 90 days without an outgoing call or text, following a warning 30 days before removal. Incoming calls and texts don't count as use." },
        { q: "Does Google Voice offer toll-free numbers?", a: "Google's help page says it doesn't offer 1-800 numbers. Twilio lists US toll-free numbers at $2.15 a month as of November 2026." },
      ]}
    >
      <Verdict
        other="Google Voice"
        otherPoints={[
          "You're in the US and want a free number, and light use suits you.",
          "Your team already pays for Google Workspace.",
          "You need calls answered in the app, on iPhone, iPad or Android.",
          "You want auto attendants and ring groups from a Standard plan.",
          "You'd rather not manage a developer account and registration.",
        ]}
        dialbubblePoints={[
          "You already have a Twilio account and numbers.",
          <>You want <Link href="/twilio-dialer-app" className="link">voice message calls, audio or custom TwiML</Link> from your phone.</>,
          <>You want <Link href="/twilio-sms-app" className="link">scheduled texts and broadcast</Link> from your own numbers.</>,
          "You need several numbers or a toll-free number on one person's phone.",
          "You're outside the US and Twilio offers numbers where you need them.",
        ]}
      />

      <Container as="section" className="mt-20">
        <h2 className="display-2">Which Google Voice plan would you compare?</h2>
        <p className="lede mt-3 text-ink-soft">&ldquo;Google Voice&rdquo; means a few different things, and the rules differ a lot.</p>
        <div className="mt-6">
          <ComparisonTable
            caption="Dialbubble compared with Google Voice plans, as of November 2026"
            columns={["Dialbubble", "Google Voice free", "Voice Starter", "Voice Standard"]}
            highlight={0}
            rows={[
              { label: "Price", values: ["Free app; Twilio per use", "$0", "$10 per user a month", "$20 per user a month"] },
              { label: "Who can get it", values: ["Anyone with a Twilio account and iOS 26 iPhone", "US residents, with a US mobile number", "Workspace (14 countries), or one US Gmail user", "Workspace, or one US Gmail user"] },
              { label: "Numbers", values: ["As many as you buy at Twilio", "One", "One user's number", "One user's number on the standalone plan"] },
              { label: "Calling cost", values: ["Twilio's rates, two legs for Talk", "Most US and Canada calls free", "Unlimited domestic, under Google's terms", "Unlimited domestic, under Google's terms"] },
              { label: "Answer in the app", values: [false, true, true, true] },
              { label: "Android, iPhone, iPad apps", values: ["iPhone only", true, true, true] },
              { label: "Call recording", values: ["Per call, at Twilio's rate", "Not stated on the pages we checked", true, true] },
              { label: "Auto attendant", values: ["Set up on your own in Twilio", false, false, true] },
              { label: "Voice message, custom TwiML", values: [true, "Not listed", "Not listed", "Not listed"] },
              { label: "Toll-free numbers", values: [true, false, false, false] },
            ]}
          />
        </div>
        <p className="mt-3 text-[0.9375rem] text-ink-soft">
          From Google&apos;s <Ext href={URLS.gvPlans}>Voice plans page</Ext>, <Ext href={URLS.gvStandalone}>standalone plan help</Ext> and <Ext href={URLS.gvCalls}>calling help</Ext>, {CHECKED}. Premier is $30 per user a month, with unlimited international billing locations and automatic recording.
        </p>
      </Container>

      <section className="mt-20 bg-sunken py-16">
        <Container className="grid items-center gap-10 md:grid-cols-[auto_minmax(0,1fr)] md:gap-16">
          <PhoneFrame screen="voice-message" sizes="240px" className="order-2 mx-auto w-[200px] md:order-1 lg:w-[240px]" />
          <div className="order-1 min-w-0 md:order-2">
            <h2 className="display-2">Costs: free is hard to beat</h2>
            <p className="mt-4">If you&apos;re eligible and your needs are simple, Google Voice&apos;s free number costs less than any Twilio setup. On Twilio with Dialbubble, 100 call minutes and 100 sent texts come to about {usd(monthlyOnTwilio(100, 100))} a month, and 500 minutes and 300 texts to about {usd(monthlyOnTwilio(500, 300))}. With about 100 texts, Voice Starter at $10 a month costs less from a little under 200 minutes.</p>
            <CostAssumptions />
          </div>
        </Container>
      </section>

      <Container as="section" width="narrow" className="mt-20">
        <h2 className="display-2">Looking for a Google Voice alternative?</h2>
        <p className="mt-4">It helps to know why. If you can&apos;t get a number because you&apos;re outside the US, or you&apos;ve hit its single-number limit, Twilio might fit, and you can read <Link href="/guides/how-to-use-a-twilio-phone-number" className="link">how to use a Twilio number</Link> and <Link href="/guides/how-much-does-a-twilio-phone-number-cost" className="link">what it costs</Link>. If you want a friendlier business service, <Link href="/compare/dialbubble-vs-grasshopper" className="link">Grasshopper</Link> and <Link href="/compare/dialbubble-vs-quo" className="link">Quo</Link> are closer alternatives than we are.</p>
      </Container>
    </CompareShell>
  );
}

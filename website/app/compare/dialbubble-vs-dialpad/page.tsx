import Link from "next/link";
import { CompareShell, CostScenarios, Ext, Verdict } from "@/app/compare/_shared/parts";
import { CHECKED, URLS } from "@/app/compare/_shared/rates";
import { ComparisonTable } from "@/components/ComparisonTable";
import { Container } from "@/components/Container";
import { metaFor } from "@/lib/registry";

const path = "/compare/dialbubble-vs-dialpad";
export const metadata = metaFor(path, { type: "article" });

const tiers = [
  { name: "Connect", text: "Business calling and meetings. Standard is $15 per user a month billed annually ($27 monthly), Pro is $25 ($35 monthly), and Enterprise is a custom quote." },
  { name: "Sell", text: "Sales calling, from $39 per user a month, with AI transcripts and recaps. Higher plans add live coaching." },
  { name: "Support", text: "Contact center, from $89 per user a month, with routing and a power dialer." },
];

export default function Page() {
  return (
    <CompareShell
      path={path}
      title="Dialbubble vs Dialpad: which do you need?"
      lede="These two solve different problems. Dialpad is an AI-powered phone, meetings and contact center platform for teams, and it's the right choice if that's what you're buying. Dialbubble is a small app for one person using their own Twilio account on iPhone, with no calling plan."
      ctaTitle="Just one person and one Twilio number?"
      ctaText="Dialbubble is free, and you can explore it in Demo Mode without a Twilio account."
      sources={[
        { name: "Dialpad: pricing", href: URLS.dialpadPricing },
        { name: "Dialpad: plan summary", href: URLS.dialpadInfo },
        { name: "Dialpad: VoIP cost guide", href: URLS.dialpadVoip },
        { name: "Twilio: US voice pricing", href: URLS.twilioVoice },
        { name: "Twilio: US SMS pricing", href: URLS.twilioSms },
      ]}
      faq={[
        { q: "What is Dialpad?", a: "Dialpad is a cloud business communications platform. Its Connect plans cover calling and meetings, while Sell and Support cover sales teams and contact centers. It runs on phones, tablets, computers and desk phones." },
        { q: "How much does Dialpad cost?", a: "As of November 2026, Dialpad Connect Standard is $15 per user a month billed annually, or $27 billed monthly. Pro is $25 or $35. Sell starts at $39 and Support at $89 per user a month. Dialpad says prices can vary by region and contract." },
        { q: "Is Dialpad free?", a: "We found no permanent free plan on Dialpad's pricing page. Dialpad's plan summary mentions a 14-day free trial." },
        { q: "Can Dialbubble transcribe my calls like Dialpad?", a: "Not by itself. Dialbubble can turn on recording for a call, then let you play it back. Dialpad includes live transcripts and summaries, so choose it if those matter to you." },
      ]}
    >
      <Verdict
        other="Dialpad"
        otherPoints={[
          "You're setting up calling for a team, with admin controls.",
          "You want real-time transcripts and instant call summaries.",
          "You need meetings and calling together in one app.",
          "You're running a sales team or contact center.",
          "You need Android, desktop or desk phones, or to answer calls in the app.",
        ]}
        dialbubblePoints={[
          "You're one person, and an AI platform would be overkill.",
          "You already use Twilio, or you want to pay per use.",
          "You make few calls, so a per-user plan would sit idle.",
          <>You want your <Link href="/security" className="link">credentials and activity kept between your iPhone and Twilio</Link>.</>,
          <>You want to run <Link href="/tools/twiml-builder" className="link">your own TwiML</Link> on a call without a server.</>,
        ]}
      />

      <Container as="section" className="mt-20 grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
        <div>
          <h2 className="display-2">How much does Dialpad cost?</h2>
          <p className="mt-4 text-ink-soft">Prices from <Ext href={URLS.dialpadPricing}>Dialpad&apos;s pricing page</Ext> and <Ext href={URLS.dialpadInfo}>plan summary</Ext>, {CHECKED}. They note prices may vary by region and contract.</p>
        </div>
        <dl className="border-t-4 border-ink">
          {tiers.map((tier) => (
            <div key={tier.name} className="grid gap-2 border-b border-line py-5 sm:grid-cols-[7rem_minmax(0,1fr)]">
              <dt className="font-display text-xl font-semibold">{tier.name}</dt>
              <dd className="text-ink-soft">{tier.text}</dd>
            </div>
          ))}
        </dl>
      </Container>

      <Container as="section" className="mt-20">
        <h2 className="display-2">Feature differences that matter</h2>
        <div className="mt-6">
          <ComparisonTable
            caption="Dialbubble compared with Dialpad Connect Standard, as of November 2026"
            columns={["Dialbubble", "Dialpad Connect Standard"]}
            highlight={0}
            rows={[
              { label: "Price", values: ["Free app; you pay Twilio per use", "$15 per user a month annually, $27 monthly"] },
              { label: "US and Canada calling", values: ["Per minute; Talk bills two legs", "Unlimited, excluding toll-free"] },
              { label: "Numbers", values: ["Any you own at Twilio", "One per user; more on Pro"] },
              { label: "In-app calling", values: [false, true] },
              { label: "Live transcripts and summaries", values: [false, true] },
              { label: "Meetings", values: [false, true] },
              { label: "Texting", values: ["Twilio SMS and MMS", "SMS included"] },
              { label: "Scheduled texts and broadcast", values: ["Yes, through Twilio", "Not listed on the pages we checked"] },
              { label: "Spoken message calls, TwiML", values: [true, "Not listed on the pages we checked"] },
              { label: "Platforms", values: ["iPhone only", "Phones, tablets, computers, desk phones"] },
            ]}
          />
        </div>
      </Container>

      <section className="mt-20 bg-sunken py-16">
        <Container>
          <h2 className="display-2 max-w-[22ch]">Which costs less for one person?</h2>
          <p className="lede mt-3 text-ink-soft">At light use, Twilio&apos;s pay-per-use wins. Past a few hundred minutes, Dialpad&apos;s flat price wins, and you get in-app calling as well.</p>
          <div className="mt-6">
            <CostScenarios other="Dialpad" otherLabel="Dialpad Connect Standard, annual" otherPrice="$15, plus any add-ons" />
          </div>
        </Container>
      </section>

      <Container as="section" width="narrow" className="mt-20">
        <h2 className="display-2">Looking for a Dialpad alternative?</h2>
        <p className="mt-4">If you like the idea of a business phone but not the platform size, <Link href="/compare/dialbubble-vs-quo" className="link">Quo</Link> and <Link href="/compare/dialbubble-vs-grasshopper" className="link">Grasshopper</Link> are the closer alternatives. Our <Link href="/business-phone-app-iphone" className="link">guide to business phone apps for iPhone</Link> sorts them by need. If you want recordings on Twilio, see our <Link href="/guides/twilio-call-recording-guide" className="link">call recording guide</Link>, and read <Link href="/twilio-softphone-app" className="link">how a bridge differs from a softphone</Link> before you decide.</p>
      </Container>
    </CompareShell>
  );
}

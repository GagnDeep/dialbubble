import Link from "next/link";
import { CompareShell, CostScenarios, Ext, Verdict } from "@/app/compare/_shared/parts";
import { CHECKED, URLS } from "@/app/compare/_shared/rates";
import { ComparisonTable } from "@/components/ComparisonTable";
import { Container } from "@/components/Container";
import { PhoneFrame } from "@/components/PhoneFrame";
import { metaFor } from "@/lib/registry";

const path = "/compare/dialbubble-vs-grasshopper";
export const metadata = metaFor(path, { type: "article" });

const plans = [
  { name: "True Solo", price: "$14 a month annually, $18 monthly", detail: "1 user, 1 number, 1 extension" },
  { name: "Solo Plus", price: "$25 a month annually, $32 monthly", detail: "Unlimited users, 1 number, 3 extensions" },
  { name: "Small Business", price: "$55 a month annually", detail: "Unlimited users, 4 numbers, unlimited extensions" },
];

export default function Page() {
  return (
    <CompareShell
      path={path}
      title="Dialbubble vs Grasshopper for small business"
      lede="If you want a business line that answers your calls for a flat monthly price, with extensions and call forwarding set up for you, Grasshopper is the better choice. Dialbubble is better if you make few calls, you're already on Twilio, or you want to pay only for what you use."
      ctaTitle="Few calls, and comfortable with Twilio?"
      ctaText="Dialbubble is free and adds nothing to Twilio's prices. Look around in Demo Mode, with no account needed."
      sources={[
        { name: "Grasshopper: plan summary (updated September 2026)", href: URLS.grasshopperInfo },
        { name: "Grasshopper vs. OpenPhone (feature list)", href: "https://grasshopper.com/competitors/openphone" },
        { name: "Twilio: US voice pricing", href: URLS.twilioVoice },
        { name: "Twilio: US SMS pricing", href: URLS.twilioSms },
        { name: "Twilio: A2P 10DLC fees", href: URLS.twilioA2p },
      ]}
      faq={[
        { q: "How much does Grasshopper cost?", a: "As of November 2026, Grasshopper lists True Solo at $14 a month billed annually or $18 monthly, Solo Plus at $25 or $32, and Small Business at $55 billed annually. Each plan includes a 7-day free trial with no credit card required." },
        { q: "Where is Grasshopper available?", a: "Grasshopper says it's currently available only in the USA and Canada. If you're elsewhere, you'll need another option." },
        { q: "Does Grasshopper work on Android?", a: "Yes. Grasshopper has desktop, iPhone and Android apps. Dialbubble is iPhone only." },
        { q: "Can Dialbubble route calls to extensions?", a: "No. Dialbubble doesn't handle incoming calls at all. You can build call routing in the Twilio Console, but Grasshopper has it ready to use." },
      ]}
    >
      <Verdict
        other="Grasshopper"
        otherPoints={[
          "You want one predictable bill and little setup.",
          "Callers should reach extensions and team members.",
          "You'd like an automatic text to go out when you miss a call.",
          "You spend real time on the phone each month.",
          "You need Android or desktop, or want vanity and toll-free numbers without Twilio.",
        ]}
        dialbubblePoints={[
          "You make few calls each month, and pay-per-use costs less.",
          "You already have Twilio numbers you want to use from your phone.",
          "You're outside the US and Canada, where Grasshopper isn't sold.",
          <>You want <Link href="/twilio-sms-app" className="link">scheduled texts and broadcast</Link> through your own account.</>,
          <>You want extra numbers on Twilio&apos;s prices, from $1.15 a month.</>,
        ]}
      />

      <Container as="section" className="mt-20 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
        <div className="min-w-0">
          <h2 className="display-2">Flat plans against pay-per-use</h2>
          <p className="lede mt-3 text-ink-soft">Grasshopper&apos;s pricing is per account, not per user. Twilio has no plans at all. <Ext href={URLS.grasshopperInfo}>Grasshopper&apos;s plans</Ext>, {CHECKED}:</p>
          <dl className="mt-6 border-t-4 border-ink">
            {plans.map((plan) => (
              <div key={plan.name} className="grid gap-1 border-b border-line py-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
                <dt className="font-display text-xl font-semibold">{plan.name}</dt>
                <dd><span className="font-semibold">{plan.price}.</span> <span className="text-ink-soft">{plan.detail}.</span></dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[0.9375rem] text-ink-soft">All plans include unlimited texting and calling within the US and Canada. Grasshopper&apos;s page doesn&apos;t mention A2P registration fees, so ask before you buy.</p>
          <div className="mt-8">
            <CostScenarios other="Grasshopper" otherLabel="Grasshopper True Solo, annual" otherPrice="$14" />
          </div>
        </div>
        <PhoneFrame screen="recents" sizes="240px" className="mx-auto w-[200px] lg:w-[240px]" />
      </Container>

      <Container as="section" className="mt-20">
        <h2 className="display-2">What each one does with a phone call</h2>
        <div className="mt-6">
          <ComparisonTable
            caption="Dialbubble compared with Grasshopper, as of November 2026"
            columns={["Dialbubble", "Grasshopper"]}
            highlight={0}
            rows={[
              { label: "Outgoing calls", values: ["Twilio bridges your regular phone line", "In the app, or over Wi-Fi with VoIP calling"] },
              { label: "Incoming calls", values: [<>Not in the app. <Link key="fw" href="/guides/twilio-call-forwarding" className="link">Set up forwarding in Twilio</Link></>, "Rings your app or forwards to your phone or a teammate"] },
              { label: "Extensions", values: ["Build your own in Twilio", "1 to unlimited, by plan"] },
              { label: "Missed call text", values: ["Build your own in Twilio", "Instant text response"] },
              { label: "Team use", values: ["One person", "Unlimited users on Solo Plus and up"] },
              { label: "Platforms", values: ["iPhone only (iOS 26+)", "Desktop, iPhone, Android"] },
              { label: "Availability", values: ["Wherever you can use Twilio and the App Store", "USA and Canada only"] },
              { label: "Number types", values: ["Whatever Twilio offers for your country", "Local, toll-free and vanity"] },
              { label: "Spoken message calls, custom TwiML", values: [true, "Not listed on the pages we checked"] },
              { label: "Scheduled texts, broadcast", values: ["Yes, with a Messaging Service", "Not listed on the pages we checked"] },
            ]}
          />
        </div>
      </Container>

      <Container as="section" width="narrow" className="mt-20">
        <h2 className="display-2">Looking for a Grasshopper alternative?</h2>
        <p className="mt-4">Check what you&apos;d give up first: Grasshopper handles the incoming side for you, and Dialbubble doesn&apos;t. If you need that, compare <Link href="/compare/dialbubble-vs-quo" className="link">Quo</Link> and <Link href="/compare/dialbubble-vs-google-voice" className="link">Google Voice</Link>. If you just want an extra line, see <Link href="/second-business-number-iphone" className="link">three ways to add a second business number on iPhone</Link>.</p>
      </Container>
    </CompareShell>
  );
}

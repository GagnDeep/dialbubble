import Link from "next/link";
import { CompareShell, Ext } from "@/app/compare/_shared/parts";
import { CHECKED, TWILIO, URLS, rate, usd } from "@/app/compare/_shared/rates";
import { ComparisonTable } from "@/components/ComparisonTable";
import { Container } from "@/components/Container";
import { metaFor } from "@/lib/registry";

const path = "/compare/telnyx-vs-twilio";
export const metadata = metaFor(path, { type: "article" });

const TELNYX = { callOut: 0.005, callIn: 0.0032, sms: 0.004, number: 1 };
const MILLION = 1_000_000;
const sampleSms = (per: number) => (per * MILLION).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function Page() {
  return (
    <CompareShell
      path={path}
      title="Telnyx vs Twilio: prices and differences"
      lede={`On published US list prices, Telnyx is cheaper: outbound calls start at ${rate(TELNYX.callOut)} a minute against Twilio's ${rate(TWILIO.callOut)}, and SMS is ${rate(TELNYX.sms)} a segment against ${rate(TWILIO.sms)}, before carrier fees. Twilio has more channels, more integrations and a larger developer community. Which is better depends on what you're building.`}
      ctaTitle="Staying on Twilio and want it on your iPhone?"
      ctaText="Dialbubble is a free app for your own Twilio account. It doesn't work with Telnyx. Try it in Demo Mode."
      sources={[
        { name: "Twilio: US voice pricing", href: URLS.twilioVoice },
        { name: "Twilio: US SMS pricing", href: URLS.twilioSms },
        { name: "Twilio: support plans", href: URLS.twilioSupportPlans },
        { name: "Twilio: products", href: URLS.twilioProducts },
        { name: "Telnyx: voice pricing", href: URLS.telnyxVoice },
        { name: "Telnyx: messaging pricing", href: URLS.telnyxSms },
        { name: "Telnyx: its comparison with Twilio", href: URLS.telnyxVsTwilio },
        { name: "Telnyx: TwiML migration docs", href: URLS.telnyxTexml },
      ]}
      faq={[
        { q: "Is Telnyx cheaper than Twilio?", a: "On published US list prices checked in November 2026, yes, for local calls, SMS and numbers. Carrier fees apply on both, and actual bills depend on your destinations and volumes, so price your real traffic." },
        { q: "Can I reuse my TwiML on Telnyx?", a: "Often, with some work. Telnyx's TeXML is designed to accept TwiML-style call flows, and its docs describe changing the endpoint and authentication. Telnyx says it needs minimal rewriting, but test your own flows, because support can differ by verb." },
        { q: "Telnyx vs Twilio for SMS: which should I pick?", a: "Telnyx lists a lower base rate. Twilio may suit you better if you want a broader messaging platform and more integrations. Both add carrier fees, and US business texting needs registration either way." },
        { q: "Is Telnyx's network really better?", a: "Telnyx says it owns its private network, and that this helps latency. That's the vendor's own claim. We haven't tested it, so measure it on your own routes." },
      ]}
    >
      <Container as="section" className="grid gap-10 md:grid-cols-2 md:gap-12">
        <div className="border-t-4 border-ink pt-4">
          <h2 className="font-display text-2xl font-semibold">Twilio tends to fit if</h2>
          <ul className="mt-4 list-disc space-y-2.5 pl-5 marker:text-ink-soft">
            <li>You want many channels and products from one vendor, such as Flex, Verify, Segment and SendGrid.</li>
            <li>You rely on third-party integrations and existing tutorials.</li>
            <li>Your team already knows it, and your bill doesn&apos;t justify moving.</li>
          </ul>
        </div>
        <div className="border-t-4 border-ink pt-4">
          <h2 className="font-display text-2xl font-semibold">Telnyx tends to fit if</h2>
          <ul className="mt-4 list-disc space-y-2.5 pl-5 marker:text-ink-soft">
            <li>Voice is your main product and latency matters, for example with voice AI.</li>
            <li>Your volume is high enough for lower per-unit rates to matter.</li>
            <li>You want no-cost 24/7 support, which Telnyx says it includes across plans.</li>
          </ul>
        </div>
      </Container>

      <Container as="section" className="mt-20">
        <h2 className="display-2">Telnyx vs Twilio pricing in the US</h2>
        <p className="lede mt-3 text-ink-soft">Pay-as-you-go list prices, {CHECKED}. Telnyx describes some as starting rates.</p>
        <div className="mt-6">
          <ComparisonTable
            caption="Telnyx and Twilio US list prices, as of November 2026"
            columns={["Twilio", "Telnyx"]}
            rows={[
              { label: "Local call, outbound, per min", values: [rate(TWILIO.callOut), `From ${rate(TELNYX.callOut)}`] },
              { label: "Local call, inbound, per min", values: [rate(TWILIO.callIn), `From ${rate(TELNYX.callIn)}`] },
              { label: "Local number, per month", values: [usd(TWILIO.localNumber), usd(TELNYX.number)] },
              { label: "Toll-free number, per month", values: [usd(TWILIO.tollFreeNumber), "$1.00"] },
              { label: "SMS from a local number, per segment", values: [`${rate(TWILIO.sms)} plus carrier fee`, `${rate(TELNYX.sms)} plus carrier fee`] },
              { label: "MMS sent from a local number", values: [`${rate(TWILIO.mmsOut)} plus carrier fee`, "$0.015 plus carrier fee"] },
              { label: "Sample carrier fee: AT&T, SMS out", values: ["$0.0035", "$0.0035"] },
              { label: "Support", values: ["Free Developer plan; paid plans from $250 a month or 4% of spend", "24/7 across plans, per Telnyx"] },
            ]}
          />
        </div>
        <p className="mt-3 text-[0.9375rem] text-ink-soft">
          Sources: Twilio <Ext href={URLS.twilioVoice}>voice</Ext>, <Ext href={URLS.twilioSms}>SMS</Ext> and <Ext href={URLS.twilioSupportPlans}>support</Ext>; Telnyx <Ext href={URLS.telnyxVoice}>voice</Ext> and <Ext href={URLS.telnyxSms}>messaging</Ext>. Both offer volume pricing, which can change this picture.
        </p>
        <p className="mt-6 max-w-[46rem]">To see what that means at scale: 1 million SMS segments costs {sampleSms(TWILIO.sms)} at Twilio&apos;s base rate and {sampleSms(TELNYX.sms)} at Telnyx&apos;s, before carrier fees, which are similar on both. At a few hundred texts a month, the difference is a dollar or two, so it won&apos;t pay for a migration. Work out your Twilio figure with the <Link href="/tools/twilio-pricing-calculator" className="link">pricing calculator</Link>.</p>
      </Container>

      <section className="mt-20 bg-sunken py-16">
        <Container>
          <h2 className="display-2 max-w-[22ch]">How do they differ beyond price?</h2>
          <dl className="mt-8 grid gap-x-12 gap-y-6 md:grid-cols-2">
            <div className="border-t border-line pt-4"><dt className="display-3">Network</dt><dd className="mt-1.5 text-ink-soft">Telnyx says it owns and operates a private IP network. It presents this as the reason for its latency and pricing. That&apos;s the vendor&apos;s claim, and we didn&apos;t test it.</dd></div>
            <div className="border-t border-line pt-4"><dt className="display-3">Product range</dt><dd className="mt-1.5 text-ink-soft">Twilio sells <Ext href={URLS.twilioProducts}>messaging, voice, verification, a contact center, email and customer data</Ext>. Telnyx itself says it trades some channel breadth for control over the voice loop.</dd></div>
            <div className="border-t border-line pt-4"><dt className="display-3">Developer ecosystem</dt><dd className="mt-1.5 text-ink-soft">Telnyx&apos;s own comparison says Twilio has the larger community and documentation footprint, which can shorten onboarding. If you&apos;re new, look at our <Link href="/guides/twiml-examples" className="link">TwiML examples</Link> to get a feel for the call language.</dd></div>
            <div className="border-t border-line pt-4"><dt className="display-3">Moving between them</dt><dd className="mt-1.5 text-ink-soft"><Ext href={URLS.telnyxTexml}>Telnyx&apos;s TeXML docs</Ext> describe changing the endpoint and authentication for TwiML-based apps. You&apos;d still deal with number ports and US texting registration. See <Link href="/guides/how-does-twilio-pricing-work" className="link">how Twilio pricing works</Link> and <Link href="/compare/twilio-alternatives" className="link">other Twilio alternatives</Link> before you decide.</dd></div>
          </dl>
        </Container>
      </section>
    </CompareShell>
  );
}

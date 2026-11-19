import Link from "next/link";
import { CompareShell, Ext } from "@/app/compare/_shared/parts";
import { CHECKED, TWILIO, URLS, rate, usd } from "@/app/compare/_shared/rates";
import { Callout } from "@/components/Callout";
import { ComparisonTable } from "@/components/ComparisonTable";
import { Container } from "@/components/Container";
import { metaFor } from "@/lib/registry";

const path = "/compare/twilio-alternatives";
export const metadata = metaFor(path, { type: "article" });

const providers = [
  {
    name: "Telnyx",
    suits: "Developers who care about voice latency and lower list prices.",
    body: <>Telnyx says it <Ext href={URLS.telnyxVsTwilio}>owns its network</Ext>. Its <Ext href={URLS.telnyxTexml}>TeXML</Ext> is designed for moving TwiML call flows across. Telnyx itself says Twilio has broader channels and a bigger developer community. <Link href="/compare/telnyx-vs-twilio" className="link">Read our Telnyx vs Twilio comparison</Link>.</>,
  },
  {
    name: "Vonage",
    suits: "Teams who want usage-based APIs across voice, SMS, RCS and WhatsApp.",
    body: <>Vonage&apos;s <Ext href={URLS.vonagePricing}>API pricing</Ext> is usage-based, with a platform fee plus carrier fees. We couldn&apos;t read a clean current US rate from its public pages, so we don&apos;t quote one. Ask Vonage or check the customer dashboard.</>,
  },
  {
    name: "Plivo",
    suits: "Teams looking for a similar voice and SMS API at lower list prices.",
    body: <>Its <Ext href={URLS.plivoVoice}>voice</Ext> and <Ext href={URLS.plivoSms}>SMS</Ext> prices are public and easy to compare. Its voice page lists answering machine detection, recording and conference calls at no per-minute charge, and storage free for 90 days.</>,
  },
  {
    name: "Sinch",
    suits: "Businesses that text globally and want public pay-as-you-go rates.",
    body: <>Its <Ext href={URLS.sinchSms}>SMS rates</Ext> are public. For voice, its <Ext href={URLS.sinchVoice}>pricing page</Ext> links to a country price list, and shows a general &ldquo;from $0.01 a minute&rdquo; that doesn&apos;t name a country.</>,
  },
  {
    name: "Bandwidth",
    suits: "Larger voice and messaging users who want a provider with its own US network.",
    body: <>Bandwidth says it owns its Tier 1 network, and it bills voice in 6-second increments. Its <Ext href={URLS.bandwidthPricing}>pricing page</Ext> lists starting rates, with volume discounts on top.</>,
  },
  {
    name: "SignalWire",
    suits: "Twilio users who want to move working code with few changes.",
    body: <>Its <Ext href={URLS.signalwireCompat}>Compatibility API</Ext> is built to mirror Twilio&apos;s REST API and TwiML, using a format it calls cXML. You still need to change credentials and endpoints, and use SignalWire numbers. Check your TwiML verbs against its reference before you move.</>,
  },
];

export default function Page() {
  return (
    <CompareShell
      path={path}
      title="Twilio alternatives: 6 API providers compared"
      lede="The main Twilio alternatives are Telnyx, Vonage, Plivo, Sinch, Bandwidth and SignalWire. All of them are API providers for developers, and several list lower US rates than Twilio, but moving means new numbers or ports and new registrations. Here's who each suits, and when staying on Twilio makes more sense."
      ctaTitle="Staying on Twilio?"
      ctaText="Dialbubble puts your Twilio account on your iPhone, free. Try it in Demo Mode, with no account needed."
      sources={[
        { name: "Twilio: US voice pricing", href: URLS.twilioVoice },
        { name: "Twilio: US SMS pricing", href: URLS.twilioSms },
        { name: "Telnyx: voice pricing", href: URLS.telnyxVoice },
        { name: "Telnyx: messaging pricing", href: URLS.telnyxSms },
        { name: "Vonage: API pricing", href: URLS.vonagePricing },
        { name: "Plivo: US voice pricing (dated May 2026)", href: URLS.plivoVoice },
        { name: "Plivo: US SMS pricing", href: URLS.plivoSms },
        { name: "Sinch: SMS pricing", href: URLS.sinchSms },
        { name: "Sinch: voice pricing", href: URLS.sinchVoice },
        { name: "Bandwidth: pricing", href: URLS.bandwidthPricing },
        { name: "SignalWire: pricing", href: URLS.signalwirePricing },
        { name: "SignalWire: Compatibility API", href: URLS.signalwireCompat },
      ]}
      faq={[
        { q: "What's the best Twilio alternative?", a: "There isn't one winner. SignalWire is the shortest path for existing TwiML code, Telnyx and Plivo are common picks for lower list prices, and Bandwidth suits high US volumes. Compare using your own traffic, including carrier fees." },
        { q: "Is there a Twilio alternative for personal use?", a: "These are all developer platforms, so they may be more than you need. For one person wanting a second number, a phone app such as Google Voice is usually simpler." },
        { q: "Are any of these open source?", a: "These six are commercial services. We didn't assess self-hosted options here." },
        { q: "Does Dialbubble work with these providers?", a: "No. Dialbubble only works with Twilio today, and we aren't promising support for any other provider." },
        { q: "Do lower rates mean a lower bill?", a: "Not always. US carriers add per-message fees whichever provider you use, and A2P 10DLC registration applies across providers. Support plans, volume tiers and your engineering time also count." },
      ]}
    >
      <Container as="section">
        <Callout type="info" title="Does Dialbubble work with these?">
          <p>No. Dialbubble only works with Twilio today, and we make no promises about others. This roundup is here because choosing a provider is a fair question, whatever app you use. If you move away from Twilio, Dialbubble won&apos;t come with you.</p>
        </Callout>
      </Container>

      <Container as="section" className="mt-16">
        <h2 className="display-2">Who is each Twilio alternative for?</h2>
        <div className="mt-8 border-t-4 border-ink">
          {providers.map((provider) => (
            <article key={provider.name} className="grid gap-x-10 gap-y-2 border-b border-line py-6 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
              <div>
                <h3 className="font-display text-[1.75rem] font-bold leading-tight">{provider.name}</h3>
                <p className="mt-1 font-semibold">{provider.suits}</p>
              </div>
              <p className="text-ink-soft">{provider.body}</p>
            </article>
          ))}
        </div>
      </Container>

      <Container as="section" className="mt-20">
        <h2 className="display-2">Published US prices, side by side</h2>
        <p className="lede mt-3 text-ink-soft">Starting list prices in US dollars, {CHECKED}, before carrier fees and volume discounts. These aren&apos;t like-for-like quotes, since included features differ.</p>
        <div className="mt-6">
          <ComparisonTable
            caption="Published US prices for Twilio and six alternatives, as of November 2026"
            columns={["Outbound call, per min", "Inbound call, per min", "SMS, per segment", "Local number, per month"]}
            rows={[
              { label: "Twilio", values: [rate(TWILIO.callOut), rate(TWILIO.callIn), rate(TWILIO.sms), usd(TWILIO.localNumber)] },
              { label: "Telnyx", values: ["From $0.005", "From $0.0032", "$0.004", "$1.00"] },
              { label: "Vonage", values: ["Not quoted", "Not quoted", "Not quoted", "Not quoted"] },
              { label: "Plivo", values: ["$0.0115", "$0.0055", "$0.0077", "$0.50"] },
              { label: "Sinch", values: ["See its price list", "See its price list", "$0.0078", "Not quoted"] },
              { label: "Bandwidth", values: ["From $0.01", "From $0.0055", "From $0.004", "Not quoted"] },
              { label: "SignalWire", values: ["$0.008", "$0.0066", "$0.00415", "$0.50"] },
            ]}
          />
        </div>
        <p className="mt-3 text-[0.9375rem] text-ink-soft">Links to each provider&apos;s page are in the sources below. See what your own Twilio usage costs with the <Link href="/tools/twilio-pricing-calculator" className="link">pricing calculator</Link>, then get a quote elsewhere for the same usage.</p>
      </Container>

      <section className="mt-20 bg-sunken py-16">
        <Container className="grid gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <h2 className="display-2">When should you stay on Twilio?</h2>
            <ul className="mt-6 list-disc space-y-2 pl-5">
              <li>You use a range of <Ext href={URLS.twilioProducts}>Twilio products</Ext>, like Studio, Verify, Flex or SendGrid.</li>
              <li>Your bill is small, so a saving wouldn&apos;t cover the time spent moving.</li>
              <li>Your code leans on Twilio-specific features, or your team knows it well.</li>
              <li>You want the large library of docs and community answers.</li>
            </ul>
            <p className="mt-4">If cost is the concern, first read <Link href="/guides/how-does-twilio-pricing-work" className="link">how Twilio pricing works</Link>, since encoding and segments can inflate a bill on any provider.</p>
          </div>
          <div>
            <h2 className="display-2">What does moving actually involve?</h2>
            <ul className="mt-6 list-disc space-y-2 pl-5">
              <li><strong>Numbers:</strong> you buy new ones or port the old ones. Plan for this, as ports take time.</li>
              <li><strong>Texting registration:</strong> your US messaging registration needs handling with the new provider. Our <Link href="/guides/a2p-10dlc-registration-guide" className="link">A2P 10DLC guide</Link> explains what it involves.</li>
              <li><strong>Code:</strong> update SDKs, credentials and webhook signature checks. TwiML-style providers reduce this work but rarely eliminate it.</li>
              <li><strong>Testing:</strong> test deliverability and call quality on your own routes, not just on price lists.</li>
            </ul>
          </div>
        </Container>
      </section>
    </CompareShell>
  );
}

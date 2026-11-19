import Link from "next/link";
import { Ext, FaqSection, PageData, Sources } from "@/app/compare/_shared/parts";
import { CHECKED, URLS } from "@/app/compare/_shared/rates";
import { Callout } from "@/components/Callout";
import { ComparisonTable } from "@/components/ComparisonTable";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { PageHero } from "@/components/PageHero";
import { PhoneFrame } from "@/components/PhoneFrame";
import { RelatedLinks } from "@/components/RelatedLinks";
import { metaFor } from "@/lib/registry";

const path = "/twilio-console-mobile";
export const metadata = metaFor(path, { type: "article" });

const faq = [
  {
    q: "Is there a Twilio Console app?",
    a: `We found no Twilio Console app from Twilio as of ${CHECKED}, and Twilio's support site says it has no official standalone app for managing calls. The Console is a website you can open in a browser.`,
  },
  {
    q: "How do I check my Twilio balance on my phone?",
    a: "Sign in to the Console in your phone's browser and open Billing, or open Dialbubble, which shows your balance on the Home screen.",
  },
  {
    q: "Can I add funds from Dialbubble?",
    a: "No. Payments and billing settings stay in the Twilio Console. Dialbubble only reads your balance and usage.",
  },
  {
    q: "Can I buy a phone number from Dialbubble?",
    a: "No. You buy and configure numbers in the Console, and Dialbubble picks them up when it syncs.",
  },
  {
    q: "Can I give someone read-only access on their phone?",
    a: "Dialbubble connects with your account credentials, so whoever holds them can place calls and send texts. To limit what a teammate can do, invite them to the Console. Twilio has roles such as Billing Manager and Support.",
  },
];

export default function Page() {
  return (
    <>
      <PageData path={path} />
      <PageHero
        title="Twilio Console mobile: manage your account on the go"
        lede={
          <>
            There&apos;s no Twilio Console app. The Console is a website, so you can sign in from Safari when you need it. For the checks you repeat, like your balance, usage and recent logs, a phone app is quicker, and Dialbubble covers those (but not everything).
          </>
        }
      />

      <Container as="section" className="mt-2">
        <h2 className="display-2">Which account tasks can you do from your phone?</h2>
        <p className="lede mt-3 text-ink-soft">We sorted this by the jobs people actually need to do when they&apos;re away from a desk.</p>
        <div className="mt-8">
          <ComparisonTable
            caption="Twilio account tasks in the Console in a browser and in Dialbubble"
            columns={["Console in Safari", "Dialbubble"]}
            highlight={1}
            rows={[
              { label: "Check your balance", values: [true, "Yes, on Home"] },
              { label: "See this month's cost by category", values: [true, "Yes, in Usage"] },
              { label: "Look up a call's status", values: [true, "Yes, in Recents and call details"] },
              { label: "See whether a text was delivered", values: [true, "Yes, in the thread"] },
              { label: "Understand an error code", values: ["Yes, with the code's reference", "Yes, in plain English"] },
              { label: "Play back or delete a recording", values: [true, true] },
              { label: "Check a number with Lookup", values: ["Yes, or use the API", "Yes, including paid add-ons"] },
              { label: "See your numbers and caller IDs", values: [true, true] },
              { label: "Switch between accounts", values: [true, "Yes, on Home"] },
              { label: "Add funds or change billing", values: [true, false] },
              { label: "Buy or release a number", values: [true, false] },
              { label: "Change where a number's calls go", values: [true, false] },
              { label: "Register for A2P 10DLC", values: [true, false] },
              { label: "Create API Keys, invite users", values: [true, false] },
            ]}
          />
        </div>
      </Container>

      <section className="mt-20 bg-sunken py-16">
        <Container>
          <h2 className="display-2 max-w-[20ch]">Your account at a glance, in three screens</h2>
          <ul className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-3">
            <li>
              <PhoneFrame screen="home" sizes="(max-width: 640px) 220px, 30vw" className="mx-auto w-[220px] sm:w-full sm:max-w-[280px]" />
              <h3 className="display-3 mt-5">Is the account healthy?</h3>
              <p className="mt-1 text-ink-soft">Balance, account status, and a 7-day activity chart.</p>
            </li>
            <li>
              <PhoneFrame screen="recents" sizes="(max-width: 640px) 220px, 30vw" className="mx-auto w-[220px] sm:w-full sm:max-w-[280px]" />
              <h3 className="display-3 mt-5">What just happened?</h3>
              <p className="mt-1 text-ink-soft">Recent calls with filters, so you can spot a failed or unexpected one.</p>
            </li>
            <li>
              <PhoneFrame screen="call-detail" sizes="(max-width: 640px) 220px, 30vw" className="mx-auto w-[220px] sm:w-full sm:max-w-[280px]" />
              <h3 className="display-3 mt-5">What went wrong?</h3>
              <p className="mt-1 text-ink-soft">Status, duration, cost when Twilio reports it, and any recording.</p>
            </li>
          </ul>
        </Container>
      </section>

      <Container as="section" className="mt-20 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="display-2">Getting warned before your balance runs out</h2>
          <p className="mt-4">Dialbubble shows your balance and warns when it&apos;s low while you use it, but it has no server to alert you otherwise. So set the alert up in Twilio.</p>
          <p className="mt-4">Twilio&apos;s <Ext href={URLS.twilioBilling}>billing docs</Ext> point to usage triggers, which fire on usage thresholds you set. Your balance, invoices and payment methods are all under Billing in the Console. To understand what&apos;s on your bill, read <Link href="/guides/how-does-twilio-pricing-work" className="link">how Twilio pricing works</Link>, or estimate next month in the <Link href="/tools/twilio-pricing-calculator" className="link">pricing calculator</Link>.</p>
        </div>
        <div>
          <h2 className="display-2">When you see an error on the go</h2>
          <p className="mt-4">Console logs use numeric codes. Look any of them up in our <Link href="/twilio-errors" className="link">Twilio error guide</Link>, which works on a phone without the app. Dialbubble translates them for you on the call or message where they happened.</p>
          <div className="mt-6">
            <Callout type="warning" title="Treat your credentials like a card number">
              <p>Anyone with your Auth Token can spend your balance. On a phone, an API Key you can revoke is the safer choice. Here&apos;s <Link href="/guides/twilio-auth-token-vs-api-key" className="link">how Auth Tokens and API Keys differ</Link>.</p>
            </Callout>
          </div>
        </div>
      </Container>

      <Container as="section" width="narrow" className="mt-20">
        <h2 className="display-2">Do you need an app for this at all?</h2>
        <p className="mt-4">If you check your account once a month, probably not. Safari is free, official and complete, and you won&apos;t need to share a credential with anyone. An app earns its place if you check often, or if you also want to call and text from your Twilio numbers. Our <Link href="/compare/dialbubble-vs-twilio-console" className="link">Dialbubble vs Twilio Console comparison</Link> goes further.</p>
      </Container>

      <FaqSection title="Twilio Console app questions" items={faq} />
      <Sources items={[{ name: "Twilio: mobile application availability", href: URLS.twilioNoApp }, { name: "Twilio: billing docs", href: URLS.twilioBilling }, { name: "Twilio: user roles", href: URLS.twilioRoles }]} />
      <RelatedLinks path={path} />
      <CtaBand title="See your account view without connecting one" text="Demo Mode shows Home, usage and logs on simulated data, with no credentials needed." />
    </>
  );
}

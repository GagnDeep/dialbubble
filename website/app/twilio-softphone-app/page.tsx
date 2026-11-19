import Link from "next/link";
import { Ext, FaqSection, PageData, Sources } from "@/app/compare/_shared/parts";
import { CHECKED, rate, SOFTPHONE_PER_MIN, TALK_PER_MIN, TWILIO, URLS } from "@/app/compare/_shared/rates";
import { Callout } from "@/components/Callout";
import { ComparisonTable } from "@/components/ComparisonTable";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { PageHero } from "@/components/PageHero";
import { PhoneFrame } from "@/components/PhoneFrame";
import { RelatedLinks } from "@/components/RelatedLinks";
import { metaFor } from "@/lib/registry";

const path = "/twilio-softphone-app";
export const metadata = metaFor(path, { type: "article" });

function Lane({ title, steps, tone }: { title: string; steps: string[]; tone: "bridge" | "voip" }) {
  return (
    <div className={tone === "bridge" ? "rounded-lg bg-mint-tint p-6" : "rounded-lg bg-sunken p-6"}>
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      <ol className="mt-5 space-y-3">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3">
            <span aria-hidden="true" className="key size-8 flex-none bg-surface text-sm">{index + 1}</span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

const choices = [
  {
    title: "Build on Twilio's Voice SDK",
    who: "You have a developer and want calling in your own app.",
    text: <>Real in-app calls, including incoming ones. The <Ext href={URLS.iosSdk}>iOS quickstart</Ext> uses a backend to issue access tokens, a TwiML app, and Apple VoIP push credentials.</>,
  },
  {
    title: "Register a SIP softphone to a Twilio SIP Domain",
    who: "You're comfortable with SIP settings.",
    text: <>Twilio&apos;s <Ext href={URLS.sipQuickstart}>SIP quickstart</Ext> and <Ext href={URLS.sipCompat}>softphone notes</Ext> cover this: you make a SIP Domain with credentials, then enter them in a SIP app. Use a SIP Domain and not a bare Elastic SIP Trunk, because trunks don&apos;t accept softphone registration.</>,
  },
  {
    title: "Use a third-party Twilio softphone",
    who: "You're on Android or the web and want no code.",
    text: <>Nethram&apos;s <Ext href={URLS.nethram}>Softphone for Twilio Platform</Ext> says it&apos;s free, and that you pay Twilio. We haven&apos;t tested it, so read its terms before you hand over access.</>,
  },
  {
    title: "Skip Twilio with a VoIP phone service",
    who: "You want an app that simply works, and don't need Twilio itself.",
    text: <>Services like <Link href="/compare/dialbubble-vs-quo" className="link">Quo</Link>, <Link href="/compare/dialbubble-vs-dialpad" className="link">Dialpad</Link> and <Link href="/compare/dialbubble-vs-grasshopper" className="link">Grasshopper</Link> include in-app calling for a flat monthly price.</>,
  },
];

const faq = [
  {
    q: "Is Dialbubble a softphone?",
    a: "No. A softphone sends the call audio over the internet through an app. On a Dialbubble Talk call, Twilio rings your regular phone number and bridges you to the other person, so the audio stays on your normal phone line.",
  },
  {
    q: "Why doesn't Dialbubble include VoIP?",
    a: "In-app calling with Twilio needs a server to issue access tokens. Dialbubble is built to have no server, so your credentials and activity stay between your iPhone and Twilio. That design rules out VoIP.",
  },
  {
    q: "Can I use a bridge call with no cell signal?",
    a: "Only if your phone can still receive a normal call, for example over your carrier's Wi-Fi Calling. A softphone only needs an internet connection.",
  },
  {
    q: "Does a bridge call use my carrier minutes?",
    a: "Usually it's treated as a normal incoming call under your plan. Check your plan, especially when you're roaming.",
  },
  {
    q: "Which is cheaper, a softphone or a bridge?",
    a: `At Twilio's US list prices in ${CHECKED}, an outbound softphone call costs about ${rate(SOFTPHONE_PER_MIN)} a minute and a bridge call about ${rate(TALK_PER_MIN)}. The softphone's minutes are cheaper, though building or hosting one has its own costs.`,
  },
];

export default function Page() {
  return (
    <>
      <PageData path={path} />
      <PageHero
        title="Twilio softphone mobile app: what's real"
        lede="A true Twilio softphone carries the call inside the app over the internet, and Dialbubble doesn't do that. It's a remote control that has Twilio bridge your regular phone to the other person. If you need VoIP, this page explains your real options, and we'll tell you when to choose one of those instead."
      />

      <Container as="section">
        <h2 className="display-2">How a bridge differs from a softphone</h2>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Lane
            tone="bridge"
            title="Bridge call (Dialbubble Talk)"
            steps={[
              "You tap call. Dialbubble asks Twilio to start it over the internet.",
              "Twilio rings your regular number, as a normal phone call.",
              "You answer and press any key. Twilio then dials the other person.",
              "You talk on your normal phone line. They see your Twilio number.",
            ]}
          />
          <Lane
            tone="voip"
            title="Softphone call (VoIP)"
            steps={[
              "You tap call in the app, which is signed in to Twilio with a token.",
              "Your voice travels over Wi-Fi or mobile data to Twilio.",
              "Twilio dials the other person straight away.",
              "You talk inside the app. They see your Twilio number.",
            ]}
          />
        </div>
      </Container>

      <Container as="section" className="mt-16 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
        <div className="min-w-0">
          <h2 className="display-2">What that means day to day</h2>
          <div className="mt-6">
            <ComparisonTable
              caption="A Dialbubble bridge call compared with a true VoIP softphone on Twilio"
              columns={["Dialbubble bridge", "True softphone"]}
              highlight={0}
              rows={[
                { label: "Call audio", values: ["Your phone line", "The internet, in the app"] },
                { label: "Needs your own server", values: [false, "Usually, for tokens and call logic"] },
                { label: "Answers incoming calls in the app", values: [false, true] },
                { label: "Works with data but no phone service", values: ["Only with carrier Wi-Fi Calling", true] },
                { label: "Time to connect", values: ["Your phone rings first, then a key press", "Connects from the app"] },
                { label: "Twilio cost per outbound US minute", values: [`${rate(TALK_PER_MIN)}: two legs at ${rate(TWILIO.callOut)}`, `${rate(SOFTPHONE_PER_MIN)}: ${rate(TWILIO.client)} client leg plus ${rate(TWILIO.callOut)}`] },
                { label: "Setup", values: ["Paste your Twilio keys", "A developer project, or SIP settings"] },
              ]}
            />
          </div>
          <p className="mt-3 text-[0.9375rem] text-ink-soft">
            List prices from <Ext href={URLS.twilioVoice}>Twilio&apos;s US voice pricing</Ext>, {CHECKED}. Your carrier may also count the bridge&apos;s incoming leg against your plan. Try your own minutes in the <Link href="/tools/twilio-pricing-calculator" className="link">pricing calculator</Link>.
          </p>
        </div>
        <figure className="mx-auto w-[220px] lg:w-[250px]">
          <PhoneFrame screen="active-call" sizes="250px" alt="Dialbubble during a live Talk call, showing status and a hang up control while the audio runs on the regular phone line" />
          <figcaption className="mt-4 text-center text-[0.9375rem] text-ink-soft">During a Talk call, the app shows status and hang up. The audio stays on your phone line.</figcaption>
        </figure>
      </Container>

      <section className="mt-20 bg-sunken py-16">
        <Container>
          <h2 className="display-2 max-w-[22ch]">When is a real softphone the better choice?</h2>
          <ul className="mt-6 grid max-w-[60rem] list-disc gap-x-10 gap-y-3 pl-5 md:grid-cols-2">
            <li>You need to answer calls to your Twilio number inside the app.</li>
            <li>You often have Wi-Fi but no phone signal, or you&apos;re using a device with no phone line.</li>
            <li>You make enough long calls that the extra leg adds up.</li>
            <li>You don&apos;t want business calls using your mobile plan or roaming allowance.</li>
            <li>A key press before each call would slow you down, as it would on a sales team.</li>
            <li>You&apos;re on Android, where Dialbubble isn&apos;t available.</li>
          </ul>
          <p className="mt-8 max-w-[46rem]">
            The bridge suits you if you make occasional calls from a Twilio number, you already have a good phone plan, and you don&apos;t want a server. <Link href="/how-it-works#talk" className="link">See exactly how a Talk call works</Link>.
          </p>
        </Container>
      </section>

      <Container as="section" className="mt-20">
        <h2 className="display-2">Ways to get a real softphone</h2>
        <div className="mt-8 grid gap-x-12 gap-y-8 md:grid-cols-2">
          {choices.map((choice) => (
            <article key={choice.title} className="border-t border-line pt-4">
              <h3 className="display-3">{choice.title}</h3>
              <p className="mt-1 font-semibold">{choice.who}</p>
              <p className="mt-2 text-ink-soft">{choice.text}</p>
            </article>
          ))}
        </div>
        <div className="mt-10 max-w-[46rem]">
          <Callout type="tip" title="Incoming calls without a softphone">
            <p>You can forward a Twilio number to your regular phone, with no app involved. Each forwarded call bills an inbound and an outbound leg. See <Link href="/guides/twilio-call-forwarding" className="link">how Twilio call forwarding works</Link>.</p>
          </Callout>
        </div>
      </Container>

      <FaqSection title="Softphone questions" items={faq} />
      <Sources
        items={[
          { name: "Twilio: US voice pricing", href: URLS.twilioVoice },
          { name: "Twilio: iOS Voice SDK quickstart", href: URLS.iosSdk },
          { name: "Twilio: SIP quickstart", href: URLS.sipQuickstart },
          { name: "Twilio: softphones with SIP Domains", href: URLS.sipCompat },
          { name: "Nethram: Softphone for Twilio Platform", href: URLS.nethram },
        ]}
      />
      <RelatedLinks path={path} />
      <CtaBand title="Fine with a bridge? Try it first" text="Demo Mode shows how a Talk call flows, on simulated data and with no Twilio account." />
    </>
  );
}

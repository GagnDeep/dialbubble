import Link from "next/link";
import { CostAssumptions, Ext, FaqSection, PageData, Sources } from "@/app/compare/_shared/parts";
import { CHECKED, monthlyOnTwilio, TWILIO, URLS, usd } from "@/app/compare/_shared/rates";
import { Callout } from "@/components/Callout";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { PageHero } from "@/components/PageHero";
import { PhoneFrame } from "@/components/PhoneFrame";
import { RelatedLinks } from "@/components/RelatedLinks";
import { Steps } from "@/components/Steps";
import { metaFor } from "@/lib/registry";
import { howToLd, JsonLd } from "@/lib/seo";

const path = "/second-business-number-iphone";
export const metadata = metaFor(path, { type: "article" });

const twilioSteps = [
  { name: "Get a Twilio account and number", text: `Sign up and buy a number in the Twilio Console. A US local number is ${usd(TWILIO.localNumber)} a month as of ${CHECKED}.` },
  { name: "Connect the number to your iPhone", text: "Enter your Twilio keys in Dialbubble, choose the number as your default, and enter your regular number for Talk calls." },
  { name: "Forward incoming calls", text: "Dialbubble doesn't answer calls, so point the number at your regular phone or voicemail in the Twilio Console. Your personal number stays private, as callers only see the Twilio number." },
  { name: "Register for US texting", text: "If you'll text US numbers from a local number, complete A2P 10DLC registration. This has its own fees and takes time for approval." },
];

const faq = [
  {
    q: "What's the easiest way to get a second number on iPhone?",
    a: "For most people, a business phone app or a second eSIM line. Either rings your iPhone directly and shows new texts straight away, with little setup. A Twilio number takes more work and suits you if you want its pay-per-use pricing or already have an account.",
  },
  {
    q: "Can I have two numbers on one iPhone with no app?",
    a: "Yes, with Dual SIM. Apple says you can use one number for business and another for personal calls. iPhone 13 and later can use two eSIMs. Your carrier must support it, and you'll pay for a second line.",
  },
  {
    q: "Is a second number free?",
    a: "Google Voice offers a free consumer number to eligible US residents, with Google's limits on inactive numbers. Otherwise, expect to pay a monthly fee to a carrier, an app or Twilio.",
  },
  {
    q: "Will callers see my personal number?",
    a: "Not when you call through the second number. With Dialbubble, the other person sees your Twilio number. A forwarded incoming call also doesn't show them your personal number.",
  },
];

export default function Page() {
  const light = monthlyOnTwilio(100, 100);
  return (
    <>
      <JsonLd data={howToLd({ name: "How to add a second business number to your iPhone with Twilio", description: "Use your own Twilio number on iPhone as a second business line.", path, steps: twilioSteps })} />
      <PageData path={path} />
      <PageHero
        title="Second phone number for business on iPhone"
        lede="You have three good ways to do it: a second eSIM line from a carrier, a business phone app, or your own Twilio number used through an app like Dialbubble. Most people should pick one of the first two, as they ring your phone and show texts as they arrive. Here's how they compare."
      />

      <Container as="section">
        <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3">
        <article className="bg-surface p-6">
          <h2 className="font-display text-2xl font-semibold">A second eSIM line</h2>
          <p className="mt-2 font-semibold">Best if you want it to behave exactly like a phone line.</p>
          <p className="mt-3 text-ink-soft"><Ext href={URLS.appleDualSim}>Apple&apos;s Dual SIM</Ext> gives you two numbers with normal calls and texts, built into the Phone and Messages apps. iPhone 13 and later can hold two eSIMs. You pay for a second carrier line, and only one line can use cellular data at a time.</p>
        </article>
        <article className="bg-surface p-6">
          <h2 className="font-display text-2xl font-semibold">A business phone app</h2>
          <p className="mt-2 font-semibold">Best for most small businesses.</p>
          <p className="mt-3 text-ink-soft">Grasshopper starts at <Ext href={URLS.grasshopperInfo}>$14 a month billed annually</Ext>, Quo at <Ext href={URLS.quoPricing}>$15 per user</Ext> and paid Google Voice at <Ext href={URLS.gvPlans}>$10 per user</Ext> ({CHECKED}). You get in-app calling and voicemail on Wi-Fi or data. <Link href="/business-phone-app-iphone" className="link">Compare business phone apps</Link>.</p>
        </article>
        <article className="bg-mint-tint p-6">
          <h2 className="font-display text-2xl font-semibold">Your own Twilio number</h2>
          <p className="mt-2 font-semibold">Best at low volume, or if you already use Twilio.</p>
          <p className="mt-3">No plan: you pay for the number and what you use, about {usd(light)} a month for 100 call minutes and 100 texts. It takes more setup, has no in-app calling, and Dialbubble can&apos;t alert you to new texts when it&apos;s closed.</p>
        </article>
        </div>
        <CostAssumptions />
      </Container>

      <Container as="section" className="mt-20 grid items-start gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16">
        <div>
          <h2 className="display-2">How to set up a Twilio number as your second line</h2>
          <p className="lede mt-3 text-ink-soft">This takes more steps than the other routes, and the third step is the one people miss.</p>
          <Steps className="mt-8" items={twilioSteps.map((s) => ({ title: s.name, text: s.text }))} />
          <p className="mt-8">
            More detail: <Link href="/guides/how-much-does-a-twilio-phone-number-cost" className="link">what a Twilio number costs</Link>, <Link href="/guides/twilio-call-forwarding" className="link">how to forward calls</Link> and the <Link href="/guides/a2p-10dlc-registration-guide" className="link">A2P 10DLC registration guide</Link>. Numbers outside the US may need a <Link href="/guides/twilio-regulatory-bundle-guide" className="link">regulatory bundle</Link>.
          </p>
        </div>
        <PhoneFrame screen="settings" sizes="260px" className="mx-auto w-[220px] md:sticky md:top-24 lg:w-[260px]" alt="Dialbubble Settings, where you set your default numbers and accounts" />
      </Container>

      <section className="mt-20 bg-sunken py-16">
        <Container className="grid gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <h2 className="display-2">What happens when a customer calls or texts?</h2>
            <p className="mt-4">This is where the three routes differ the most, and it&apos;s worth checking before you print the number on anything.</p>
          </div>
          <dl className="space-y-5">
            <div><dt className="display-3">Calls with an eSIM or a phone app</dt><dd className="mt-1 text-ink-soft">Your iPhone rings on that number. You answer as you&apos;d expect.</dd></div>
            <div><dt className="display-3">Calls to a Twilio number</dt><dd className="mt-1 text-ink-soft">Twilio does what you told it to. Forwarding to your regular phone bills an inbound and an outbound leg, and Dialbubble isn&apos;t involved.</dd></div>
            <div><dt className="display-3">Texts to a Twilio number</dt><dd className="mt-1 text-ink-soft">They wait in your account. Dialbubble shows them when it&apos;s open, checking every 20 seconds, with no push when it&apos;s closed. So a customer&apos;s urgent text could wait until you next open the app.</dd></div>
          </dl>
        </Container>
      </section>

      <Container as="section" width="narrow" className="mt-20">
        <Callout type="tip" title="Looking for a step-by-step on every option?">
          <p>Our <Link href="/guides/second-phone-number-for-business-on-iphone" className="link">full guide to second numbers on iPhone</Link> walks through each route, whichever you choose. If you plan to call abroad, also see <Link href="/guides/international-calling-on-iphone-with-your-own-number" className="link">international calling with your own number</Link>.</p>
        </Callout>
      </Container>

      <FaqSection title="Second number questions" items={faq} />
      <Sources
        items={[
          { name: "Apple: Dual SIM with an eSIM", href: URLS.appleDualSim },
          { name: "Grasshopper: plan summary", href: URLS.grasshopperInfo },
          { name: "Quo: pricing", href: URLS.quoPricing },
          { name: "Google Voice: plans", href: URLS.gvPlans },
          { name: "Google Voice: eligibility guide", href: URLS.gvEligibility },
          { name: "Twilio: US voice pricing", href: URLS.twilioVoice },
          { name: "Twilio: US SMS pricing", href: URLS.twilioSms },
          { name: "Twilio: A2P 10DLC fees", href: URLS.twilioA2p },
        ]}
      />
      <RelatedLinks path={path} />
      <CtaBand title="Picked the Twilio route?" text="Dialbubble is free and adds nothing to Twilio's prices. Try it first in Demo Mode, with no account needed." />
    </>
  );
}

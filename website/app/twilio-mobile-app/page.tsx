import Link from "next/link";
import { Ext, FaqSection, PageData, Sources } from "@/app/compare/_shared/parts";
import { CHECKED, URLS } from "@/app/compare/_shared/rates";
import { Callout } from "@/components/Callout";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { PageHero } from "@/components/PageHero";
import { PhoneFrame } from "@/components/PhoneFrame";
import { RelatedLinks } from "@/components/RelatedLinks";
import { metaFor } from "@/lib/registry";

const path = "/twilio-mobile-app";
export const metadata = metaFor(path, { type: "article" });

const options = [
  {
    name: "Twilio Flex Mobile",
    maker: "Twilio",
    fit: "Staff at a business that already runs a Twilio Flex contact center.",
    body: (
      <>
        This is the one Twilio-published app we found for calling and messaging customers. Its <Ext href={URLS.flexApp}>App Store listing</Ext> says it requires an existing Flex account, so it won&apos;t help if you only have a regular Twilio account and a phone number.
      </>
    ),
  },
  {
    name: "Build your own with the Voice SDK",
    maker: "You, using Twilio's tools",
    fit: "Developers who need in-app calling inside their own product.",
    body: (
      <>
        Twilio&apos;s recommended route is its iOS and Android SDKs. They give you real VoIP, but you also need a server. The <Ext href={URLS.iosSdk}>iOS quickstart</Ext> has you set up access tokens, a TwiML app and push credentials. <Link href="/twilio-softphone-app" className="link">Your softphone options</Link> covers this further.
      </>
    ),
  },
  {
    name: "The Console in your phone's browser",
    maker: "Twilio",
    fit: "An occasional check when you're away from your desk.",
    body: (
      <>
        The Twilio Console is a website, so you can sign in from Safari. Here&apos;s <Link href="/twilio-console-mobile" className="link">what you can manage from your phone</Link>, and which jobs are easier in an app or at a desk.
      </>
    ),
  },
  {
    name: "Third-party apps",
    maker: "Independent developers",
    fit: "People who want to use their existing Twilio numbers from a phone, without writing code.",
    body: (
      <>
        These work with your own account. On iPhone we found <Ext href={URLS.twiphone}>TwiPhone Pilot</Ext> ($2.99), <Ext href={URLS.dialmagics}>DialMagics</Ext> (free) and Dialbubble, which we make. On Android and the web there&apos;s <Ext href={URLS.nethram}>Softphone for Twilio Platform</Ext> from Nethram. We haven&apos;t tested the others, so read their listings. None of them, us included, is made by Twilio.
      </>
    ),
  },
];

const faq = [
  {
    q: "Is there an official Twilio app for iPhone or Android?",
    a: "Not for ordinary accounts. Twilio's support site says it has no official standalone app for placing, answering or managing calls. Twilio does publish Flex Mobile, but that requires a Twilio Flex account.",
  },
  {
    q: "Why doesn't Twilio have a mobile app?",
    a: "We don't know of a public statement from Twilio explaining this. What Twilio documents instead is a set of SDKs that let developers build calling into their own apps.",
  },
  {
    q: "Is it safe to put my Twilio credentials in a third-party app?",
    a: "Your credentials can spend your money, so check where each app keeps them and whether they pass through a server. You can limit the risk by using an API Key you can revoke rather than your Auth Token. Dialbubble stores them in the iPhone Keychain and has no server.",
  },
  {
    q: "Can I answer incoming Twilio calls in a mobile app?",
    a: "Only in an app built with real VoIP, such as one using the Voice SDK. Dialbubble doesn't answer incoming calls. You can forward calls from your Twilio number to your regular phone instead.",
  },
];

export default function Page() {
  return (
    <>
      <PageData path={path} />
      <PageHero
        eyebrow={`Checked ${CHECKED}`}
        title="Is there a Twilio mobile app?"
        lede={
          <>
            No, not for ordinary Twilio accounts. <Ext href={URLS.twilioNoApp}>Twilio&apos;s support site</Ext> says it has no official standalone mobile app for placing, answering or managing calls, and we found no Twilio-published Console app either. Below are the options that do exist, and who each one is for.
          </>
        }
      />

      <Container as="section" className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-20">
        <div>
          <h2 className="display-2">What you can use instead</h2>
          <div className="mt-8 border-t border-line">
            {options.map((option) => (
              <article key={option.name} className="grid gap-x-8 gap-y-2 border-b border-line py-7 md:grid-cols-[13rem_minmax(0,1fr)]">
                <div>
                  <h3 className="display-3">{option.name}</h3>
                  <p className="mt-1 text-[0.9375rem] text-ink-soft">Made by {option.maker}</p>
                </div>
                <div>
                  <p>{option.body}</p>
                  <p className="mt-2 font-semibold">Best for: <span className="font-normal text-ink-soft">{option.fit}</span></p>
                </div>
              </article>
            ))}
          </div>
        </div>
        <figure className="mx-auto w-[220px] lg:sticky lg:top-24 lg:w-[260px]">
          <PhoneFrame screen="home" sizes="260px" alt="Dialbubble Home screen showing a Twilio balance, numbers and recent activity" />
          <figcaption className="mt-4 text-center text-[0.9375rem] text-ink-soft">Dialbubble, a third-party app. Twilio doesn&apos;t make or endorse it.</figcaption>
        </figure>
      </Container>

      <section className="mt-20 bg-sunken py-16">
        <Container className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="display-2">Which one do you need?</h2>
            <p className="lede mt-3 text-ink-soft">It comes down to one question: do you need your phone&apos;s app to carry the call audio itself?</p>
          </div>
          <ul className="space-y-4">
            <li><strong>Yes, in-app calling and answering:</strong> use the Voice SDK, or a VoIP phone service like <Link href="/compare/dialbubble-vs-quo" className="link">Quo</Link>. A bridge app won&apos;t do it.</li>
            <li><strong>No, you just want to call and text from your Twilio number:</strong> a third-party app will do. <Link href="/twilio-iphone-app" className="link">See Dialbubble on iPhone</Link>.</li>
            <li><strong>You&apos;re mostly checking on the account:</strong> Safari is free and official. An app makes balance and logs quicker to reach.</li>
            <li><strong>You&apos;re a Flex customer:</strong> ask your Flex admin about Flex Mobile first.</li>
          </ul>
        </Container>
      </section>

      <Container as="section" width="narrow" className="mt-20">
        <h2 className="display-2">What does a mobile setup cost?</h2>
        <p className="mt-4">Whichever app you pick, the calls and texts are normally billed by Twilio to your own account. Apps add their own price on top, if they have one. Dialbubble is free and adds no markup, but its two-way calls bill as two legs. Put your own usage in the <Link href="/tools/twilio-pricing-calculator" className="link">Twilio pricing calculator</Link> to see a monthly figure before you commit.</p>
        <div className="mt-6">
          <Callout type="info" title="Not on Twilio yet?">
            <p>You may not need it. If all you want is a business number on your phone, a <Link href="/business-phone-app-iphone" className="link">business phone app</Link> is often simpler, and it comes with in-app calling.</p>
          </Callout>
        </div>
      </Container>

      <FaqSection title="Twilio mobile app questions" items={faq} />
      <Sources
        items={[
          { name: "Twilio: mobile application availability", href: URLS.twilioNoApp },
          { name: "App Store: Twilio Flex Mobile", href: URLS.flexApp },
          { name: "Twilio: iOS Voice SDK quickstart", href: URLS.iosSdk },
          { name: "App Store: TwiPhone Pilot", href: URLS.twiphone },
          { name: "App Store: DialMagics", href: URLS.dialmagics },
          { name: "Nethram: Softphone for Twilio Platform", href: URLS.nethram },
        ]}
      />
      <RelatedLinks path={path} />
      <CtaBand title="See what an unofficial Twilio app looks like" text="Demo Mode runs on simulated data, with no Twilio account needed and nothing charged." />
    </>
  );
}

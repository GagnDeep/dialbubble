import Link from "next/link";
import { Ext, FaqSection, PageData, Sources } from "@/app/compare/_shared/parts";
import { URLS } from "@/app/compare/_shared/rates";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { DownloadButton } from "@/components/DownloadButton";
import { PhoneFrame, type Screen } from "@/components/PhoneFrame";
import { RelatedLinks } from "@/components/RelatedLinks";
import { Steps } from "@/components/Steps";
import { metaFor } from "@/lib/registry";

const path = "/twilio-iphone-app";
export const metadata = metaFor(path, { type: "article" });

const tour: { screen: Screen; title: string; text: string }[] = [
  { screen: "home", title: "Home", text: "Your balance, account status, numbers and a 7-day activity chart." },
  { screen: "keypad", title: "Keypad", text: "Dial a number and pick which of your Twilio numbers it goes out from." },
  { screen: "messages", title: "Messages", text: "Threaded SMS and MMS conversations for each of your numbers." },
  { screen: "settings", title: "Settings", text: "Accounts, numbers, defaults, Face ID lock and your Messaging Service." },
];

const faq = [
  {
    q: "Is Dialbubble an official Twilio iOS app?",
    a: "No. Dialbubble is an independent app that uses Twilio's public API with your own credentials. It isn't made, endorsed or supported by Twilio.",
  },
  {
    q: "Which iPhones does it run on?",
    a: "Any iPhone that runs iOS 26 or later. There's no iPad or Android version.",
  },
  {
    q: "Can I try it without a Twilio account?",
    a: "Yes. Demo Mode runs every feature on simulated data. Nothing is sent and nothing is charged.",
  },
  {
    q: "Will my trial Twilio account work?",
    a: "Partly. Twilio's trial rules still apply: you can only reach numbers you've verified, and two-way Talk calls, recording and custom texts need an upgraded account. Voice Message calls do work on a trial.",
  },
  {
    q: "Can I build my own Twilio iPhone app instead?",
    a: "Yes. Twilio's iOS Voice SDK adds in-app calling to your own app, and it needs a server for access tokens, a TwiML app and push credentials. That's a good choice for a product, but a lot of work for one person's phone.",
  },
];

export default function Page() {
  return (
    <>
      <PageData path={path} />
      <Container as="section" className="grid items-center gap-10 pb-6 pt-10 sm:pt-16 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16">
        <div>
          <h1 className="display-1 max-w-[16ch]">A Twilio iPhone app for your own account</h1>
          <p className="lede mt-5 text-ink-soft">
            <Ext href={URLS.twilioNoApp}>Twilio doesn&apos;t publish a general iOS app</Ext>, so an iPhone app for your account has to come from someone else. Dialbubble is one: a free, independent app that calls and texts from your Twilio numbers, with nothing in between you and Twilio.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <DownloadButton />
            <Link href="/how-it-works" className="btn btn-ghost">How it works</Link>
          </div>
        </div>
        <PhoneFrame screen="home" priority sizes="(max-width: 768px) 240px, 320px" className="mx-auto w-[240px] lg:w-[320px]" />
      </Container>

      <Container as="section" className="mt-16">
        <h2 className="display-2 max-w-[20ch]">What the app looks like on your iPhone</h2>
        <p className="lede mt-3 text-ink-soft">These are real screens from the app, in your device&apos;s light or dark appearance. The names and numbers are sample data.</p>
        <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {tour.map((item) => (
            <li key={item.screen}>
              <PhoneFrame screen={item.screen} sizes="(max-width: 1024px) 45vw, 270px" className="mx-auto w-full max-w-[270px]" />
              <h3 className="display-3 mt-5">{item.title}</h3>
              <p className="mt-1 text-[0.9375rem] text-ink-soft">{item.text}</p>
            </li>
          ))}
        </ul>
      </Container>

      <section className="mt-20 bg-sunken py-16">
        <Container className="grid gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16">
          <div>
            <h2 className="display-2">Made for iPhone, and only iPhone</h2>
            <p className="mt-4">Your Account SID and Auth Token, or an API Key if you prefer, stay on this phone. The <Link href="/security" className="link">security page</Link> explains how.</p>
          </div>
          <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
            <div><dt className="display-3">Keychain</dt><dd className="mt-1 text-ink-soft">Credentials are stored in the iPhone Keychain. Dialbubble has no server to send them to.</dd></div>
            <div><dt className="display-3">Face ID</dt><dd className="mt-1 text-ink-soft">Lock the app, with a privacy screen in the app switcher.</dd></div>
            <div><dt className="display-3">Siri and Shortcuts</dt><dd className="mt-1 text-ink-soft">Send a text, call with a voice message or open the dialer by voice or from a Shortcut.</dd></div>
            <div><dt className="display-3">Plain-English errors</dt><dd className="mt-1 text-ink-soft">Twilio error codes explained, along with how to fix them. The same help is in our <Link href="/twilio-errors" className="link">error guide</Link>.</dd></div>
          </dl>
        </Container>
      </section>

      <Container as="section" className="mt-20 grid items-start gap-10 md:grid-cols-[auto_minmax(0,1fr)] md:gap-16">
        <PhoneFrame screen="onboarding" sizes="260px" className="order-2 mx-auto w-[220px] md:order-1 md:w-[260px]" />
        <div className="order-1 md:order-2">
          <h2 className="display-2">How to connect your Twilio account</h2>
          <Steps
            className="mt-8"
            items={[
              { title: "Copy your keys", text: <>Find your Account SID and Auth Token in the Twilio Console. <Link href="/guides/how-to-find-twilio-account-sid-and-auth-token" className="link">Here&apos;s where to look</Link>.</> },
              { title: "Connect", text: "Paste them in. Smart Paste fills the right fields, and Dialbubble checks them with Twilio." },
              { title: "Pick your numbers", text: "Choose your default numbers for calling and texting. You buy numbers in the Twilio Console, and the app links you there." },
              { title: "Add your own phone", text: "Enter your regular number. That's the phone Twilio rings for two-way calls." },
            ]}
          />
        </div>
      </Container>

      <Container as="section" className="mt-20">
        <h2 className="display-2">What it won&apos;t do on iOS</h2>
        <ul className="mt-6 max-w-[46rem] list-disc space-y-3 pl-5">
          <li><strong>No in-app calling.</strong> Twilio rings your regular phone and bridges the call, which bills two legs. If you need VoIP, read about <Link href="/twilio-softphone-app" className="link">real softphone options</Link>.</li>
          <li><strong>No instant notifications for new texts.</strong> It checks every 20 seconds while it&apos;s open. When it&apos;s closed, optional alerts depend on Background App Refresh, which iOS schedules, so they can be late.</li>
          <li><strong>No incoming call answering.</strong> Calls to your Twilio number follow what you set up in the Twilio Console.</li>
          <li><strong>You need a Twilio account for real use,</strong> and <Link href="/guides/is-twilio-free-trial-limits" className="link">trial accounts have limits</Link>. The app itself is free, and you pay Twilio. Estimate that with the <Link href="/tools/twilio-pricing-calculator" className="link">pricing calculator</Link>.</li>
        </ul>
      </Container>

      <FaqSection title="Twilio iOS app questions" items={faq} />
      <Sources items={[{ name: "Twilio: mobile application availability", href: URLS.twilioNoApp }, { name: "Twilio: iOS Voice SDK quickstart", href: URLS.iosSdk }]} />
      <RelatedLinks path={path} />
      <CtaBand title="Look around before you connect anything" text="Open Demo Mode to try each of these screens on simulated data. You don't need a Twilio account." />
    </>
  );
}

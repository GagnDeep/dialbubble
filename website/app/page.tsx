import Link from "next/link";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { DirectDiagram } from "@/components/DirectDiagram";
import { DownloadButton } from "@/components/DownloadButton";
import { Faq } from "@/components/Faq";
import { GithubButton } from "@/components/GithubButton";
import { PhoneFrame } from "@/components/PhoneFrame";
import { SectionTeaser } from "@/components/SectionTeaser";
import { Steps } from "@/components/Steps";
import { TalkDemo } from "@/components/TalkDemo";
import { coreFaq } from "@/content/faq";
import { featureGroups } from "@/content/features";
import { metaFor } from "@/lib/registry";
import { withBase } from "@/lib/basePath";
import { JsonLd, softwareAppLd } from "@/lib/seo";

export const metadata = metaFor("/");

const trust = ["Free forever", "Open source (MIT)", "No server", "No subscription", "Demo Mode, no sign-up"];

const proof = [
  { value: "$0", label: "Dialbubble's price, forever" },
  { value: "0", label: "Servers between you and Twilio" },
  { value: "2 min", label: "Guided setup" },
  { value: "100%", label: "Source code on GitHub" },
];

const audiences = [
  {
    title: "You run a small business on a Twilio number",
    text: "Answer customers by text and call them back from your business number while you're away from your desk, without giving out your personal number.",
  },
  {
    title: "You build with Twilio",
    text: "Check a number, send a test text, run some TwiML or read the real reason a message failed, all from your phone instead of the Console.",
  },
  {
    title: "You want a second number without a monthly plan",
    text: "Buy a number from Twilio, connect it, and pay for what you use. Dialbubble adds nothing to the bill.",
  },
];

const steps = [
  { title: "Get the app and connect", text: "Copy your Account SID and Auth Token, or an API Key, from the Twilio Console. The guided setup shows you where they are." },
  { title: "Choose your numbers", text: "Dialbubble imports the numbers you own at Twilio. Pick your defaults and add your own phone number for two-way calls." },
  { title: "Call or text", text: "Use your Twilio number straight away. Your first text or call is set up for you at the end of onboarding." },
];

const billed = [
  { what: "The Dialbubble app", who: "Free" },
  { what: "Dialbubble subscription or markup", who: "None" },
  { what: "Your Twilio number", who: "Twilio's monthly rate" },
  { what: "Texts you send and receive", who: "Twilio's rate, per segment" },
  { what: "Voice Message and Play Audio calls", who: "Twilio's rate, one leg" },
  { what: "Talk calls", who: "Twilio's rate, two legs" },
  { what: "Recordings and paid lookups", who: "Twilio's rate, if you use them" },
];

export default function HomePage() {
  return (
    <>
      <JsonLd data={softwareAppLd()} />

      <Container as="section" className="pt-4 sm:pt-6">
        <div className="bubble on-brand overflow-hidden">
          <div className="mx-auto flex max-w-[54rem] flex-col items-center px-5 pt-12 text-center sm:px-10 sm:pt-16 lg:pt-20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withBase("/app-icon.png")}
              alt=""
              width={96}
              height={96}
              className="hero-icon size-20 rounded-[22px] sm:size-24 sm:rounded-[26px]"
            />
            <p className="mt-6 inline-flex flex-wrap items-center justify-center gap-x-2 rounded-full bg-white/8 px-4 py-1.5 text-[0.9375rem] font-semibold text-[#9af7e8] shadow-[inset_0_0_0_1px_rgb(154_247_232/0.25)]">
              Free iPhone app <span aria-hidden="true">·</span> Open source
            </p>
            <h1 className="display-1 mt-5 max-w-[17ch]">
              Your Twilio number, <span className="hero-accent">on your iPhone</span>
            </h1>
            <p className="lede mx-auto mt-5 max-w-[34rem] text-white/85">
              Call and text from the Twilio numbers you already own. Dialbubble talks straight to Twilio, so there&apos;s no server, no subscription and no markup.
            </p>
            <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 xs:w-auto xs:flex-row xs:flex-wrap xs:items-center">
              <DownloadButton tone="onBrand" className="whitespace-nowrap max-xs:text-[1.0625rem]" />
              <GithubButton tone="onBrand" className="whitespace-nowrap max-xs:text-[1.0625rem]" />
            </div>
            <ul className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[0.9375rem] text-white/80" aria-label="Highlights">
              {trust.map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <svg viewBox="0 0 20 20" className="size-4 text-[#6eebd6]" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                    <path d="m4.5 10.5 3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mx-auto mt-12 flex max-w-[60rem] items-end justify-center gap-3 px-4 sm:mt-16 sm:gap-6" aria-label="App screenshots">
            <PhoneFrame screen="keypad" sizes="240px" className="hero-side -mb-24 hidden w-[200px] translate-y-10 -rotate-6 sm:block lg:w-[240px]" />
            <PhoneFrame screen="home" priority sizes="(max-width: 640px) 240px, 300px" className="phone-rise relative z-10 -mb-20 w-[240px] sm:-mb-28 sm:w-[270px] lg:w-[300px]" />
            <PhoneFrame screen="conversation" sizes="240px" className="hero-side -mb-24 hidden w-[200px] translate-y-10 rotate-6 sm:block lg:w-[240px]" />
          </div>
        </div>
      </Container>

      <Container as="section" className="mt-16">
        <ul className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
          {proof.map((item) => (
            <li key={item.label} className="rounded-lg bg-surface px-4 py-6 shadow-[inset_0_0_0_1px_var(--line)]">
              <p className="font-display text-3xl font-bold text-mint-text sm:text-4xl">{item.value}</p>
              <p className="mt-1 text-[0.9375rem] text-ink-soft">{item.label}</p>
            </li>
          ))}
        </ul>
      </Container>

      <Container as="section" className="mt-32 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div>
          <h2 className="display-2">Who it&apos;s for</h2>
          <p className="mt-4 max-w-[28rem] text-ink-soft">
            People who have a Twilio account, or are happy to open one, and want to use it from their phone like a real phone.
          </p>
        </div>
        <div>
          <ul className="border-t border-line">
            {audiences.map((item) => (
              <li key={item.title} className="border-b border-line py-5">
                <h3 className="display-3">{item.title}</h3>
                <p className="mt-1.5 text-ink-soft">{item.text}</p>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-ink-soft">
            Not the right fit if you need calls inside the app, push alerts for every text, or Android.{" "}
            <Link href="/how-it-works#limits" className="link">
              Read the limits
            </Link>
          </p>
        </div>
      </Container>

      <Container as="section" className="mt-24">
        <h2 className="display-2 max-w-[20ch]">Up and running in three steps</h2>
        <Steps items={steps} className="mt-8 grid gap-8 space-y-0 md:grid-cols-3" />
      </Container>

      <section className="mt-24 bg-sunken py-16 sm:py-24">
        <Container className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="display-2">The two-way call, explained</h2>
            <p className="lede mt-4 text-ink-soft">
              A Talk call works on your regular phone, and the other person sees your Twilio number. Try it here to see the order things happen in.
            </p>
            <ol className="mt-6 list-decimal space-y-2 pl-5">
              <li>You tap call in Dialbubble, and Twilio rings your phone first.</li>
              <li>You answer, and a voice asks you to press any key.</li>
              <li>Only then does Twilio dial the other person.</li>
              <li>They pick up and see your Twilio number. You talk on your normal phone.</li>
            </ol>
            <p className="mt-4 text-ink-soft">
              Waiting for the key press means your voicemail or call screening can&apos;t answer and leave the other person holding.
            </p>
            <div className="mt-6 rounded-md bg-surface p-5 shadow-[inset_0_0_0_1px_var(--line)]">
              <h3 className="display-3">An honest note on cost</h3>
              <p className="mt-1.5 text-ink-soft">
                A Talk call is two Twilio calls joined together, one to you and one to them, so Twilio bills both legs at its normal rates. That is the trade-off for having no server and no VoIP.
              </p>
            </div>
          </div>
          <TalkDemo />
        </Container>
      </section>

      <Container as="section" className="mt-24">
        <h2 className="display-2 max-w-[22ch]">Everything your Twilio account can do, in your pocket</h2>
        <div className="mt-10 grid gap-x-12 gap-y-10 md:grid-cols-2">
          {featureGroups.map((group) => (
            <div key={group.id} className="border-t-2 border-ink pt-4">
              <h3 className="display-3 text-2xl">{group.title}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li key={item.name} className="rounded-full bg-sunken px-3 py-1 text-[0.9375rem]">
                    {item.name}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-ink-soft">{group.summary}</p>
            </div>
          ))}
        </div>
        <p className="mt-8">
          <Link href="/features" className="link">
            See every feature in detail
          </Link>
        </p>
      </Container>

      <Container as="section" className="mt-24 grid items-center gap-10 md:grid-cols-[auto_minmax(0,1fr)] md:gap-16">
        <div className="order-2 flex justify-center md:order-1">
          <PhoneFrame screen="messages" sizes="260px" className="w-[230px] sm:w-[260px]" />
        </div>
        <div className="order-1 md:order-2">
          <h2 className="display-2 max-w-[18ch]">Try the whole app before you sign up for anything</h2>
          <p className="lede mt-4 text-ink-soft">
            Tap Explore Demo on the welcome screen and every feature works on simulated data, including threads, auto-replies, live call progress, usage and lookups. Nothing is sent and nothing is charged.
          </p>
          <p className="mt-4 text-ink-soft">No Twilio account needed. When you&apos;re ready, tap Connect Real Account.</p>
        </div>
      </Container>

      <Container as="section" className="mt-24 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="display-2 max-w-[16ch]">Your keys stay on your phone</h2>
          <p className="lede mt-4 text-ink-soft">
            Dialbubble has no server and no analytics. Your credentials stay in the iPhone Keychain, and the app talks directly to Twilio under your own account.
          </p>
          <p className="mt-4">
            <Link href="/security" className="link">
              How security works
            </Link>
            <span className="mx-3 text-ink-soft" aria-hidden="true">
              /
            </span>
            <Link href="/privacy" className="link">
              Privacy policy
            </Link>
          </p>
        </div>
        <DirectDiagram />
      </Container>

      <Container as="section" className="mt-24 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="display-2 max-w-[16ch]">We don&apos;t sit on your phone bill</h2>
          <p className="lede mt-4 text-ink-soft">
            Your usage goes on your Twilio account at Twilio&apos;s own prices. Dialbubble doesn&apos;t see that bill, let alone add to it.
          </p>
          <p className="mt-4">
            <Link href="/pricing" className="link">
              How pricing works
            </Link>
          </p>
        </div>
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">What you pay for when using Dialbubble</caption>
          <thead>
            <tr className="border-b-2 border-ink">
              <th scope="col" className="py-2 pr-4 font-display font-semibold">
                What
              </th>
              <th scope="col" className="py-2 font-display font-semibold">
                What you pay
              </th>
            </tr>
          </thead>
          <tbody>
            {billed.map((row, index) => (
              <tr key={row.what} className="border-b border-line">
                <td className="py-2.5 pr-4 align-top">{row.what}</td>
                <td className={`py-2.5 align-top ${index < 2 ? "font-bold text-mint-text" : "text-ink-soft"}`}>{row.who}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Container>

      <Container as="section" className="mt-24 grid gap-12 md:grid-cols-2">
        <SectionTeaser
          section="tools"
          title="Free Twilio tools"
          text="Calculators and helpers for working with Twilio. They run in your browser, with no sign-up."
          linkLabel="Browse all tools"
        />
        <SectionTeaser
          section="guides"
          title="Twilio, in plain English"
          text="Guides to accounts, numbers, texting rules and what things cost."
          linkLabel="Read the guides"
        />
      </Container>

      <Container as="section" className="mt-24">
        <div className="grid items-center gap-8 rounded-xl bg-sunken px-6 py-10 sm:px-12 sm:py-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
          <div>
            <p className="font-semibold text-mint-text">Open source, MIT licensed</p>
            <h2 className="display-2 mt-2 max-w-[18ch]">Don&apos;t trust us with your keys. Read the code.</h2>
            <p className="lede mt-4 text-ink-soft">
              Every line of Dialbubble is on GitHub. See exactly where your credentials go (the iPhone Keychain, then straight to Twilio), build it yourself, or send a pull request.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <GithubButton label="Star on GitHub" />
              <Link href="/security" className="btn btn-ghost">
                How security works
              </Link>
            </div>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-[#04100e] p-5 font-mono text-[0.875rem] leading-relaxed text-[#cfeee8] shadow-[inset_0_0_0_1px_rgb(154_247_232/0.15)]">
            <code>{`git clone https://github.com/GagnDeep/dialbubble
cd dialbubble
brew install xcodegen
xcodegen generate
open Dialbubble.xcodeproj`}</code>
          </pre>
        </div>
      </Container>

      <Container as="section" className="mt-24 grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
        <div>
          <h2 className="display-2">Common questions</h2>
          <p className="mt-4 text-ink-soft">
            More answers on the{" "}
            <Link href="/support" className="link">
              support page
            </Link>
            .
          </p>
        </div>
        <Faq items={coreFaq} />
      </Container>

      <CtaBand />
    </>
  );
}

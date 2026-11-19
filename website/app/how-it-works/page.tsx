import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Callout } from "@/components/Callout";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { DirectDiagram } from "@/components/DirectDiagram";
import { PageHero } from "@/components/PageHero";
import { PhoneFrame } from "@/components/PhoneFrame";
import { RelatedLinks } from "@/components/RelatedLinks";
import { Steps } from "@/components/Steps";
import { TalkDemo } from "@/components/TalkDemo";
import { honestLimits } from "@/content/features";
import { getEntry, metaFor } from "@/lib/registry";
import { howToLd, JsonLd } from "@/lib/seo";

export const metadata = metaFor("/how-it-works");

const setup = [
  { name: "Find your keys", text: "Open the Twilio Console and copy your Account SID and Auth Token. You can create an API Key instead. The app shows you exactly where to look, and Smart Paste fills the right fields from your clipboard." },
  { name: "Connect", text: "Dialbubble checks your credentials with Twilio and loads your account. If something fails, it tells you why and how to fix it." },
  { name: "Your numbers", text: "Choose which of your Twilio numbers to use, and pick defaults for calling and texting. If you don't have a number yet, the app links you to where you can buy or verify one." },
  { name: "Your phone", text: "Enter your own phone number. This is the phone Twilio rings for two-way Talk calls." },
  { name: "Try it now", text: "Dialbubble sets up your first text or call, so you can see it work straight away." },
];

const modes = [
  { title: "Talk", text: "Two-way. Twilio rings your phone, you press any key, and Twilio dials the other person and joins you. Bills two legs." },
  { title: "Voice Message", text: "Twilio calls the other person and reads your text aloud with text-to-speech. Bills one leg." },
  { title: "Play Audio", text: "Twilio calls the other person and plays an MP3 or WAV from a public link. Bills one leg." },
  { title: "Custom TwiML", text: "Twilio calls the other person and runs the TwiML you wrote. Whatever it does is billed as usual." },
];

export default function HowItWorksPage() {
  const entry = getEntry("/how-it-works")!;
  return (
    <>
      <JsonLd
        data={howToLd({
          name: "How to set up Dialbubble with your Twilio account",
          description: entry.description,
          path: entry.path,
          steps: setup,
        })}
      />
      <Breadcrumbs path="/how-it-works" />
      <PageHero
        title="How Dialbubble works"
        lede="Dialbubble is a remote control for your Twilio account. You tap, the app asks Twilio to do it, and Twilio places the call or sends the text."
      />

      <Container as="section" className="mt-6">
        <DirectDiagram />
      </Container>

      <Container as="section" className="mt-20 grid items-start gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16">
        <div>
          <h2 className="display-2">Setting up</h2>
          <p className="lede mt-3 text-ink-soft">
            The app asks if you already have a Twilio account and helps you sign up if you don&apos;t. Then it walks you through this, one screen at a time. If you leave partway, it picks up where you stopped.
          </p>
          <Steps className="mt-8" items={setup.map((step) => ({ title: step.name, text: step.text }))} />
          <p className="mt-8 text-ink-soft">
            To schedule texts, add a Messaging Service SID later under Settings, Account. Want to look around first? Tap Explore Demo on the welcome screen and skip all of this.
          </p>
        </div>
        <div className="flex justify-center md:sticky md:top-24">
          <PhoneFrame screen="onboarding" sizes="280px" className="w-[220px] sm:w-[260px] lg:w-[280px]" />
        </div>
      </Container>

      <section className="mt-20 bg-sunken py-16 sm:py-20">
        <Container className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 id="talk" className="display-2 scroll-mt-24">
              How a two-way call works
            </h2>
            <p className="lede mt-3 text-ink-soft">Dialbubble has no VoIP, because in-app calling needs a server. Instead, Twilio connects you on your regular phone.</p>
            <Steps
              className="mt-8"
              items={[
                { title: "Twilio rings you", text: "You start the call in Dialbubble. Twilio calls the phone number you entered during setup." },
                { title: "You press any key", text: "A voice names the last digits of the number you're calling and asks you to press a key. If no key is pressed, the call is cancelled and the other person is never dialed." },
                { title: "Twilio dials them", text: "The other person's phone rings, showing your Twilio number." },
                { title: "You talk", text: "You're on a normal call on your phone. Dialbubble shows the status and can hang up." },
              ]}
            />
            <div className="mt-8">
              <Callout type="cost" title="Two legs, two charges">
                <p>Twilio bills the call to you and the call to them separately, at its normal rates. If you record the call, Twilio charges for that as well.</p>
              </Callout>
            </div>
          </div>
          <TalkDemo />
        </Container>
      </section>

      <Container as="section" className="mt-20">
        <h2 className="display-2">Other kinds of call</h2>
        <p className="lede mt-3 text-ink-soft">
          Only Talk rings you. The others call the other person directly and don&apos;t need you on the line. All of them can use your Twilio number as the caller ID.
        </p>
        <dl className="mt-8 grid gap-x-12 gap-y-6 md:grid-cols-2">
          {modes.map((mode) => (
            <div key={mode.title} className="border-t border-line pt-4">
              <dt className="display-3">{mode.title}</dt>
              <dd className="mt-1.5 text-ink-soft">{mode.text}</dd>
            </div>
          ))}
        </dl>
      </Container>

      <Container as="section" className="mt-20 grid items-start gap-10 md:grid-cols-[auto_minmax(0,1fr)] md:gap-16">
        <div className="order-2 flex justify-center md:order-1">
          <PhoneFrame screen="conversation" sizes="280px" className="w-[220px] sm:w-[260px] lg:w-[280px]" />
        </div>
        <div className="order-1 md:order-2">
          <h2 className="display-2">How texting works</h2>
          <p className="lede mt-3 text-ink-soft">Messages go out from your Twilio number through Twilio. The app reads your message history back from Twilio and arranges it into conversations.</p>
          <ul className="mt-6 list-disc space-y-2 pl-5">
            <li>While the app is open, it checks for new messages and calls every 20 seconds, and every 5 seconds inside an open conversation.</li>
            <li>While it&apos;s closed, it can check now and then through Background App Refresh and show an alert, if you turn that on. iOS decides when those checks run, so alerts can be late.</li>
            <li>To send a picture, you give Dialbubble a public https link and Twilio fetches the media from there. The app has no server to upload to.</li>
            <li>Scheduled texts are held by Twilio, so they go out even when your phone is off. They need a Twilio Messaging Service.</li>
            <li>US texting has its own registration rules (A2P 10DLC) at Twilio, and the in-app help explains them.</li>
          </ul>
        </div>
      </Container>

      <Container as="section" className="mt-20">
        <h2 id="limits" className="display-2 scroll-mt-24">
          The limits, plainly
        </h2>
        <dl className="mt-8 grid gap-x-12 gap-y-6 md:grid-cols-2">
          {honestLimits.map((limit) => (
            <div key={limit.name} className="border-t border-line pt-4">
              <dt className="display-3">{limit.name}</dt>
              <dd className="mt-1.5 text-ink-soft">{limit.text}</dd>
            </div>
          ))}
          <div className="border-t border-line pt-4">
            <dt className="display-3">Incoming calls stay with Twilio</dt>
            <dd className="mt-1.5 text-ink-soft">Calls to your Twilio number follow whatever you set up in the Twilio Console. Dialbubble doesn&apos;t answer them.</dd>
          </div>
          <div className="border-t border-line pt-4">
            <dt className="display-3">Twilio trial accounts have limits</dt>
            <dd className="mt-1.5 text-ink-soft">Trial accounts can only reach verified numbers. Twilio also blocks two-way Talk calls, recording and custom text on them, so Voice Message is the call type that works. Those rules come from Twilio, and upgrading removes them.</dd>
          </div>
        </dl>
        <p className="mt-8">
          Something not working? The{" "}
          <Link href="/support" className="link">
            support page
          </Link>{" "}
          covers the usual causes.
        </p>
      </Container>

      <RelatedLinks path="/how-it-works" />
      <CtaBand />
    </>
  );
}

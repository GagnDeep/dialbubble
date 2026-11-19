import Link from "next/link";
import { Ext, FaqSection, PageData, Sources } from "@/app/compare/_shared/parts";
import { CHECKED, rate, TALK_PER_MIN, TWILIO, URLS } from "@/app/compare/_shared/rates";
import { Callout } from "@/components/Callout";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { DownloadButton } from "@/components/DownloadButton";
import { PhoneFrame } from "@/components/PhoneFrame";
import { RelatedLinks } from "@/components/RelatedLinks";
import { metaFor } from "@/lib/registry";

const path = "/twilio-dialer-app";
export const metadata = metaFor(path, { type: "article" });

const modes = [
  {
    name: "Talk",
    use: "A real conversation from your business number.",
    how: "Twilio rings your phone, you press any key, and only then is the other person dialed.",
    rings: "You, then them",
    bills: `Two legs, about ${rate(TALK_PER_MIN)} a minute in the US`,
  },
  {
    name: "Voice Message",
    use: "A reminder or update that should arrive as a call.",
    how: "You type the message. Twilio calls them and reads it aloud with text-to-speech, and can repeat it.",
    rings: "Only them",
    bills: `One leg, about ${rate(TWILIO.callOut)} a minute in the US`,
  },
  {
    name: "Play Audio",
    use: "A recorded announcement in a real voice.",
    how: "Twilio calls them and plays an MP3 or WAV from a public link.",
    rings: "Only them",
    bills: `One leg, about ${rate(TWILIO.callOut)} a minute in the US`,
  },
  {
    name: "Custom TwiML",
    use: "Anything else Twilio's call language can do, with no webhook server.",
    how: "Twilio calls them and runs the TwiML you wrote in the app.",
    rings: "Only them, unless your TwiML dials more",
    bills: "One leg, plus whatever your TwiML adds",
  },
];

const faq = [
  {
    q: "What number does the other person see?",
    a: "The Twilio number you pick for that call, or a verified caller ID from your account. They don't see your personal number.",
  },
  {
    q: "Is Dialbubble an auto dialer or power dialer?",
    a: "No. It places one call at a time when you tap, with no dial lists, no CRM link and no browser extension. For a sales calling queue, look at a dedicated sales dialer.",
  },
  {
    q: "Can I hang up from the app?",
    a: "Yes. During a call, the app shows its status and can end it. If you don't press a key on a Talk call, it's cancelled and the other person is never dialed.",
  },
  {
    q: "Can I record calls?",
    a: "Yes. Turn on recording for a call, then play it back or share it from the app. Twilio charges for recording and storage, and consent rules depend on where you and the other person are.",
  },
  {
    q: "Can I start a call by voice?",
    a: "Yes. Siri and Shortcuts can call with a voice message or open the dialer.",
  },
];

export default function Page() {
  return (
    <>
      <PageData path={path} />
      <Container as="section" className="grid items-start gap-10 pb-8 pt-10 sm:pt-16 md:grid-cols-[auto_minmax(0,1fr)] md:gap-16">
        <PhoneFrame screen="keypad" priority sizes="(max-width: 768px) 220px, 280px" className="order-2 mx-auto w-[220px] md:order-1 lg:w-[280px]" />
        <div className="order-1 md:order-2">
          <h1 className="display-1 max-w-[14ch]">A Twilio dialer app for iPhone</h1>
          <p className="lede mt-5 text-ink-soft">
            A Twilio dialer lets you place calls from your Twilio number without writing code. Dialbubble does this on iPhone in four ways, from a live two-way call to a call that just delivers a message. <Link href="/twilio-softphone-app" className="link">It isn&apos;t a VoIP softphone</Link>, so a live call uses your regular phone line.
          </p>
          <div className="mt-7"><DownloadButton /></div>
        </div>
      </Container>

      <Container as="section" className="mt-12">
        <h2 className="display-2">Which call mode should you use?</h2>
        <div className="mt-8 border-t-4 border-ink">
          {modes.map((mode) => (
            <article key={mode.name} className="grid gap-x-8 gap-y-3 border-b border-line py-7 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
              <div>
                <h3 className="font-display text-[1.75rem] font-bold leading-tight">{mode.name}</h3>
                <p className="mt-1 font-semibold">{mode.use}</p>
                <p className="mt-1 text-ink-soft">{mode.how}</p>
              </div>
              <dl className="grid grid-cols-2 gap-4 self-center">
                <div><dt className="text-[0.9375rem] text-ink-soft">Who gets rung</dt><dd className="font-semibold">{mode.rings}</dd></div>
                <div><dt className="text-[0.9375rem] text-ink-soft">What Twilio bills</dt><dd className="font-semibold">{mode.bills}</dd></div>
              </dl>
            </article>
          ))}
        </div>
        <p className="mt-4 text-[0.9375rem] text-ink-soft">
          Local rates from <Ext href={URLS.twilioVoice}>Twilio&apos;s US voice pricing</Ext>, {CHECKED}. International rates vary by country, so <Link href="/tools/twilio-pricing-calculator" className="link">use the calculator</Link>.
        </p>
      </Container>

      <section className="mt-20 bg-sunken py-16">
        <Container className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16">
          <div>
            <h2 className="display-2">How do you send a voice message call?</h2>
            <p className="lede mt-3 text-ink-soft">Good for appointment reminders, a delayed delivery or a note to someone who doesn&apos;t read texts.</p>
            <p className="mt-4">Type what it should say, choose a voice and how many times to repeat it, and pick the number to call from. You aren&apos;t on the line. Afterward, the call appears in Recents with its status and duration.</p>
            <p className="mt-4">If you want more control, such as a menu or a redirect, write it as TwiML. Our <Link href="/guides/twiml-examples" className="link">TwiML examples</Link> and <Link href="/tools/twiml-builder" className="link">TwiML builder</Link> help you get started.</p>
          </div>
          <PhoneFrame screen="voice-message" sizes="260px" className="mx-auto w-[220px] lg:w-[260px]" />
        </Container>
      </section>

      <Container as="section" className="mt-20 grid items-start gap-10 md:grid-cols-[auto_minmax(0,1fr)] md:gap-16">
        <div className="order-2 mx-auto flex gap-4 md:order-1">
          <PhoneFrame screen="recents" sizes="210px" className="w-[140px] sm:w-[190px] lg:w-[210px]" />
          <PhoneFrame screen="call-detail" sizes="210px" className="w-[140px] sm:w-[190px] lg:w-[210px]" />
        </div>
        <div className="order-1 md:order-2">
          <h2 className="display-2">Caller ID and call history</h2>
          <p className="mt-4">Each call can use a different outgoing number: any Twilio number you own, or a <Link href="/guides/how-to-add-a-verified-caller-id-in-twilio" className="link">verified caller ID</Link> you&apos;ve added. New to this? Read <Link href="/guides/what-is-outbound-caller-id" className="link">what outbound caller ID is</Link> and <Link href="/guides/how-to-make-calls-from-a-different-number" className="link">how to call from a different number</Link>.</p>
          <p className="mt-4">Recents shows your account&apos;s calls with filters, and each call has a detail page with its status and any recording. <Link href="/guides/twilio-call-recording-guide" className="link">Here&apos;s how recording works</Link>.</p>
          <div className="mt-6">
            <Callout type="warning" title="Where this dialer stops">
              <p>It places calls and doesn&apos;t answer them. It has no calling queue for working through a list, and live calls need your phone to be able to receive a normal call. If you need any of those, a <Link href="/business-phone-app-iphone" className="link">business phone app</Link> will likely suit you better.</p>
            </Callout>
          </div>
        </div>
      </Container>

      <FaqSection title="Twilio dialer questions" items={faq} />
      <Sources items={[{ name: "Twilio: US voice pricing", href: URLS.twilioVoice }]} />
      <RelatedLinks path={path} />
      <CtaBand title="Try all four call modes" text="In Demo Mode, you can walk through each mode on simulated data. Nothing is dialed and nothing is charged." />
    </>
  );
}

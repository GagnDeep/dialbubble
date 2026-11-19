import Link from "next/link";
import { Ext, FaqSection, PageData, Sources } from "@/app/compare/_shared/parts";
import { CHECKED, rate, TWILIO, URLS, usd } from "@/app/compare/_shared/rates";
import { Callout } from "@/components/Callout";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { PageHero } from "@/components/PageHero";
import { PhoneFrame, type Screen } from "@/components/PhoneFrame";
import { RelatedLinks } from "@/components/RelatedLinks";
import { metaFor } from "@/lib/registry";

const path = "/twilio-sms-app";
export const metadata = metaFor(path, { type: "article" });

const workflows: { id: string; heading: string; screen?: Screen; body: React.ReactNode; bullets: React.ReactNode[] }[] = [
  {
    id: "reply",
    heading: "Answering a customer from your phone",
    screen: "conversation",
    body: "Threads are grouped by your Twilio number and the other person, so you can see which of your numbers each conversation belongs to. Each message shows its delivery status, and the app shows how many segments a message will use before you send it.",
    bullets: [
      <>Long messages and emoji can use more segments. Test yours with the <Link href="/tools/sms-segment-calculator" className="link">SMS segment calculator</Link>.</>,
      "Pictures you receive open in the thread. To send one, paste a public https link, because the app has no server to upload to.",
      "Save your common replies as templates and drop them in with a tap.",
    ],
  },
  {
    id: "inbox",
    heading: "Working through several numbers",
    screen: "messages",
    body: "If you run more than one number or Twilio account, the inbox keeps them apart with nicknames and colors. Global search finds anything across messages, calls and numbers.",
    bullets: ["Set a default sending number for each account.", "Switch between Twilio accounts from Home.", "This is an inbox for one person. There's no shared team inbox, assignment or notes."],
  },
];

const faq = [
  {
    q: "Will I get a notification when a text comes in?",
    a: "Not instantly. Dialbubble has no server, so there are no push notifications. It checks every 20 seconds while it's open, and you can turn on an icon badge and best-effort alerts while it's closed, which iOS runs through Background App Refresh. If you need instant alerts, this is the wrong app for you.",
  },
  {
    q: "Do I need A2P 10DLC registration to use it?",
    a: "If you text US numbers from a regular local number, yes. That's a US carrier and Twilio rule, not something the app adds. Without it, messages can be blocked.",
  },
  {
    q: "Why was my message not delivered?",
    a: "The app shows Twilio's error in plain English. A common one is 30007, where carriers filter the message. Our guides explain how to fix it, along with 21610, which means the person opted out.",
  },
  {
    q: "Can I schedule texts without a server?",
    a: "Yes. Twilio holds scheduled messages, so they go out even if your phone is off. It requires a Twilio Messaging Service, whose SID you add in Settings.",
  },
  {
    q: "Can I send a broadcast to a list?",
    a: "Yes, with throttled sending, progress and a result for each person. Only message people who've agreed to hear from you. Marketing rules apply, and you're responsible for following them.",
  },
];

export default function Page() {
  return (
    <>
      <PageData path={path} />
      <PageHero
        title="A Twilio SMS app for your iPhone"
        lede="To read and answer Twilio texts on a phone, you need a third-party app, since Twilio doesn't publish a general one. Dialbubble is a free option: a threaded inbox with templates, scheduling and broadcast. Its big limit is no push notifications, so it fits best if you check in on your messages, not if you must see each one right away."
      />

      <Container as="section" className="mt-4 space-y-20">
        {workflows.map((flow, index) => (
          <article key={flow.id} className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <div className={index % 2 ? "md:order-2" : ""}>
              <h2 className="display-2">{flow.heading}</h2>
              <p className="mt-4">{flow.body}</p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-soft">
                {flow.bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}
              </ul>
            </div>
            {flow.screen ? <PhoneFrame screen={flow.screen} sizes="280px" className={`mx-auto w-[220px] lg:w-[280px] ${index % 2 ? "md:order-1" : ""}`} /> : null}
          </article>
        ))}
      </Container>

      <section className="mt-20 bg-sunken py-16">
        <Container>
          <h2 className="display-2 max-w-[20ch]">Sending to many people, or later</h2>
          <div className="mt-8 grid gap-10 md:grid-cols-2">
            <div className="border-t-4 border-ink pt-4">
              <h3 className="font-display text-2xl font-semibold">Scheduled texts</h3>
              <p className="mt-2">Choose a time and Twilio sends it, even with your phone off. You can cancel it later. It needs a Twilio Messaging Service. Here&apos;s <Link href="/guides/how-to-schedule-sms-with-twilio" className="link">how to schedule SMS with Twilio</Link>.</p>
            </div>
            <div className="border-t-4 border-ink pt-4">
              <h3 className="font-display text-2xl font-semibold">Broadcast</h3>
              <p className="mt-2">Send one message to many people, with throttled sending and a result for each. Twilio bills every segment to every recipient, so check the cost first. For regular campaigns with opt-out handling and reporting, a dedicated SMS marketing tool is the better choice.</p>
            </div>
          </div>
        </Container>
      </section>

      <Container as="section" className="mt-20 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="display-2">What does Twilio SMS cost?</h2>
          <p className="mt-4">
            In the US, {CHECKED}, <Ext href={URLS.twilioSms}>Twilio lists</Ext> {rate(TWILIO.sms)} per SMS segment each way, plus carrier fees of roughly {rate(TWILIO.carrierLow)} to {rate(TWILIO.carrierHigh)} a segment. Picture messages sent are {rate(TWILIO.mmsOut)} plus carrier fees. A local number is {usd(TWILIO.localNumber)} a month.
          </p>
          <p className="mt-4">
            Sending from a US local number also means A2P 10DLC fees. For a Sole Proprietor, <Ext href={URLS.twilioA2p}>Twilio lists</Ext> $4.50 for the brand, $15 for campaign vetting and $2 a month for the campaign. Other business types pay differently, so try the <Link href="/tools/a2p-10dlc-cost-calculator" className="link">A2P 10DLC cost calculator</Link> or follow our <Link href="/guides/a2p-10dlc-registration-guide" className="link">registration guide</Link>.
          </p>
          <p className="mt-4">Dialbubble itself is free and adds nothing to these prices.</p>
        </div>
        <div className="self-start">
          <Callout type="warning" title="When this isn't the right SMS app">
            <p>Look elsewhere if you need any of these:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Instant alerts for each incoming text</li>
              <li>A team working from the same inbox. <Link href="/compare/dialbubble-vs-quo" className="link">Quo is built for that</Link></li>
              <li>Automated replies or opt-out handling built around your workflows</li>
              <li>Android</li>
            </ul>
          </Callout>
          <p className="mt-6">Texts not arriving? Start with <Link href="/guides/fix-twilio-error-30007" className="link">fixing error 30007</Link> or <Link href="/guides/fix-twilio-error-21610" className="link">error 21610</Link>, or read <Link href="/guides/how-does-twilio-sms-work" className="link">how Twilio SMS works</Link>.</p>
        </div>
      </Container>

      <FaqSection title="Twilio SMS app questions" items={faq} />
      <Sources items={[{ name: "Twilio: US SMS pricing", href: URLS.twilioSms }, { name: "Twilio: A2P 10DLC pricing and fees", href: URLS.twilioA2p }, { name: "Twilio: mobile application availability", href: URLS.twilioNoApp }]} />
      <RelatedLinks path={path} />
      <CtaBand title="Try the inbox before you connect a number" text="Demo Mode has sample conversations, templates and a broadcast to try. Nothing is sent, and you don't need a Twilio account." />
    </>
  );
}

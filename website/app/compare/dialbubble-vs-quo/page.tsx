import Link from "next/link";
import { CompareShell, CostScenarios, Ext, Verdict } from "@/app/compare/_shared/parts";
import { CHECKED, URLS } from "@/app/compare/_shared/rates";
import { ComparisonTable } from "@/components/ComparisonTable";
import { Container } from "@/components/Container";
import { metaFor } from "@/lib/registry";

const path = "/compare/dialbubble-vs-quo";
export const metadata = metaFor(path, { type: "article" });

export default function Page() {
  return (
    <CompareShell
      path={path}
      title="Dialbubble vs Quo (formerly OpenPhone)"
      lede="Quo is a complete business phone service, and it's the better choice for most teams: it has a shared inbox, Android and real in-app calling. Dialbubble is a narrower tool for one person who wants to use their own Twilio account from an iPhone, with no monthly plan."
      ctaTitle="Solo, on Twilio and on iPhone?"
      ctaText="Then Dialbubble may be all you need. See how calls and texts feel in Demo Mode, with no Twilio account needed."
      sources={[
        { name: "Quo: pricing", href: URLS.quoPricing },
        { name: "Quo: product overview", href: URLS.quoHome },
        { name: "Twilio: US voice pricing", href: URLS.twilioVoice },
        { name: "Twilio: US SMS pricing", href: URLS.twilioSms },
        { name: "Twilio: A2P 10DLC fees", href: URLS.twilioA2p },
      ]}
      faq={[
        { q: "Is Quo the same as OpenPhone?", a: "Yes. OpenPhone now goes by Quo. Its site reads \"Quo (formerly OpenPhone)\", and the company's legal name is still OpenPhone Technologies, Inc." },
        { q: "Is there a free trial of Quo?", a: "Quo describes a 7-day free trial. Texting isn't included, because your number has to be registered first, and neither are international calls and texts." },
        { q: "Can Dialbubble do what Quo's shared inbox does?", a: "No. Dialbubble is built for one person on one iPhone, with no shared workspace, assignments or team notes. A team should use Quo or something like it." },
        { q: "Can I use my Twilio number with Quo?", a: "They're separate services. You'd have to port the number to Quo, which then becomes your provider. Quo says it supports switching from another provider and offers guidance on the transfer." },
        { q: "Which is cheaper for one person?", a: "It depends on minutes. Light users pay less on Twilio with Dialbubble. Once you pass roughly 400 to 500 Talk minutes a month, Quo's flat plan usually costs less." },
      ]}
    >
      <Verdict
        other="Quo"
        otherPoints={[
          "More than one person answers the phone or the texts.",
          "You need Android, a desktop app or in-app calling over Wi-Fi.",
          "Incoming calls and texts must reach you immediately.",
          "You make more than a few hundred call minutes a month.",
          "You want AI call summaries or an AI agent to answer calls.",
        ]}
        dialbubblePoints={[
          "You already have a Twilio account, or want pay-per-use with no plan.",
          "You make few calls, and work on iPhone alone.",
          <>You want Twilio features such as <Link href="/twilio-dialer-app" className="link">spoken message calls, audio and custom TwiML</Link>.</>,
          "You run several Twilio accounts or numbers and don't want per-number fees from an app.",
          "You want your calls and messages kept only in your own Twilio account.",
        ]}
      />

      <Container as="section" className="mt-20">
        <h2 className="display-2">Quo and Dialbubble, feature by feature</h2>
        <div className="mt-6">
          <ComparisonTable
            caption="Dialbubble compared with Quo, as of November 2026"
            columns={["Dialbubble", "Quo"]}
            highlight={0}
            rows={[
              { label: "Price", values: ["Free app; you pay Twilio per use", "$15, $23 or $35 per user a month billed annually; $19, $33 or $47 monthly"] },
              { label: "Numbers", values: ["Any you own at Twilio, from $1.15 a month for US local", "1 per user included; extra numbers $5 a month"] },
              { label: "US and Canada usage", values: ["Pay per minute and per segment", "Unlimited, under a fair usage policy"] },
              { label: "Other countries", values: ["Twilio's rates", "Add-on credits, by destination"] },
              { label: "Call audio", values: ["Your regular phone line, bridged by Twilio", "VoIP in the app"] },
              { label: "Answer incoming calls in the app", values: [false, true] },
              { label: "Shared number and team inbox", values: [false, "Yes; Starter is limited to 10 paid users"] },
              { label: "Platforms", values: ["iPhone only (iOS 26+)", "iOS, Android, Mac, Windows, web"] },
              { label: "Notifications for new texts", values: ["No instant push; checks every 20 seconds while open, optional background alerts", "Not stated on the pricing page; check Quo's app"] },
              { label: "AI features", values: [false, "Sona AI agent on all plans; AI call summaries on Business and Scale"] },
              { label: "Voice message, play audio, custom TwiML", values: [true, "Not listed on the pages we checked"] },
              { label: "US texting registration", values: ["Twilio's A2P 10DLC fees", "$19.50 once, then $1.50 to $3 a month"] },
              { label: "Where your data lives", values: ["Your Twilio account and your iPhone", "Your Quo workspace"] },
            ]}
          />
        </div>
        <p className="mt-3 text-[0.9375rem] text-ink-soft">
          From <Ext href={URLS.quoPricing}>Quo&apos;s pricing page</Ext>, {CHECKED}. Plans are Starter, Business and Scale.
        </p>
      </Container>

      <section className="mt-20 bg-sunken py-16">
        <Container>
          <h2 className="display-2 max-w-[22ch]">How much would each cost one person?</h2>
          <p className="lede mt-3 text-ink-soft">Quo&apos;s price stays flat, while Twilio&apos;s grows with use. A Talk call bills two legs, which is why the gap widens quickly for frequent callers.</p>
          <div className="mt-6">
            <CostScenarios other="Quo" otherLabel="Quo Starter, annual billing" otherPrice="$15, plus $1.50 to $3 messaging fee" />
          </div>
        </Container>
      </section>

      <Container as="section" className="mt-20 grid gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <h2 className="display-2">Why choose a Quo alternative at all?</h2>
          <p className="mt-4">Mostly because of how you pay and who holds the account. With Dialbubble there&apos;s no plan to outgrow, and your numbers stay at Twilio, where you can also use them with code later. The trade-off is real: <Link href="/twilio-softphone-app" className="link">no in-app calling</Link> and no alerts when the app is closed.</p>
          <p className="mt-4">If you&apos;re deciding between phone services and not committed to Twilio, compare <Link href="/compare/dialbubble-vs-dialpad" className="link">Dialpad</Link> and <Link href="/compare/dialbubble-vs-grasshopper" className="link">Grasshopper</Link> too, or start from our <Link href="/business-phone-app-iphone" className="link">roundup of business phone apps for iPhone</Link>.</p>
        </div>
        <div>
          <h2 className="display-2">What both have to do for US texting</h2>
          <p className="mt-4">Neither app gets you out of registration. US carriers require it for business texting from a local number, so you&apos;ll register with Quo or, on Twilio, through <Link href="/guides/a2p-10dlc-registration-guide" className="link">A2P 10DLC registration</Link>. Quo says its fee is $19.50 once. For a Sole Proprietor, Twilio&apos;s one-time fees also add up to $19.50.</p>
        </div>
      </Container>
    </CompareShell>
  );
}

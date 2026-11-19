import Link from "next/link";
import { CompareShell, Ext, Verdict } from "@/app/compare/_shared/parts";
import { URLS } from "@/app/compare/_shared/rates";
import { ComparisonTable } from "@/components/ComparisonTable";
import { Container } from "@/components/Container";
import { PhoneFrame } from "@/components/PhoneFrame";
import { metaFor } from "@/lib/registry";

const path = "/compare/dialbubble-vs-twilio-console";
export const metadata = metaFor(path, { type: "article" });

export default function Page() {
  return (
    <CompareShell
      path={path}
      title="Dialbubble vs the Twilio Console"
      lede="They aren't really rivals: Dialbubble needs a Twilio account, and you'll still use the Console to buy numbers, register for texting and change settings. The Console is the official, complete control panel. Dialbubble covers the everyday calling, texting and checking you'd do from your phone."
      ctaTitle="Keep the Console for setup. Use your phone for the rest."
      ctaText="See what everyday Twilio looks like on iPhone, in Demo Mode, with no credentials needed."
      sources={[
        { name: "Twilio: products", href: URLS.twilioProducts },
        { name: "Twilio: billing docs", href: URLS.twilioBilling },
        { name: "Twilio: user roles", href: URLS.twilioRoles },
        { name: "Twilio: mobile application availability", href: URLS.twilioNoApp },
      ]}
      faq={[
        { q: "Can Dialbubble replace the Twilio Console?", a: "No. You still need the Console to create your account, add funds, buy numbers, set where incoming calls go and register for A2P 10DLC." },
        { q: "Does it cost anything to use the Console?", a: "No. The Console comes with your Twilio account. You pay for what you use, the same as when you use Dialbubble." },
        { q: "Is Dialbubble a Twilio product?", a: "No. Dialbubble is independent and uses Twilio's public API. Twilio doesn't make, endorse or support it, so for help with your account, go to Twilio." },
        { q: "Does using Dialbubble change what Twilio charges?", a: "No. There's no markup. Calls and texts made in Dialbubble appear in your Console logs and on your Twilio bill as usual." },
      ]}
    >
      <Verdict
        other="the Twilio Console"
        dialbubbleHeading="Reach for Dialbubble if"
        otherPoints={[
          "You're buying, porting or configuring phone numbers.",
          "You're registering for A2P 10DLC or a regulatory bundle.",
          "You need to add funds, or see invoices and payment methods.",
          "You're managing teammates and their roles.",
          "You use products Dialbubble doesn't touch, such as Studio, Verify or Flex.",
        ]}
        dialbubblePoints={[
          <>You want to <Link href="/twilio-dialer-app" className="link">place a call</Link> without opening a laptop.</>,
          <>You want to <Link href="/twilio-sms-app" className="link">read and answer texts</Link> as conversations.</>,
          <>You want a fast look at your <Link href="/twilio-console-mobile" className="link">balance, usage and logs</Link> on your phone.</>,
          "You want an error explained in plain English.",
          "You switch between several accounts during the day.",
        ]}
      />

      <Container as="section" className="mt-20">
        <h2 className="display-2">Different jobs, side by side</h2>
        <div className="mt-6">
          <ComparisonTable
            caption="The Twilio Console compared with Dialbubble"
            columns={["Twilio Console", "Dialbubble"]}
            highlight={1}
            rows={[
              { label: "Made by", values: ["Twilio", "An independent developer, not Twilio"] },
              { label: "Where it runs", values: ["A web browser", "iPhone, iOS 26 or later"] },
              { label: "Cost", values: ["Included with your account", "Free"] },
              { label: "Sign in", values: ["Your Twilio login", "Your Account SID and Auth Token, or an API Key"] },
              { label: "Team access", values: ["Roles such as Administrator, Developer, Billing Manager, Support", "One person's credentials on one phone"] },
              { label: "Product coverage", values: ["All of Twilio", "Voice, Messaging, Lookup, usage"] },
              { label: "Place a call", values: ["Not its main job", "Four modes, from a keypad"] },
              { label: "Text conversations", values: ["Message logs", "Threaded inbox, templates, broadcast"] },
              { label: "Buy and configure numbers", values: [true, false] },
              { label: "A2P 10DLC and regulatory", values: [true, "Explains it, but you register in the Console"] },
              { label: "Billing", values: ["Full control", "Read-only balance and usage"] },
              { label: "Official support", values: [true, "From us, not Twilio"] },
            ]}
          />
        </div>
      </Container>

      <section className="mt-20 bg-sunken py-16">
        <Container className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16">
          <div>
            <h2 className="display-2">A sensible way to use both</h2>
            <p className="mt-4">Do the setup at a desk: buy a number, set where calls go, register for texting, then create an API Key for your phone. After that, use the app for daily work, and return to the Console for changes. Your Console logs remain the record of everything.</p>
            <p className="mt-4">Not sure about the credentials part? Read <Link href="/guides/twilio-auth-token-vs-api-key" className="link">Auth Token vs API Key</Link>, then see <Link href="/security" className="link">how Dialbubble stores them</Link>. An API Key can be revoked in the Console if you lose your phone.</p>
            <p className="mt-4">Twilio&apos;s <Ext href={URLS.twilioRoles}>role descriptions</Ext> are worth a look before you hand anyone full credentials, as the Console can give them narrower access than an app can. Need a verified number for caller ID? <Link href="/guides/how-to-add-a-verified-caller-id-in-twilio" className="link">Add it in the Console</Link>.</p>
          </div>
          <PhoneFrame screen="call-detail" sizes="260px" className="mx-auto w-[220px] lg:w-[260px]" />
        </Container>
      </section>
    </CompareShell>
  );
}

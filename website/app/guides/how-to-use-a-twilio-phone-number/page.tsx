import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Callout } from "@/components/Callout";
import { CodeBlock } from "@/components/CodeBlock";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { Faq } from "@/components/Faq";
import { PageHero } from "@/components/PageHero";
import { Prose } from "@/components/Prose";
import { RelatedLinks } from "@/components/RelatedLinks";
import { TocSidebar } from "@/components/TocSidebar";
import { getEntry, metaFor } from "@/lib/registry";
import { howToLd, JsonLd } from "@/lib/seo";

const path = "/guides/how-to-use-a-twilio-phone-number";
export const metadata = metaFor(path, { type: "article" });

const VOICE = "https://www.twilio.com/en-us/voice/pricing/us";
const SMS = "https://www.twilio.com/en-us/sms/pricing/us";

const steps = [
  { name: "Upgrade and buy a number", text: "Trial numbers are shared, so upgrade your account first. In the Console, go to Communications, then Numbers & senders, then Phone Numbers, and choose Set up a new phone number. In the legacy Console, it's Phone Numbers, then Manage, then Buy a number." },
  { name: "Set what happens on incoming calls", text: "Open the number's voice configuration and point incoming calls at a TwiML Bin or webhook URL. To forward calls, use TwiML that dials your own phone." },
  { name: "Set what happens on incoming texts", text: "Open the number's messaging configuration and point it at a webhook or TwiML Bin, or simply read replies in the Console's message logs." },
  { name: "Register for US texting if you need it", text: "If you'll text US phones from a local number, complete A2P 10DLC registration and attach the number to a Messaging Service. Toll-free numbers need toll-free verification instead." },
  { name: "Make your first call or text", text: "Send a request to Twilio's API with your number in the From field and the other person's number in the To field, both in E.164 format, or use an app that makes those requests for you." },
];

const toc = [
  { id: "idea", title: "How it differs from a SIM" },
  { id: "setup", title: "Set it up" },
  { id: "incoming", title: "Receive calls and texts" },
  { id: "text", title: "Send a text" },
  { id: "call", title: "Make a call" },
  { id: "example", title: "A worked example" },
  { id: "nocode", title: "Without writing code" },
  { id: "faq", title: "Questions" },
];

const faq = [
  {
    q: "Can I put a Twilio number in my phone like a SIM?",
    a: "No. A Twilio number lives on Twilio's network with no SIM behind it. You reach it through the Console, the API or an app, and incoming calls can be forwarded to any phone you choose.",
  },
  {
    q: "Can I use a Twilio number for WhatsApp or to receive verification codes?",
    a: "Twilio supports WhatsApp senders, with their own setup. Don't count on using a Twilio number for sign-up codes from other services, because many services decide for themselves which number types they'll accept.",
  },
  {
    q: "Why does nothing happen when someone calls my number?",
    a: "Usually no voice URL or TwiML Bin is set, or the URL is failing. Check the number's voice configuration, then look in the call logs. Webhook failures show up there as errors such as 11200.",
  },
  {
    q: "Do I have to write code to use a Twilio number?",
    a: "No. You can forward calls with a TwiML Bin in the Console and pick up messages in the logs. To send texts and place calls without code, you'll want an app that connects to your Twilio account.",
  },
];

export default function Page() {
  const entry = getEntry(path)!;
  return (
    <>
      <JsonLd data={howToLd({ name: entry.title, description: entry.description, path, steps })} />
      <Breadcrumbs path={path} />
      <PageHero
        eyebrow="Guide"
        title={entry.title}
        lede="You use a Twilio number by telling Twilio what to do with it: API requests or an app send texts and place calls, and settings on the number decide where incoming calls and texts go. It has no SIM and doesn't ring anywhere until you set that up."
      />
      <Container>
        <div className="toc-layout">
          <TocSidebar items={toc} />
          <Prose>
            <h2 id="idea">How is a Twilio number different from a normal phone number?</h2>
            <p>
              A SIM number is tied to one phone, so calling and texting just work. A Twilio number is more like a programmable switchboard. Other people can call and text it like any number, but you decide what happens next. That takes a little setup, and in exchange it can forward to any phone, read a message aloud or reply automatically.
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Ways to use a Twilio number">
              <table>
                <thead>
                  <tr>
                    <th scope="col">You want to</th>
                    <th scope="col">How it works</th>
                    <th scope="col">Needs code?</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Get calls on your phone</td><td>Forward with a TwiML Bin</td><td>No, a few lines of XML to paste</td></tr>
                  <tr><td>Read incoming texts</td><td>Console logs, a webhook or an app</td><td>No, unless you use a webhook</td></tr>
                  <tr><td>Send a text</td><td>API request or an app</td><td>A single command, or none with an app</td></tr>
                  <tr><td>Call someone</td><td>Twilio rings you, then dials them</td><td>A single command, or none with an app</td></tr>
                </tbody>
              </table>
            </div>

            <h2 id="setup">How do I set up a Twilio phone number?</h2>
            <ol>
              {steps.map((step) => (
                <li key={step.name}>
                  <strong>{step.name}.</strong> {step.text}
                </li>
              ))}
            </ol>
            <p>
              A US local number is $1.15 a month, as of November 2026 (<a href={VOICE} rel="noopener">Twilio voice pricing</a>). See <Link href="/guides/how-much-does-a-twilio-phone-number-cost">how much a Twilio number costs</Link> for the other types. Numbers outside the US and Canada usually need <Link href="/guides/twilio-regulatory-bundle-guide">an approved regulatory bundle</Link> before you can buy them. Twilio&apos;s <a href="https://www.twilio.com/docs/numbers-and-senders/phone-number-senders" rel="noopener">phone number setup guide</a> has the current Console steps.
            </p>

            <h2 id="incoming">How do I receive calls and texts on a Twilio number?</h2>
            <p>
              When a call or text arrives, Twilio looks up the instructions you set on that number. Those instructions are <Link href="/guides/twiml-examples">TwiML</Link>, a short XML format. You can host it on your own server, or skip the server and use a <a href="https://www.twilio.com/docs/serverless/twiml-bins" rel="noopener">TwiML Bin</a>, which Twilio hosts for you. This one forwards every call to your cell:
            </p>
            <CodeBlock title="TwiML Bin: forward calls" code={'<Response>\n  <Dial>+14155550188</Dial>\n</Response>'} />
            <p>
              Create the Bin, then select it in your number&apos;s voice configuration for incoming calls. Our <Link href="/guides/twilio-call-forwarding">Twilio call forwarding guide</Link> covers caller ID, timeouts and fixes. If you use a webhook on your own server, it has to answer quickly: Twilio allows 10 seconds to connect and 15 seconds in total, and a failure shows up as an error such as <Link href="/twilio-errors/11200">11200</Link>.
            </p>
            <p>
              Texts work the same way with a messaging webhook. If you don&apos;t set one, you can still see incoming messages in the Console&apos;s logs, or read them over the API.
            </p>

            <h2 id="text">How do I send a text from a Twilio number?</h2>
            <p>Make one request, with an API key as the login. These numbers are examples from the fictional 555-01xx range.</p>
            <CodeBlock
              title="Send an SMS with curl"
              code={'curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \\\n  --data-urlencode "To=+14155550199" \\\n  --data-urlencode "From=+14155550142" \\\n  --data-urlencode "Body=Hi Sam, your order is ready." \\\n  -u "$TWILIO_API_KEY:$TWILIO_API_SECRET"'}
            />
            <p>
              Numbers must be in E.164 format, meaning a plus, the country code and the number with no spaces. The <Link href="/tools/e164-phone-number-formatter">E.164 phone number formatter</Link> converts them for you. Find your login values with <Link href="/guides/how-to-find-twilio-account-sid-and-auth-token">our Account SID and Auth Token guide</Link>.
            </p>
            <Callout type="warning" title="US texts need registration first">
              <p>
                Sending to US phones from an unregistered local number fails with <Link href="/twilio-errors/30034">error 30034</Link>. Complete <Link href="/guides/a2p-10dlc-registration-guide">A2P 10DLC registration</Link> first. Twilio requires a Messaging Service for numbers subject to A2P 10DLC.
              </p>
            </Callout>

            <h2 id="call">How do I make a call from a Twilio number?</h2>
            <p>
              You can&apos;t dial out from your phone&apos;s keypad and expect your Twilio number to appear. You ask Twilio to place the call instead. For a two-way conversation, Twilio first rings your own phone, then connects you to the other person:
            </p>
            <CodeBlock
              title="Bridge a call with curl"
              code={'curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Calls.json" \\\n  --data-urlencode "To=+14155550188" \\\n  --data-urlencode "From=+14155550142" \\\n  --data-urlencode "Twiml=<Response><Dial callerId=\\"+14155550142\\">+14155550199</Dial></Response>" \\\n  -u "$TWILIO_API_KEY:$TWILIO_API_SECRET"'}
            />
            <p>
              Here <code>To</code> is your phone, and the number inside <code>Dial</code> is the person you want. They see your Twilio number. Be careful with this simple version: if your voicemail picks up, Twilio treats that as answered and dials them anyway. A safer setup asks you to press a key first. That&apos;s what Dialbubble does, and you can build it with <code>&lt;Gather&gt;</code>.
            </p>
            <p>
              Bridging bills two legs. On a trial account, <code>&lt;Dial&gt;&lt;Number&gt;</code> is blocked, so this needs an upgrade. See <Link href="/guides/is-twilio-free-trial-limits">the Twilio trial limits</Link>.
            </p>

            <h2 id="example">A worked example: a plumber&apos;s business line</h2>
            <p>
              Maya wants a business number without carrying a second phone. She buys a local number, +1 415 555 0142, and adds the forwarding TwiML above so that customers reach her cell. When she calls a customer back, she uses a bridged call so they see the business number.
            </p>
            <p>Here&apos;s what a typical job costs her, at US rates as of November 2026 (<a href={VOICE} rel="noopener">voice</a>, <a href={SMS} rel="noopener">SMS</a>):</p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Cost of one example job">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Event</th>
                    <th scope="col">Sum</th>
                    <th scope="col">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Customer calls, forwarded, 5 minutes</td><td>5 x ($0.0085 + $0.0140)</td><td>$0.1125</td></tr>
                  <tr><td>Maya calls back, bridged, 3 minutes</td><td>2 x 3 x $0.0140</td><td>$0.084</td></tr>
                  <tr><td>Confirmation text to AT&amp;T customer</td><td>$0.0083 + $0.0035</td><td>$0.0118</td></tr>
                  <tr><th scope="row">Total</th><td>&nbsp;</td><td><strong>$0.2083</strong></td></tr>
                </tbody>
              </table>
            </div>
            <p>
              For a full month, including registration, read <Link href="/guides/how-does-twilio-pricing-work">how Twilio pricing works</Link>.
            </p>

            <h2 id="nocode">How do I use a Twilio number without writing code?</h2>
            <p>You have three no-code options, and they each cover part of the job:</p>
            <ul>
              <li><strong>The Twilio Console</strong> handles buying, forwarding with TwiML Bins, and reading logs. It isn&apos;t designed for day-to-day conversations.</li>
              <li><strong>Hosted business-phone services</strong> bundle a number and an app for a monthly fee. That&apos;s simplest if you don&apos;t want a Twilio account at all.</li>
              <li>
                <strong>An app on your own Twilio account.</strong> Dialbubble is a free iPhone app for this. It sends texts and places calls using your number, as explained on <Link href="/how-it-works">how Dialbubble works</Link>. It has no in-app VoIP, so Talk calls ring your regular phone and bill two legs. It doesn&apos;t answer incoming calls, so you still set up forwarding at Twilio. For texts, see <Link href="/guides/how-to-send-sms-from-iphone-with-twilio">how to send SMS from iPhone with Twilio</Link>.
              </li>
            </ul>

            <h2 id="faq">Questions about using a Twilio number</h2>
            <Faq items={faq} />
          </Prose>
        </div>
      </Container>
      <RelatedLinks path={path} />
      <CtaBand
        title="Use your Twilio number without the curl commands"
        text="Dialbubble makes these same requests for you, so you can call and text from your Twilio number on an iPhone. Explore it in Demo Mode first, with no account needed."
      />
    </>
  );
}

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
import { articleLd, JsonLd } from "@/lib/seo";

const path = "/guides/how-does-twilio-sms-work";
export const metadata = metaFor(path, { type: "article" });

const PRICING = "https://www.twilio.com/en-us/sms/pricing/us";

const sendRequest = `curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \\
  --data-urlencode "To=+12025550123" \\
  --data-urlencode "From=+12025550142" \\
  --data-urlencode "Body=Your bike is ready for pickup." \\
  --data-urlencode "StatusCallback=https://example.com/sms-status" \\
  -u "$TWILIO_API_KEY:$TWILIO_API_SECRET"`;

const sendResponse = `{
  "sid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "status": "queued",
  "to": "+12025550123",
  "from": "+12025550142",
  "num_segments": "1",
  "price": null,
  "error_code": null
}`;

const fetchRequest = `curl "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages/SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.json" \\
  -u "$TWILIO_API_KEY:$TWILIO_API_SECRET"`;

const toc = [
  { id: "short-answer", title: "The short version" },
  { id: "example", title: "A real send, start to finish" },
  { id: "journey", title: "Where the text goes" },
  { id: "statuses", title: "What each status means" },
  { id: "replies", title: "How replies reach you" },
  { id: "cost", title: "Is Twilio SMS free?" },
  { id: "rules", title: "Rules your text has to pass" },
  { id: "faq", title: "Questions" },
];

const faq = [
  {
    q: "Is Twilio SMS free?",
    a: "No. The 30-day trial includes 100 SMS, but only predefined template messages to verified numbers. After you upgrade, you pay per segment plus a carrier fee, and a monthly fee for the number.",
  },
  {
    q: "Does 'delivered' mean the person read my text?",
    a: "No. It means Twilio got confirmation of delivery from the carrier and, where available, the handset. SMS has no read receipts. The read status only applies to RCS and WhatsApp.",
  },
  {
    q: "Why does my message stay on 'sent' and never reach 'delivered'?",
    a: "Sent only means the next carrier accepted the text. If that carrier never returns a delivery receipt, Twilio has nothing further to report, so the status can stay on sent.",
  },
  {
    q: "Do I need to write code to use Twilio SMS?",
    a: "Not for simple sending. The Console has a page for sending a test SMS, and apps and iPhone Shortcuts can make the API call for you. Receiving automated replies does need a webhook or a TwiML Bin.",
  },
];

export default function Page() {
  const entry = getEntry(path)!;
  return (
    <>
      <JsonLd data={articleLd({ title: entry.title, description: entry.description, path, published: entry.published! })} />
      <Breadcrumbs path={path} />
      <PageHero
        eyebrow="Guide"
        title={entry.title}
        lede="Twilio SMS works by turning an API request into a text: you send Twilio the number, sender and message, Twilio queues it and hands it to a carrier, and the carrier delivers it to the phone. Along the way the message moves through statuses you can check, and any reply comes back to your Twilio number."
      />
      <Container>
        <div className="toc-layout">
          <TocSidebar items={toc} />
          <Prose>
            <h2 id="short-answer">The short version</h2>
            <p>
              Twilio sits between your software and the phone networks. You don&apos;t connect to AT&amp;T or Verizon yourself. You make one
              HTTPS request to Twilio, and it deals with routing, splitting long messages and collecting delivery receipts.
            </p>
            <p>You need three things before the first real text goes out:</p>
            <ul>
              <li>
                <strong>Credentials.</strong> An Account SID with an Auth Token or API key. Our guide to{" "}
                <Link href="/guides/how-to-find-twilio-account-sid-and-auth-token">finding your Account SID and Auth Token</Link> shows where they are.
              </li>
              <li>
                <strong>A sender.</strong> A Twilio number or a Messaging Service with numbers in it.
              </li>
              <li>
                <strong>Permission to send.</strong> For US traffic that means{" "}
                <Link href="/guides/a2p-10dlc-registration-guide">A2P 10DLC registration</Link> on a local number, or verification on a toll-free one.
              </li>
            </ul>

            <h2 id="example">A real send, start to finish</h2>
            <p>
              Here is a complete request. <code>To</code> and <code>From</code> use <Link href="/guides/e164-phone-number-format">E.164 format</Link>, and the
              numbers are fictional, so swap in your own.
            </p>
            <CodeBlock title="Send one text with curl" code={sendRequest} />
            <p>Twilio answers straight away. The answer doesn&apos;t mean the text arrived, only that Twilio accepted the job:</p>
            <CodeBlock title="Response (shortened)" code={sendResponse} />
            <p>
              Keep the <code>sid</code>. It starts with <code>SM</code> and identifies this message from now on. Notice that <code>price</code> is still empty,
              because Twilio fills it in after sending. A few seconds later, you can ask where the message got to:
            </p>
            <CodeBlock title="Check the message later" code={fetchRequest} />
            <p>
              Or let Twilio tell you. Because the request set <code>StatusCallback</code>, Twilio will post each status change to that URL. It doesn&apos;t post the
              first status, which is why you read <code>queued</code> from the response above.
            </p>

            <h2 id="journey">Where the text goes</h2>
            <ol>
              <li>
                <strong>Twilio checks the request.</strong> Problems it can spot immediately, such as a badly formatted number (
                <Link href="/twilio-errors/21211">error 21211</Link>), come back as an error rather than a message.
              </li>
              <li>
                <strong>Twilio encodes and splits the text.</strong> It picks the most compact encoding and divides long messages into segments. Our guide to{" "}
                <Link href="/guides/gsm-7-vs-ucs-2-sms-encoding">GSM-7 and UCS-2 encoding</Link> shows how that changes the count.
              </li>
              <li>
                <strong>The message waits in a queue.</strong> A US long code sends{" "}
                <a href="https://www.twilio.com/docs/api/errors/30001" rel="noopener">
                  one segment per second
                </a>{" "}
                by default. A text can wait for up to 10 hours. After that it fails with <Link href="/twilio-errors/30001">error 30001</Link>.
              </li>
              <li>
                <strong>Twilio hands it to the next carrier.</strong> When that carrier accepts it, the status becomes <code>sent</code>.
              </li>
              <li>
                <strong>Carriers carry it to the phone, or block it.</strong> The carrier can run spam filters here, which is where{" "}
                <Link href="/guides/fix-twilio-error-30007">error 30007, message filtered</Link> comes from.
              </li>
              <li>
                <strong>A delivery receipt comes back.</strong> The status becomes <code>delivered</code> or <code>undelivered</code>.
              </li>
            </ol>

            <h2 id="statuses">What each status means</h2>
            <p>
              These come from{" "}
              <a href="https://www.twilio.com/docs/messaging/api/message-resource#message-status-values" rel="noopener">
                Twilio&apos;s Message resource docs
              </a>
              , in plain words.
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Twilio message statuses and their meaning">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Status</th>
                    <th scope="col">What it means</th>
                    <th scope="col">What to do</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>accepted</code></td>
                    <td>A Messaging Service took the request and is choosing a sender</td>
                    <td>Wait</td>
                  </tr>
                  <tr>
                    <td><code>scheduled</code></td>
                    <td>A Messaging Service is holding it for a later time</td>
                    <td>Wait, or cancel it</td>
                  </tr>
                  <tr>
                    <td><code>queued</code></td>
                    <td>Waiting to go out from a specific sender</td>
                    <td>Wait</td>
                  </tr>
                  <tr>
                    <td><code>sending</code></td>
                    <td>Being passed to the next carrier</td>
                    <td>Wait</td>
                  </tr>
                  <tr>
                    <td><code>sent</code></td>
                    <td>The next carrier accepted it. Not proof of delivery</td>
                    <td>Watch for a receipt</td>
                  </tr>
                  <tr>
                    <td><code>delivered</code></td>
                    <td>A carrier confirmed delivery</td>
                    <td>Nothing</td>
                  </tr>
                  <tr>
                    <td><code>undelivered</code></td>
                    <td>A receipt said it did not arrive, for example because of filtering</td>
                    <td>Read <code>error_code</code></td>
                  </tr>
                  <tr>
                    <td><code>failed</code></td>
                    <td>It could not be sent at all</td>
                    <td>Read <code>error_code</code></td>
                  </tr>
                  <tr>
                    <td><code>canceled</code></td>
                    <td>A scheduled message was canceled</td>
                    <td>Nothing</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              <code>failed</code> and <code>undelivered</code> also differ on your bill, as the next section on cost explains.
            </p>

            <h2 id="replies">How replies reach you</h2>
            <p>
              A Twilio number has no inbox of its own, so nothing rings or pops up when someone replies. Twilio logs the text as an inbound message with the status{" "}
              <code>received</code>. Then one of these happens:
            </p>
            <ul>
              <li>
                <strong>You set a webhook.</strong> Twilio sends the message to your URL, and{" "}
                <a href="https://www.twilio.com/docs/usage/webhooks/messaging-webhooks" rel="noopener">
                  your server answers with TwiML
                </a>{" "}
                to say what to do next. An empty <code>&lt;Response&gt;</code> receives the text without replying.
              </li>
              <li>
                <strong>You read it later.</strong> The message sits in your logs, where the Console, the API or an app can read it.
              </li>
            </ul>
            <p>
              Some replies never get that far. On long codes, Twilio handles opt-out words such as STOP on its own by default. Once someone opts out, your next text to
              them is blocked with <Link href="/guides/fix-twilio-error-21610">error 21610</Link>.
            </p>

            <h2 id="cost">Is Twilio SMS free?</h2>
            <p>
              No, apart from the trial. The trial includes 100 SMS, but those can only be predefined templates sent to verified numbers, so you can&apos;t type your own
              text until you upgrade. Our page on <Link href="/guides/is-twilio-free-trial-limits">Twilio&apos;s free trial limits</Link> has the details.
            </p>
            <p>
              After that you pay per segment. As of November 2026,{" "}
              <a href={PRICING} rel="noopener">
                Twilio&apos;s US SMS pricing
              </a>{" "}
              is $0.0083 per segment, plus a carrier fee on outbound long-code texts:
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Cost of one outbound SMS segment by US carrier">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Carrier</th>
                    <th scope="col">Carrier fee</th>
                    <th scope="col">One segment</th>
                    <th scope="col">Two segments</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>AT&amp;T</td>
                    <td>$0.0035</td>
                    <td>$0.0118</td>
                    <td>$0.0236</td>
                  </tr>
                  <tr>
                    <td>T-Mobile</td>
                    <td>$0.0045</td>
                    <td>$0.0128</td>
                    <td>$0.0256</td>
                  </tr>
                  <tr>
                    <td>Verizon</td>
                    <td>$0.0050</td>
                    <td>$0.0133</td>
                    <td>$0.0266</td>
                  </tr>
                  <tr>
                    <td>Others</td>
                    <td>$0.0042</td>
                    <td>$0.0125</td>
                    <td>$0.0250</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              A message ending in <code>failed</code> costs $0.001 as of November 2026, under{" "}
              <a href="https://www.twilio.com/en-us/changelog/twilio-will-bill-for-failed-messages-starting-september-30--2024" rel="noopener">
                Twilio&apos;s failed-message fee
              </a>
              , with exemptions for Twilio&apos;s own errors. <code>undelivered</code> is different: there&apos;s no failed fee, but{" "}
              <a href="https://help.twilio.com/articles/223181728" rel="noopener">
                Twilio charges its normal fees
              </a>{" "}
              when delivery was attempted. So a filtered text usually still costs money. To estimate a whole month, try the{" "}
              <Link href="/tools/twilio-pricing-calculator">Twilio pricing calculator</Link>.
            </p>

            <h2 id="rules">Rules your text has to pass</h2>
            <p>The technical path is the easy part. Most new accounts get stuck on one of these:</p>
            <ul>
              <li>
                <strong>Trial limits.</strong> Sending to an unverified number gives <Link href="/twilio-errors/21608">error 21608</Link>.
              </li>
              <li>
                <strong>Registration.</strong> A US local number without an approved campaign gets <Link href="/twilio-errors/30034">error 30034</Link>.
              </li>
              <li>
                <strong>Length.</strong> The body is capped at 1,600 characters (<Link href="/twilio-errors/21617">error 21617</Link>), and{" "}
                <a href="https://www.twilio.com/docs/glossary/what-sms-character-limit" rel="noopener">
                  Twilio suggests staying under 320
                </a>
                . The <Link href="/tools/sms-segment-calculator">SMS segment calculator</Link> shows the count before you send.
              </li>
            </ul>
            <Callout type="tip" title="Delivered isn't always delivered">
              <p>
                Twilio&apos;s{" "}
                <a href="https://help.twilio.com/articles/223181848-How-Does-Carrier-Filtering-Work-" rel="noopener">
                  filtering article
                </a>{" "}
                notes that, in rare cases, carriers report filtered messages as delivered. If someone says they got nothing, test with a different message before you
                blame their phone.
              </p>
            </Callout>

            <h2 id="faq">Questions</h2>
            <Faq items={faq} />
          </Prose>
        </div>
      </Container>
      <RelatedLinks path={path} />
      <CtaBand
        title="See your texts move, without curl"
        text="Dialbubble is a free iPhone app that sends texts through your own Twilio account and explains errors in plain English. Try Demo Mode with no account. Incoming texts don't push: it checks every 20 seconds while open."
      />
    </>
  );
}

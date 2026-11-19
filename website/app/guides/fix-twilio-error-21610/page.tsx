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

const path = "/guides/fix-twilio-error-21610";
export const metadata = metaFor(path, { type: "article" });

const ERROR_DOC = "https://www.twilio.com/docs/api/errors/21610";
const OPT_OUT = "https://support.twilio.com/hc/en-us/articles/223134027-Twilio-Support-for-Opt-Out-Keywords-SMS-STOP-Filtering";
const ADVANCED = "https://www.twilio.com/docs/messaging/tutorials/advanced-opt-out";
const TOLL_FREE = "https://support.twilio.com/hc/en-us/articles/360058144374-Opt-out-keyword-handling-SMS-STOP-Filtering-for-Toll-Free-SMS";
const CHANGELOG = "https://www.twilio.com/en-us/changelog/twilio-will-bill-for-failed-messages-starting-september-30--2024";
const TOOLKIT = "https://www.twilio.com/docs/messaging/features/compliance-toolkit";

const findStop = `curl -G "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \\
  --data-urlencode "From=+12025550123" \\
  --data-urlencode "To=+12025550142" \\
  --data-urlencode "PageSize=5" \\
  -u "$TWILIO_API_KEY:$TWILIO_API_SECRET"`;

const stopResponse = `{
  "messages": [
    {
      "body": "STOP",
      "direction": "inbound",
      "status": "received",
      "from": "+12025550123",
      "to": "+12025550142",
      "date_sent": "Tue, 03 Nov 2026 16:12:31 +0000"
    }
  ]
}`;

const askBack = `Hi Sam, this is Harbor Bike Shop. You opted out of our texts, so we
can't send pickup alerts. If you'd like them back, text START to
(202) 555-0142. If not, no action is needed.`;

const steps = [
  { name: "Confirm the opt-out", text: "List inbound messages from the recipient to your sender and look for STOP or a similar word." },
  { name: "Decide if it stands", text: "If they meant it, leave them opted out. If the number may have changed hands, treat it as a new person." },
  { name: "Stop sending to that number", text: "Mark the number in your own list, stop retries, and cancel any scheduled messages to it." },
  { name: "Ask them to opt back in, if appropriate", text: "Through another channel, explain the texts they would get and ask them to text START to your number." },
  { name: "Check it worked", text: "After they text START, send one test message and confirm that its status has no 21610 error." },
];

const toc = [
  { id: "means", title: "What 21610 tells you" },
  { id: "keywords", title: "Which words trigger it" },
  { id: "step-1", title: "1. Confirm the opt-out" },
  { id: "step-2", title: "2. Decide if it stands" },
  { id: "step-3", title: "3. Stop sending" },
  { id: "step-4", title: "4. Ask them to opt back in" },
  { id: "step-5", title: "5. Check it worked" },
  { id: "fees", title: "The failed-message fee" },
  { id: "prevent", title: "Preventing it next time" },
  { id: "faq", title: "Questions" },
];

const faq = [
  {
    q: "Is there any way to clear an opt-out without a START text?",
    a: "Twilio's error page says you can't send until they respond with START or another opt-in keyword. For US SMS, Twilio's Compliance Toolkit has a Consent Management API that can record a fresh opt-in. Only use it when the person really did agree again.",
  },
  {
    q: "Can I just text them from a different Twilio number?",
    a: "It may go through, since the block is usually tied to the sender, but it's the wrong move. They asked you to stop. Ignoring that invites complaints, and complaints lead to filtering.",
  },
  {
    q: "Why did I get 21610 for someone who never texted me?",
    a: "They may have replied STOP to a different sender in the same Messaging Service. If you use Twilio's Compliance Toolkit, a number found to be reassigned can also return 21610.",
  },
  {
    q: "Does an opted-out person still get HELP replies?",
    a: "No. Twilio's docs say a person who has opted out won't get the help reply until they opt back in.",
  },
  {
    q: "Is this guide legal advice?",
    a: "No. It explains how Twilio's opt-out system behaves. For what consent law requires of your business, talk to a qualified lawyer.",
  },
];

export default function Page() {
  const entry = getEntry(path)!;
  return (
    <>
      <JsonLd data={howToLd({ name: "How to fix Twilio error 21610", description: entry.description, path, steps })} />
      <Breadcrumbs path={path} />
      <PageHero
        eyebrow="Guide"
        title={entry.title}
        lede="To fix Twilio error 21610, the person has to text START to your number, because 21610 means they replied STOP and Twilio is blocking your texts to them. On your side, confirm the opt-out, stop sending to that number, and only ask them to opt back in if they'd want that."
      />
      <Container>
        <div className="toc-layout">
          <TocSidebar items={toc} />
          <Prose>
            <p>
              This guide covers what to do next. For the short definition, see our <Link href="/twilio-errors/21610">reference page for error 21610</Link>.
            </p>

            <h2 id="means">What error 21610 is telling you</h2>
            <p>
              <a href={ERROR_DOC} rel="noopener">
                Twilio&apos;s definition
              </a>{" "}
              is that the recipient has opted out of messages from your number, Channels sender or Messaging Service. So 21610 isn&apos;t a bug in your code. The system is doing what the person asked. A retry can&apos;t solve it, and neither can a change to your message.
            </p>
            <p>
              How you see it depends on your setup. On a standard send, the{" "}
              <a href={OPT_OUT} rel="noopener">
                API rejects the request
              </a>{" "}
              with a 400 response and code 21610. With{" "}
              <a href={ADVANCED} rel="noopener">
                Advanced Opt-Out
              </a>{" "}
              on a Messaging Service, the request succeeds, then the message fails later. A{" "}
              <Link href="/guides/how-to-schedule-sms-with-twilio">scheduled text</Link> fails at its send time, so check both places.
            </p>

            <h2 id="keywords">Which words trigger an opt-out, and which reverse it?</h2>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Opt-out and opt-in keywords by sender type">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Sender</th>
                    <th scope="col">Opts out</th>
                    <th scope="col">Opts back in</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Long code (default)</th>
                    <td>STOP, UNSUBSCRIBE, END, QUIT, STOPALL, REVOKE, OPTOUT, CANCEL</td>
                    <td>START, YES, UNSTOP</td>
                  </tr>
                  <tr>
                    <th scope="row">US or Canada toll-free</th>
                    <td>Handled at carrier level, and can&apos;t be customized</td>
                    <td>START, UNSTOP (<a href={TOLL_FREE} rel="noopener">YES doesn&apos;t work</a>)</td>
                  </tr>
                  <tr>
                    <th scope="row">Advanced Opt-Out</th>
                    <td>Your own list, plus the required STOP</td>
                    <td>Your own list, plus the required START and UNSTOP</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Scope matters too. A STOP creates an opt-out for the number that received it and for the Messaging Service, but{" "}
              <a href={OPT_OUT} rel="noopener">
                the service-level record
              </a>{" "}
              only applies when you send using the Messaging Service SID. That&apos;s why a person who stopped one number in a pool can be blocked across the whole service.
            </p>

            <h2 id="step-1">Step 1: Confirm the opt-out</h2>
            <p>
              Search for texts from the recipient to your sender. Note that the recipient goes in <code>From</code> here, since you&apos;re looking for what they sent you. If you use a Messaging Service, repeat this for the other numbers in the pool.
            </p>
            <CodeBlock title="List what this person sent to your number" code={findStop} />
            <CodeBlock title="An opt-out in the results (shortened)" code={stopResponse} />
            <p>
              If the body doesn&apos;t say STOP exactly, compare it with the table above. A person might have sent QUIT or CANCEL. If there&apos;s nothing at all, the number may have been blocked through another sender, or at the carrier for toll-free, which is covered next.
            </p>

            <h2 id="step-2">Step 2: Decide if the opt-out stands</h2>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="What to do for each opt-out situation">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Situation</th>
                    <th scope="col">What to do</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>They meant it</td>
                    <td>Leave them opted out and remove them from your list. This is what Twilio&apos;s error page suggests first</td>
                  </tr>
                  <tr>
                    <td>They did it by accident, or want a specific text now</td>
                    <td>Go to step 4</td>
                  </tr>
                  <tr>
                    <td>You can&apos;t find a STOP on a toll-free number</td>
                    <td>It may have been handled at carrier level, so ask them to text START or UNSTOP</td>
                  </tr>
                  <tr>
                    <td>The number may have{" "}
                      <a href={ERROR_DOC} rel="noopener">changed hands</a>
                    </td>
                    <td>Your consent came from the old owner. Treat this as a stranger and don&apos;t ask them to opt in to your old list</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 id="step-3">Step 3: Stop sending to that number</h2>
            <ul>
              <li>
                <strong>Mark the number in your own records.</strong> Twilio blocks the text, but it&apos;s your list that keeps trying.
              </li>
              <li>
                <strong>Stop automatic retries.</strong> The error won&apos;t clear by itself, so treat 21610 as final until the person opts back in. Twilio&apos;s fee notice lists retrying after a 4xx response as a common cause of elevated failures.
              </li>
              <li>
                <strong>Cancel scheduled texts.</strong> Opting out{" "}
                <a href="https://www.twilio.com/docs/messaging/features/message-scheduling" rel="noopener">
                  doesn&apos;t cancel them
                </a>
                , so they&apos;ll fail at their send time unless you do.
              </li>
              <li>
                <strong>Capture future opt-outs.</strong> Advanced Opt-Out passes an <code>OptOutType</code> value to your webhook, so your software can update your list straight away.
              </li>
            </ul>

            <h2 id="step-4">Step 4: Ask them to opt back in, if appropriate</h2>
            <p>
              You can&apos;t ask by text, because that text would be blocked. Use a channel you already have a relationship on, such as email, a phone call or in person. Only ask if they&apos;re a real customer who has a reason to want the texts, and be clear about what they&apos;d get. For a toll-free number, tell them to send START or UNSTOP, not YES. Here is an example for email:
            </p>
            <CodeBlock title="Example request (fictional business)" code={askBack} />
            <p>
              The person has to send the word from the phone that opted out to the same number. Once it arrives, Twilio removes the block and sends a confirmation. With Advanced Opt-Out, you can write that confirmation yourself.
            </p>

            <h2 id="step-5">Step 5: Check it worked</h2>
            <ol>
              <li>Search again as in step 1. You should now see their START after the STOP.</li>
              <li>
                Send one useful message. Our guide to <Link href="/guides/how-does-twilio-sms-work">how Twilio SMS works</Link> covers the statuses to look for.
              </li>
              <li>Mark them as active again in your own list, and record when and how they opted back in.</li>
            </ol>

            <h2 id="fees">How 21610 can cost you failed-message fees</h2>
            <p>
              Twilio&apos;s{" "}
              <a href={CHANGELOG} rel="noopener">
                changelog on failed-message billing
              </a>{" "}
              names 21610, alongside 21211 and 21614, as a common cause of elevated failed-message fees. It&apos;s worth reading if you send to large lists. As of November 2026, the fee is $0.001 for a message that ends in <code>failed</code>. Here is what that looks like if you send a weekly text to a list where 200 people have opted out and you never clean it:
            </p>
            <ul>
              <li>Per month: 200 people x 4 sends = 800 blocked attempts</li>
              <li>Fee: 800 x $0.001 = <strong>$0.80 a month</strong></li>
            </ul>
            <p>
              That&apos;s small, and it&apos;s easy to stop. Still, the larger concern is what those failures hide, since they crowd your logs and make real problems harder to see. Twilio suggests the Messaging Insights dashboard to review your failed volume and error codes. The changelog doesn&apos;t break the fee down by how a 21610 reached you, so check your own usage records for the real figure. For the wider picture, see <Link href="/guides/how-does-twilio-pricing-work">how Twilio pricing works</Link>.
            </p>

            <h2 id="prevent">How do you prevent 21610 next time?</h2>
            <ul>
              <li>Get clear consent before the first text, and say what kind of messages to expect.</li>
              <li>Name your business and include opt-out wording, so people don&apos;t need to guess.</li>
              <li>Keep your own opt-out list, and check it before every send.</li>
              <li>
                Use a Messaging Service with <a href={ADVANCED} rel="noopener">Advanced Opt-Out</a> if you need custom or localized keywords. Twilio notes that you can only turn it off again through Support.
              </li>
              <li>
                Keep your list clean with <Link href="/twilio-errors/21211">error 21211</Link> and <Link href="/twilio-errors/21614">error 21614</Link> too, as they&apos;re named in the same fee notice.
              </li>
              <li>
                A rising opt-out rate is a warning sign, because Twilio says it plays a major role in carrier filtering. It&apos;s often how people end up needing to{" "}
                <Link href="/guides/fix-twilio-error-30007">fix error 30007</Link>. US senders should also make sure this matches their <Link href="/guides/a2p-10dlc-registration-guide">A2P campaign details</Link>.
              </li>
            </ul>
            <Callout type="info" title="About the Consent Management API">
              <p>
                Twilio&apos;s{" "}
                <a href={TOOLKIT} rel="noopener">
                  Compliance Toolkit
                </a>{" "}
                can record a new opt-in that overrides STOP, for US SMS in English. It has its own pricing. It&apos;s for consent someone actually gave you, not for reversing a STOP you&apos;d rather not honor.
              </p>
            </Callout>
            <Callout type="info" title="Not legal advice">
              <p>This guide describes how Twilio behaves. It isn&apos;t legal advice. Ask a lawyer what consent and opt-out rules apply to your business.</p>
            </Callout>

            <h2 id="faq">Questions</h2>
            <Faq items={faq} />
          </Prose>
        </div>
      </Container>
      <RelatedLinks path={path} />
      <CtaBand
        title="See an opt-out as soon as it matters"
        text="When a text fails with 21610, Dialbubble tells you plainly that this person opted out and what they need to do. It's a free iPhone app for your own Twilio account. Explore it first in Demo Mode, no account needed."
      />
    </>
  );
}

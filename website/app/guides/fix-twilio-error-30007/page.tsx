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

const path = "/guides/fix-twilio-error-30007";
export const metadata = metaFor(path, { type: "article" });

const ERROR_DOC = "https://www.twilio.com/docs/api/errors/30007";
const PREVENT = "https://help.twilio.com/articles/1260803966670-How-do-I-prevent-my-Twilio-messages-from-being-filtered-blocked-";
const FILTERING = "https://support.twilio.com/hc/en-us/articles/360022449893-SMS-Message-Filtering-in-the-United-States-and-Canada";
const FORBIDDEN = "https://support.twilio.com/hc/en-us/articles/360045004974-Forbidden-message-categories-for-SMS-and-MMS-in-the-US-and-Canada";

const fetchMessage = `curl "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages/SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.json" \\
  -u "$TWILIO_API_KEY:$TWILIO_API_SECRET"`;

const fetchResponse = `{
  "sid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "status": "undelivered",
  "error_code": 30007,
  "from": "+12025550142",
  "to": "+12025550123",
  "date_sent": "Mon, 09 Nov 2026 17:00:04 +0000"
}`;

const listRecent = `curl -G "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \\
  --data-urlencode "From=+12025550142" \\
  --data-urlencode "PageSize=50" \\
  -u "$TWILIO_API_KEY:$TWILIO_API_SECRET"`;

const rewriteBefore = `URGENT!!! You've WON a FREE gift card 🎉🎉 Claim NOW before it's gone: bit.ly/3xYzAb`;

const rewriteAfter = `Harbor Bike Shop: your 20% off tune-up coupon is ready, good through May 31. Details: harborbikes.example/spring Reply STOP to opt out.`;

const steps = [
  { name: "Confirm it is really 30007", text: "Fetch the message and check that its status is undelivered with error code 30007, since similar errors have different fixes." },
  { name: "Check your sender is registered", text: "Make sure your US local number is linked to an approved A2P campaign, or your toll-free number is verified." },
  { name: "Find the pattern", text: "Compare recent messages to see if the failures follow one message, one link, one carrier or one recipient list." },
  { name: "Check the use case is allowed", text: "Compare what you send with Twilio's forbidden message categories, because rewording can't fix a banned category." },
  { name: "Fix links and rewrite the message", text: "Replace public short links with your own domain, name your business, and remove spam-style wording." },
  { name: "Check consent and opt-outs", text: "Only text people who agreed, include opt-out wording, and watch for spikes in complaints or opt-outs." },
  { name: "Test slowly", text: "Send the fixed message to a few consenting people on different carriers, then read each status." },
  { name: "Escalate to Twilio Support", text: "If you believe the messages are compliant, send Support three or more recent Message SIDs with error 30007." },
];

const toc = [
  { id: "means", title: "What error 30007 tells you" },
  { id: "step-1", title: "1. Confirm it's really 30007" },
  { id: "step-2", title: "2. Check your registration" },
  { id: "step-3", title: "3. Find the pattern" },
  { id: "step-4", title: "4. Check your use case" },
  { id: "step-5", title: "5. Fix links, rewrite" },
  { id: "step-6", title: "6. Check consent" },
  { id: "step-7", title: "7. Test slowly" },
  { id: "step-8", title: "8. Escalate to Support" },
  { id: "dont", title: "What not to do" },
  { id: "faq", title: "Questions" },
];

const faq = [
  {
    q: "Am I charged for a message that gets error 30007?",
    a: "Usually, yes. A 30007 message normally ends as undelivered. That means no $0.001 failed-message fee, but Twilio charges its normal fees when delivery was attempted.",
  },
  {
    q: "Which words get a text filtered?",
    a: "There's no public list, and filters look at patterns as well as words. Twilio's advice is to avoid forbidden categories, public short links, unnecessary special characters and odd capitalization.",
  },
  {
    q: "Will A2P 10DLC registration fix 30007?",
    a: "It often helps, because Twilio says registering results in lower filtering. It won't fix a forbidden use case, a message that looks like spam, or a list of people who didn't agree to hear from you.",
  },
  {
    q: "How long does a filter block last?",
    a: "Twilio doesn't publish a duration. Change what triggered it and test again. If you've done that and your traffic is compliant, send Support your examples.",
  },
  {
    q: "Is this guide legal advice?",
    a: "No. It covers Twilio's and carriers' published rules in plain words. For what the law requires of your messages, talk to a qualified lawyer.",
  },
];

export default function Page() {
  const entry = getEntry(path)!;
  return (
    <>
      <JsonLd data={howToLd({ name: "How to fix Twilio error 30007", description: entry.description, path, steps })} />
      <Breadcrumbs path={path} />
      <PageHero
        eyebrow="Guide"
        title={entry.title}
        lede="To fix Twilio error 30007, first work out why your message was filtered: an unregistered sender, a forbidden use case, a suspicious link or spam-like wording. Then correct that cause and test slowly, and only ask Twilio Support to review once your messages comply."
      />
      <Container>
        <div className="toc-layout">
          <TocSidebar items={toc} />
          <Prose>
            <p>
              This is the working-through guide. For a quick definition, see our{" "}
              <Link href="/twilio-errors/30007">reference page for error 30007</Link>.
            </p>

            <h2 id="means">What error 30007 is telling you</h2>
            <p>
              <a href={ERROR_DOC} rel="noopener">
                Twilio&apos;s definition
              </a>{" "}
              is that your message was blocked by Twilio or by a carrier. Two things make it hard to fix: you aren&apos;t told which rule you broke, and filters can react to your overall traffic as well as to one text. Treat it as a process of elimination, and go through these steps in order. The early ones are the quickest to rule out.
            </p>
            <Callout type="info" title="Not legal advice">
              <p>This guide covers compliance topics in general terms. It isn&apos;t legal advice. Ask a lawyer what the law requires for your own messages.</p>
            </Callout>

            <h2 id="step-1">Step 1: Confirm it&apos;s really 30007</h2>
            <p>Look at one failed message rather than going by a report or a dashboard total:</p>
            <CodeBlock title="Fetch one message" code={fetchMessage} />
            <CodeBlock title="What a filtered message looks like (shortened)" code={fetchResponse} />
            <p>If the code is something else, the fix is different:</p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Errors that look like 30007 and what they mean instead">
              <table>
                <thead>
                  <tr>
                    <th scope="col">You see</th>
                    <th scope="col">It means</th>
                    <th scope="col">Go to</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><Link href="/twilio-errors/30034">30034</Link></td>
                    <td>Sent from an unregistered US local number</td>
                    <td>Step 2</td>
                  </tr>
                  <tr>
                    <td><Link href="/twilio-errors/30035">30035</Link></td>
                    <td>Number is still registering, up to 24 hours</td>
                    <td>Wait</td>
                  </tr>
                  <tr>
                    <td>
                      <a href="https://www.twilio.com/docs/api/errors/30032" rel="noopener">30032</a>
                    </td>
                    <td>Toll-free number isn&apos;t verified</td>
                    <td>Step 2</td>
                  </tr>
                  <tr>
                    <td><Link href="/twilio-errors/21610">21610</Link></td>
                    <td>The person opted out</td>
                    <td><Link href="/guides/fix-twilio-error-21610">The 21610 fix</Link></td>
                  </tr>
                  <tr>
                    <td><Link href="/twilio-errors/30006">30006</Link></td>
                    <td>Landline or unreachable carrier</td>
                    <td>Check the number</td>
                  </tr>
                  <tr>
                    <td><Link href="/twilio-errors/30003">30003</Link></td>
                    <td>The handset is unreachable</td>
                    <td>Try again later</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 id="step-2">Step 2: Check your sender is registered</h2>
            <p>
              <a href={FILTERING} rel="noopener">
                Twilio says
              </a>{" "}
              some carriers filter specifically to catch A2P traffic sent without registration, so check this before you touch any wording.
            </p>
            <ul>
              <li>
                <strong>US local number:</strong> the number must be in the sender pool of a Messaging Service linked to an approved campaign. If you haven&apos;t done this, start with our <Link href="/guides/a2p-10dlc-registration-guide">A2P 10DLC registration guide</Link>.
              </li>
              <li>
                <strong>Toll-free number:</strong> it needs{" "}
                <a href="https://www.twilio.com/docs/messaging/compliance/toll-free/console-onboarding" rel="noopener">
                  approved verification
                </a>
                .
              </li>
              <li>
                <strong>A registered campaign:</strong> reread what you registered. If you now send marketing on a campaign that was approved for appointment reminders, your traffic no longer matches.
              </li>
            </ul>

            <h2 id="step-3">Step 3: Find the pattern</h2>
            <p>List your recent messages and compare the ones with 30007 against the ones that got through:</p>
            <CodeBlock title="List recent messages from one number" code={listRecent} />
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="What failure patterns suggest">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Pattern</th>
                    <th scope="col">Points to</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Every message fails, whatever the wording</td>
                    <td>Registration or the sender (step 2)</td>
                  </tr>
                  <tr>
                    <td>Only messages with one link fail</td>
                    <td>The link or its domain (step 5)</td>
                  </tr>
                  <tr>
                    <td>Only one template fails</td>
                    <td>The wording (step 5)</td>
                  </tr>
                  <tr>
                    <td>Failures began suddenly with no change from you</td>
                    <td>A filter recently learned your pattern, or complaints rose (step 6)</td>
                  </tr>
                  <tr>
                    <td>Only a new or bought list fails</td>
                    <td>Consent (step 6)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Twilio also notes that a sudden spike in 30007 suggests a filter has recently identified a pattern in your messages. Also keep in mind that{" "}
              <a href="https://help.twilio.com/articles/223181848-How-Does-Carrier-Filtering-Work-" rel="noopener">
                carriers may rarely report a filtered message as delivered
              </a>
              , so a few delivered statuses aren&apos;t proof that all is well.
            </p>

            <h2 id="step-4">Step 4: Check your use case is allowed</h2>
            <p>
              Twilio&apos;s{" "}
              <a href={FORBIDDEN} rel="noopener">
                forbidden message categories
              </a>{" "}
              for the US and Canada include gambling, cannabis and CBD, phishing, third-party lead generation, debt relief, and high-risk loans. Firearms and vaping are barred on all number types, and alcohol needs proper age gating. If your use case falls in a forbidden category, no wording will save it, so you&apos;ll need to rethink SMS as a channel for it.
            </p>

            <h2 id="step-5">Step 5: Fix your links and rewrite the message</h2>
            <p>
              Links come first. Twilio&apos;s{" "}
              <a href={PREVENT} rel="noopener">
                filtering advice
              </a>{" "}
              warns against shared public shorteners such as free bit.ly links, because spammers use them too. Use a domain you own and that matches your business. Then look at the wording. Here is a blocked-style text, followed by a rewrite. Both come from a fictional shop:
            </p>
            <CodeBlock title="Before: looks like spam" code={rewriteBefore} />
            <CodeBlock title="After: clear, specific, identifiable" code={rewriteAfter} />
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="What changed between the two messages and why">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Before</th>
                    <th scope="col">After</th>
                    <th scope="col">Why it helps</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>No sender named</td>
                    <td>Starts with the business name</td>
                    <td>The reader knows who it is</td>
                  </tr>
                  <tr>
                    <td>URGENT, WON, FREE, NOW</td>
                    <td>Normal capitals, a real offer and date</td>
                    <td>Twilio warns against odd capitalization</td>
                  </tr>
                  <tr>
                    <td>Two emoji</td>
                    <td>None</td>
                    <td>Twilio suggests avoiding emoji, and the text moves from UCS-2 to GSM-7</td>
                  </tr>
                  <tr>
                    <td><code>bit.ly</code> link</td>
                    <td>Own domain</td>
                    <td>The reader can see where it goes</td>
                  </tr>
                  <tr>
                    <td>No way out</td>
                    <td>Reply STOP to opt out</td>
                    <td>Uses a standard opt-out word</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              There&apos;s a bonus on cost. The first version is 84 UCS-2 code units, so 2 segments, while the second is 135 GSM-7 characters, so 1. You can read why in{" "}
              <Link href="/guides/gsm-7-vs-ucs-2-sms-encoding">GSM-7 vs UCS-2 encoding</Link>. Rewriting a text doesn&apos;t guarantee delivery, since filters aren&apos;t public, and it isn&apos;t a way to slip unwanted messages past them.
            </p>

            <h2 id="step-6">Step 6: Check consent and opt-outs</h2>
            <p>
              Twilio says high opt-out rates and complaints play a major role in carrier filtering. If people didn&apos;t ask for your texts, better wording won&apos;t last.
            </p>
            <ul>
              <li>Only message people who agreed to hear from you. Remove any bought or scraped numbers.</li>
              <li>Put opt-out wording in your first message using a standard word like STOP. Twilio warns that nonstandard wording such as &quot;text 2 to opt out&quot; gets filtered.</li>
              <li>For US and Canadian traffic, Twilio says carriers expect opt-out language in every third message, or at least once a month for lighter senders.</li>
              <li>Check in with long-term contacts at least every 18 months.</li>
            </ul>

            <h2 id="step-7">Step 7: Test slowly</h2>
            <ol>
              <li>Pick a few people who agreed to receive texts, ideally on different carriers.</li>
              <li>Send only the fixed message, one at a time.</li>
              <li>Fetch each message&apos;s status as in step 1, then ask whether it arrived.</li>
              <li>If those pass, increase volume gradually rather than resending the whole list at once.</li>
            </ol>
            <p>
              Don&apos;t forget the bill while you test. As of November 2026, an <code>undelivered</code> message avoids the{" "}
              <a href="https://www.twilio.com/en-us/changelog/twilio-will-bill-for-failed-messages-starting-september-30--2024" rel="noopener">
                $0.001 failed-message fee
              </a>
              , but{" "}
              <a href="https://help.twilio.com/articles/223181728" rel="noopener">
                Twilio charges its normal fees
              </a>{" "}
              when delivery was attempted. At{" "}
              <a href="https://www.twilio.com/en-us/sms/pricing/us" rel="noopener">
                $0.0083 per segment plus a carrier fee
              </a>
              , resending a one-segment text to 1,000 T-Mobile customers costs 1,000 x $0.0128 = $12.80 each time, even if every copy is blocked.
            </p>

            <h2 id="step-8">Step 8: Escalate to Twilio Support</h2>
            <p>
              If you&apos;ve done all of the above and still believe your messages comply,{" "}
              <a href={ERROR_DOC} rel="noopener">
                Twilio invites you to contact Support
              </a>
              . Include:
            </p>
            <ul>
              <li>Three or more Message SIDs with <code>undelivered</code> status and error 30007, from the past 7 days</li>
              <li>What you send, who receives it, and how those people opted in</li>
              <li>Your campaign or toll-free verification details</li>
              <li>What you already changed, and when</li>
            </ul>

            <h2 id="dont">What shouldn&apos;t you do?</h2>
            <ul>
              <li>
                <strong>Don&apos;t spread sends across extra numbers.</strong> Twilio says using several numbers to get past filtering, known as snowshoeing, is prohibited.
              </li>
              <li>
                <strong>Don&apos;t tweak spelling to dodge filters.</strong> Swapping letters for symbols looks even more like spam, and it can force UCS-2.
              </li>
              <li>
                <strong>Don&apos;t retry in a loop.</strong> The same text at the same filter will usually get the same result, and you pay each time.
              </li>
            </ul>

            <h2 id="faq">Questions</h2>
            <Faq items={faq} />
          </Prose>
        </div>
      </Container>
      <RelatedLinks path={path} />
      <CtaBand
        title="Know why a text failed, on your iPhone"
        text="Dialbubble shows delivery status and explains Twilio errors like 30007 in plain English. It's a free iPhone app for your own Twilio account, and it can't get around filters or registration. Try it in Demo Mode."
      />
    </>
  );
}

import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Callout } from "@/components/Callout";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { Faq } from "@/components/Faq";
import { PageHero } from "@/components/PageHero";
import { Prose } from "@/components/Prose";
import { RelatedLinks } from "@/components/RelatedLinks";
import { TocSidebar } from "@/components/TocSidebar";
import { getEntry, metaFor } from "@/lib/registry";
import { articleLd, JsonLd } from "@/lib/seo";

const path = "/guides/how-does-twilio-pricing-work";
export const metadata = metaFor(path, { type: "article" });

const SMS = "https://www.twilio.com/en-us/sms/pricing/us";
const VOICE = "https://www.twilio.com/en-us/voice/pricing/us";

const toc = [
  { id: "model", title: "The basic model" },
  { id: "calls", title: "What calls cost" },
  { id: "texts", title: "What texts cost" },
  { id: "bill", title: "A worked monthly bill" },
  { id: "extras", title: "Charges people miss" },
  { id: "balance", title: "How you pay" },
  { id: "faq", title: "Questions" },
];

const faq = [
  {
    q: "Does Twilio charge a monthly subscription?",
    a: "There's no plan or platform fee for pay-as-you-go use. The recurring charges come from what you hold, mainly phone numbers and, for US texting, A2P 10DLC campaign fees.",
  },
  {
    q: "How much does a Twilio call cost per minute?",
    a: "In the US, as of November 2026, an outbound call is $0.0140 a minute, and an inbound call is $0.0085 a minute to a local number or $0.0220 to a toll-free number. Each leg is billed on its own.",
  },
  {
    q: "Am I charged for calls nobody answers?",
    a: "Busy, no-answer, canceled and failed calls aren't charged, but a completed leg connected to them still is. A call answered by voicemail or a phone menu counts as completed, so it's charged.",
  },
  {
    q: "Am I charged for texts that don't arrive?",
    a: "Possibly. A message that ends as Failed has a $0.001 processing fee, with some exemptions. A message that ends as Undelivered has no failed fee, but Twilio charges the full fees when delivery was attempted.",
  },
  {
    q: "Are there volume discounts?",
    a: "Yes. Twilio says volume pricing applies automatically at scale for US and Canadian voice minutes, messages and phone numbers, and it offers committed-use discounts through sales.",
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
        lede="Twilio is pay-as-you-go: you pay per call minute, per text segment and per phone number each month, with no plan and no contract. A light user in the US might pay around $11 a month, and the example below shows exactly how that adds up."
      />
      <Container>
        <div className="toc-layout">
          <TocSidebar items={toc} />
          <Prose>
            <h2 id="model">How does Twilio pricing work?</h2>
            <p>
              Think of Twilio as a meter rather than a phone plan. Nothing is bundled, so there are no included minutes and no &quot;unlimited&quot;. Three things drive nearly every bill:
            </p>
            <ul>
              <li><strong>Numbers:</strong> a monthly fee for each phone number you hold, whether you use it or not.</li>
              <li><strong>Calls:</strong> a per-minute rate for each leg of each call.</li>
              <li><strong>Texts:</strong> a per-segment rate, plus a carrier fee.</li>
            </ul>
            <p>
              All prices on this page are US rates in US dollars, as of November 2026, from Twilio&apos;s{" "}
              <a href={VOICE} rel="noopener">voice pricing</a> and <a href={SMS} rel="noopener">SMS pricing</a> pages. Rates vary by country and change over time, so check those pages before you budget. New accounts can start with the <Link href="/guides/is-twilio-free-trial-limits">free Twilio trial and its limits</Link>.
            </p>

            <h2 id="calls">What does a Twilio call cost per minute?</h2>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="US voice rates">
              <table>
                <caption>
                  US voice, as of November 2026 (<a href={VOICE} rel="noopener">source</a>)
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Type</th>
                    <th scope="col">Rate per minute</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Outbound to local or toll-free</td><td>$0.0140</td></tr>
                  <tr><td>Outbound to Alaska</td><td>$0.0945</td></tr>
                  <tr><td>Inbound to a local number</td><td>$0.0085</td></tr>
                  <tr><td>Inbound to a toll-free number</td><td>$0.0220</td></tr>
                  <tr><td>Recording</td><td>$0.0025</td></tr>
                </tbody>
              </table>
            </div>
            <p>Two rules make your real cost different from what you might guess:</p>
            <ul>
              <li>
                <strong>Minutes round up.</strong> Twilio <a href="https://www.twilio.com/docs/voice/resolve-call-log-usage-discrepancies" rel="noopener">bills voice in whole minutes</a>, so a call of 1 minute 20 seconds is billed as 2.
              </li>
              <li>
                <strong>Each leg is its own call.</strong> When Twilio connects two phones, it bills both connections, and <a href="https://support.twilio.com/hc/en-us/articles/223132307-How-are-Twilio-voice-and-calling-product-minutes-rounded-for-billing" rel="noopener">rounds each one separately</a>.
              </li>
            </ul>
            <p>Here&apos;s what that does to a US call lasting about 5 minutes, as of November 2026:</p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Cost of a five minute call by setup">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Setup</th>
                    <th scope="col">Sum</th>
                    <th scope="col">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>One outbound leg</td><td>5 x $0.0140</td><td>$0.07</td></tr>
                  <tr><td>Inbound to a local number</td><td>5 x $0.0085</td><td>$0.0425</td></tr>
                  <tr><td>Bridged: Twilio calls you, then them</td><td>2 x 5 x $0.0140</td><td>$0.14</td></tr>
                  <tr><td>Forwarded: inbound, then out to your phone</td><td>5 x ($0.0085 + $0.0140)</td><td>$0.1125</td></tr>
                </tbody>
              </table>
            </div>
            <p>
              The bridged row is how Dialbubble&apos;s Talk calls work, because the app has no in-app VoIP. Twilio rings your regular phone first and then dials the other person, so you pay for two legs. The forwarded row is covered in our guide to <Link href="/guides/twilio-call-forwarding">setting up Twilio call forwarding</Link>.
            </p>

            <h2 id="texts">What does a Twilio SMS cost?</h2>
            <p>
              A US text costs Twilio&apos;s rate of $0.0083 per segment plus a fee that depends on the recipient&apos;s carrier, as of November 2026 (<a href={SMS} rel="noopener">Twilio SMS pricing</a>). For a regular 10-digit number:
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="US outbound SMS cost by carrier">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Carrier</th>
                    <th scope="col">Twilio rate</th>
                    <th scope="col">Carrier fee</th>
                    <th scope="col">Total per segment</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>AT&amp;T</td><td>$0.0083</td><td>$0.0035</td><td>$0.0118</td></tr>
                  <tr><td>T-Mobile</td><td>$0.0083</td><td>$0.0045</td><td>$0.0128</td></tr>
                  <tr><td>Verizon</td><td>$0.0083</td><td>$0.0050</td><td>$0.0133</td></tr>
                  <tr><td>Most others</td><td>$0.0083</td><td>$0.0042</td><td>$0.0125</td></tr>
                </tbody>
              </table>
            </div>
            <p>
              Incoming texts cost $0.0083 too, and some carriers add a fee: AT&amp;T $0.0035 and T-Mobile $0.0025 per segment, as of November 2026 (<a href={SMS} rel="noopener">source</a>). A picture message costs more, at $0.022 to send and $0.0165 to receive on a long code, plus carrier fees.
            </p>
            <p>
              The word that catches people out is <em>segment</em>. A plain text up to 160 characters is one segment. A longer one splits into parts of 153 characters each. One emoji or curly quote switches the message to UCS-2 encoding, where the limits fall to 70 and 67 characters. So a 200-character message with an emoji is 3 segments, and to a Verizon customer that&apos;s 3 x $0.0133 = $0.0399. Our guide to <Link href="/guides/gsm-7-vs-ucs-2-sms-encoding">GSM-7 and UCS-2 encoding</Link> explains why.
            </p>

            <h2 id="bill">A worked monthly bill</h2>
            <p>
              Say you&apos;re a one-person business with one local US number. You send 300 one-segment texts, evenly across AT&amp;T, T-Mobile and Verizon. You get 100 replies, half from AT&amp;T and half from T-Mobile. You make 20 two-legged calls, billed at 4 minutes per leg. You also take 40 minutes of incoming calls, forwarded to your cell. All rates are as of November 2026 (<a href={VOICE} rel="noopener">voice</a>, <a href={SMS} rel="noopener">SMS</a>).
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Worked monthly Twilio bill">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Item</th>
                    <th scope="col">Sum</th>
                    <th scope="col">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Local number</td><td>1 x $1.15</td><td>$1.15</td></tr>
                  <tr><td>A2P Sole Proprietor campaign</td><td>1 x $2.00</td><td>$2.00</td></tr>
                  <tr><td>Texts sent</td><td>100 x ($0.0118 + $0.0128 + $0.0133)</td><td>$3.79</td></tr>
                  <tr><td>Replies received</td><td>50 x $0.0118 + 50 x $0.0108</td><td>$1.13</td></tr>
                  <tr><td>Two-legged calls</td><td>20 x 2 x 4 x $0.0140</td><td>$2.24</td></tr>
                  <tr><td>Forwarded incoming calls</td><td>40 x ($0.0085 + $0.0140)</td><td>$0.90</td></tr>
                  <tr><th scope="row">Monthly total</th><td>&nbsp;</td><td><strong>$11.21</strong></td></tr>
                </tbody>
              </table>
            </div>
            <p>
              On top of that, US texting registration has one-time fees: $4.50 for the brand and $15 to verify the campaign, so $19.50 once, as of November 2026 (<a href="https://www.twilio.com/docs/messaging/compliance/a2p-10dlc" rel="noopener">Twilio A2P 10DLC docs</a>). The $2.00 campaign fee in the table comes from the same place. See the <Link href="/guides/a2p-10dlc-registration-guide">A2P 10DLC registration guide</Link> for the steps. Your own numbers will differ, so try them in the <Link href="/tools/twilio-pricing-calculator">Twilio pricing calculator</Link>.
            </p>

            <h2 id="extras">What other Twilio charges should I expect?</h2>
            <ul>
              <li>
                <strong>Failed messages:</strong> $0.001 per message ending in Failed, as of November 2026, from the <a href="https://www.twilio.com/en-us/changelog/twilio-will-bill-for-failed-messages-starting-september-30--2024" rel="noopener">failed message fee announcement</a>. Common causes include an invalid number (<Link href="/twilio-errors/21211">error 21211</Link>) and texting someone who replied STOP (<Link href="/twilio-errors/21610">error 21610</Link>).
              </li>
              <li>
                <strong>Recording:</strong> $0.0025 per minute, plus storage at $0.0005 per minute per month, as of November 2026 (<a href={VOICE} rel="noopener">source</a>).
              </li>
              <li>
                <strong>Add-ons:</strong> transcription at $0.05 per minute and answering machine detection at $0.0075 per call, as of November 2026 (<a href={VOICE} rel="noopener">source</a>).
              </li>
              <li>
                <strong>Number fees:</strong> local isn&apos;t the only option. See <Link href="/guides/how-much-does-a-twilio-phone-number-cost">how much a Twilio phone number costs</Link> for toll-free and other countries.
              </li>
            </ul>

            <h2 id="balance">How do you pay Twilio?</h2>
            <p>
              Most small accounts work on a prepaid balance. You add funds, and usage comes out of them. You can turn on auto-recharge so the balance tops up when it falls below a level you pick. Don&apos;t let it hit zero: Twilio <a href="https://support.twilio.com/hc/en-us/articles/223183248-What-happens-if-my-Twilio-balance-reaches-zero" rel="noopener">suspends the account at zero</a>, which blocks calls and texts until you add funds, and <a href="https://support.twilio.com/hc/en-us/articles/223183088-Do-I-Still-Get-Charged-for-Phone-Numbers-When-My-Account-is-Suspended" rel="noopener">number fees keep billing</a> during a suspension.
            </p>
            <Callout type="cost" title="What Dialbubble adds to this">
              <p>
                Nothing. Dialbubble is free, with no subscription and no markup, and you pay Twilio its normal rates directly. Read the <Link href="/pricing">Dialbubble pricing page</Link> for details. Hosted business-phone services bundle these costs into a monthly seat price, which is simpler but works differently.
              </p>
            </Callout>

            <h2 id="faq">Questions about Twilio pricing</h2>
            <Faq items={faq} />
          </Prose>
        </div>
      </Container>
      <RelatedLinks path={path} />
      <CtaBand
        title="Pay Twilio's rates, and nothing on top"
        text="Dialbubble shows your Twilio balance and usage on your iPhone and adds no markup to any call or text. Try it in Demo Mode with no Twilio account and no charges."
      />
    </>
  );
}

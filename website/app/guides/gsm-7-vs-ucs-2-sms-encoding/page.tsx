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

const path = "/guides/gsm-7-vs-ucs-2-sms-encoding";
export const metadata = metaFor(path, { type: "article" });

const LIMITS = "https://www.twilio.com/docs/glossary/what-sms-character-limit";
const GSM = "https://www.twilio.com/docs/glossary/what-is-gsm-7-character-encoding";
const UCS = "https://www.twilio.com/docs/glossary/what-is-ucs-2-character-encoding";
const PRICING = "https://www.twilio.com/en-us/sms/pricing/us";

const formula = `GSM-7
  160 characters or fewer:  1 segment
  more than 160:            characters / 153, rounded up

UCS-2
  70 code units or fewer:   1 segment
  more than 70:             code units / 67, rounded up`;

const examples = `A. Plain text: 152 characters, GSM-7
Hi Sam, your table for 4 at Harbor Grill is confirmed for Friday at
7:30 PM. Need to change it? Call 202-555-0142. Reply STOP to opt out
of these texts.

B. One curly apostrophe: 148 characters, UCS-2
Hi Sam, your table for 4 at Harbor Grill is confirmed for Friday at
7:30 PM. Can’t make it? Call 202-555-0142. Reply STOP to opt out of
these texts.

C. One emoji: A plus " 🎉", 155 code units, UCS-2
Hi Sam, your table for 4 at Harbor Grill is confirmed for Friday at
7:30 PM. Need to change it? Call 202-555-0142. Reply STOP to opt out
of these texts. 🎉`;

const toc = [
  { id: "difference", title: "GSM-7 vs UCS-2 at a glance" },
  { id: "gsm", title: "What are GSM characters?" },
  { id: "why", title: "Why the limits are 153 and 67" },
  { id: "worked", title: "Worked segment counts" },
  { id: "cost", title: "What the switch costs" },
  { id: "avoid", title: "How to stay in GSM-7" },
  { id: "faq", title: "Questions" },
];

const faq = [
  {
    q: "How many segments does a 161-character text use?",
    a: "Two, if it's all GSM-7. Twilio's example splits it into one segment of 153 characters and one of 8.",
  },
  {
    q: "Why did my message switch to UCS-2 when I can't see anything unusual?",
    a: "A word processor or phone keyboard has probably added a curly quote, a long dash or a non-standard space. They look normal on screen, but they aren't in GSM-7, so the whole message switches.",
  },
  {
    q: "Are accented letters safe in GSM-7?",
    a: "Some are. é, è, ù, ì, ò, à, ñ, ä, ö, ü and Ç are in the set, but á, í, ó, ú and ç aren't. One of those will switch the message to UCS-2.",
  },
  {
    q: "Does the encoding change how much I pay for each segment?",
    a: "No. The price per segment is the same. UCS-2 costs more because the same text splits into more segments.",
  },
  {
    q: "Does MMS or RCS use these limits?",
    a: "MMS doesn't use SMS segments. RCS uses UTF-8 and handles emoji natively, though Twilio says US delivery is still billed per segment of 160 UTF-8 characters.",
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
        lede="GSM-7 fits 160 characters in one SMS segment but only supports a limited alphabet, while UCS-2 supports nearly any character but fits just 70. One emoji or curly quote switches the whole message to UCS-2, which can turn a one-segment text into three and triple what you pay."
      />
      <Container>
        <div className="toc-layout">
          <TocSidebar items={toc} />
          <Prose>
            <h2 id="difference">GSM-7 vs UCS-2 at a glance</h2>
            <p>
              An SMS segment carries 140 bytes. The encoding decides how many characters fit in them. These figures come from{" "}
              <a href={LIMITS} rel="noopener">
                Twilio&apos;s message length docs
              </a>
              .
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="GSM-7 and UCS-2 limits compared">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Measure</th>
                    <th scope="col">GSM-7</th>
                    <th scope="col">UCS-2</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Size of each character</th>
                    <td>7 bits</td>
                    <td>16 bits</td>
                  </tr>
                  <tr>
                    <th scope="row">Single-segment limit</th>
                    <td>160</td>
                    <td>70</td>
                  </tr>
                  <tr>
                    <th scope="row">Per segment in a longer message</th>
                    <td>153</td>
                    <td>67</td>
                  </tr>
                  <tr>
                    <th scope="row">Per segment, toll-free to US or Canada</th>
                    <td>152</td>
                    <td>66</td>
                  </tr>
                  <tr>
                    <th scope="row">Covers</th>
                    <td>128 characters, mostly Latin</td>
                    <td>Emoji, Chinese, Arabic, Hindi and much more</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              You don&apos;t choose the encoding yourself.{" "}
              <a href={UCS} rel="noopener">
                Twilio picks the most compact one that fits
              </a>
              , so if any character falls outside GSM-7, the entire message becomes UCS-2, not just that character.
            </p>

            <h2 id="gsm">What are GSM characters?</h2>
            <p>
              The{" "}
              <a href={GSM} rel="noopener">
                GSM-7 set has 128 characters
              </a>
              : A to Z, a to z, 0 to 9, common punctuation, and a selection of accented letters and Greek capitals. It looks like ASCII, but it&apos;s not the same, and that catches
              people out.
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Which characters are safe in GSM-7">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Type</th>
                    <th scope="col">Characters</th>
                    <th scope="col">Effect</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Safe, 1 each</td>
                    <td><code>A-Z a-z 0-9 . , ! ? : ; - &apos; &quot; @ £ $ % &amp;</code> and é è ñ ü</td>
                    <td>Stays GSM-7</td>
                  </tr>
                  <tr>
                    <td>Safe, 2 each</td>
                    <td><code>{"{ } [ ] \\ ~ ^ |"}</code> and €</td>
                    <td>Stays GSM-7, counts double</td>
                  </tr>
                  <tr>
                    <td>Not in the set</td>
                    <td>Curly quotes, long dashes, á í ó ú ç, emoji, non-Latin scripts</td>
                    <td>Whole message goes to UCS-2</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Characters that count double need an escape character first. So <code>Your code is {"{4821}"}</code> has 39 visible characters but counts as 41. To test your own text
              character by character, paste it into the <Link href="/tools/gsm-7-character-checker">GSM-7 character checker</Link>.
            </p>

            <h2 id="why">Why are the limits 153 and 67, not 160 and 70?</h2>
            <p>The arithmetic for a single segment is simple:</p>
            <ul>
              <li>GSM-7: (140 bytes x 8 bits) / 7 bits = 160 characters</li>
              <li>UCS-2: (140 bytes x 8 bits) / 16 bits = 70 characters</li>
            </ul>
            <p>
              Once a message needs more than one segment, each one carries a 6-byte header telling the phone how to put the parts back together. That leaves 134 bytes, which gives 153
              GSM-7 characters or 67 UCS-2 ones.
            </p>
            <p>That produces this formula, which also powers our <Link href="/tools/sms-segment-calculator">SMS segment calculator</Link>:</p>
            <CodeBlock title="SMS segment formula" code={formula} />
            <p>
              Toll-free multi-segment messages to the US or Canada use 152 and 66 instead. In UCS-2, count code units rather than visible characters. Most emoji take two, which is how{" "}
              <a href="https://github.com/TwilioDevEd/message-segment-calculator" rel="noopener">
                Twilio&apos;s own segment calculator
              </a>{" "}
              counts them.
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Segment counts at each length boundary">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Segments</th>
                    <th scope="col">GSM-7 length</th>
                    <th scope="col">UCS-2 length</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>up to 160</td>
                    <td>up to 70</td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td>161 to 306</td>
                    <td>71 to 134</td>
                  </tr>
                  <tr>
                    <td>3</td>
                    <td>307 to 459</td>
                    <td>135 to 201</td>
                  </tr>
                  <tr>
                    <td>4</td>
                    <td>460 to 612</td>
                    <td>202 to 268</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 id="worked">Worked example: three versions of one text</h2>
            <p>Here is one short booking text, with two small changes:</p>
            <CodeBlock title="Three versions of a booking text" code={examples} />
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Segment arithmetic for the three example messages">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Version</th>
                    <th scope="col">Encoding</th>
                    <th scope="col">Length</th>
                    <th scope="col">Sum</th>
                    <th scope="col">Segments</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>A, plain</td>
                    <td>GSM-7</td>
                    <td>152</td>
                    <td>152 is under 160</td>
                    <td><strong>1</strong></td>
                  </tr>
                  <tr>
                    <td>B, curly apostrophe</td>
                    <td>UCS-2</td>
                    <td>148</td>
                    <td>148 / 67 = 2.2, round up</td>
                    <td><strong>3</strong></td>
                  </tr>
                  <tr>
                    <td>C, emoji</td>
                    <td>UCS-2</td>
                    <td>155</td>
                    <td>155 / 67 = 2.3, round up</td>
                    <td><strong>3</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>Version B is shorter than A and still costs three times as much. A single apostrophe did that.</p>

            <h2 id="cost">What does the switch to UCS-2 cost?</h2>
            <p>
              As of November 2026,{" "}
              <a href={PRICING} rel="noopener">
                Twilio&apos;s US SMS pricing
              </a>{" "}
              is $0.0083 per segment plus a carrier fee, which is $0.0045 on T-Mobile. That makes $0.0128 per segment. Sending the text above to 1,000 T-Mobile customers:
            </p>
            <ul>
              <li>Version A: 1,000 x 1 x $0.0128 = <strong>$12.80</strong></li>
              <li>Version B or C: 1,000 x 3 x $0.0128 = <strong>$38.40</strong></li>
            </ul>
            <p>
              That&apos;s $25.60 extra for one character. Segments also use up your sending allowance, because rate limits and{" "}
              <Link href="/guides/a2p-10dlc-registration-guide">A2P 10DLC daily caps</Link> are counted in segments, not messages. See{" "}
              <Link href="/guides/how-does-twilio-pricing-work">how Twilio pricing works</Link> for the rest of the bill.
            </p>

            <h2 id="avoid">How do you stay in GSM-7?</h2>
            <ol>
              <li>
                <strong>Write templates in a plain text editor.</strong> Word processors and some notes apps swap straight quotes for curly ones. Twilio points out that{" "}
                <a href={UCS} rel="noopener">
                  smart quotes and non-standard spaces
                </a>{" "}
                are a common cause.
              </li>
              <li>
                <strong>Check before a big send.</strong> Paste the final text, with sample names filled in, into a checker. A long name or an accented one can push a message over the limit.
              </li>
              <li>
                <strong>Turn on Smart Encoding.</strong> If you use a{" "}
                <a href="https://www.twilio.com/docs/messaging/services" rel="noopener">
                  Messaging Service
                </a>
                , this Content Settings option replaces lookalikes such as curly quotes with GSM characters. It{" "}
                <a href="https://www.twilio.com/docs/messaging/services/smart-encoding-char-list" rel="noopener">
                  doesn&apos;t change emoji
                </a>{" "}
                or scripts like Korean.
              </li>
              <li>
                <strong>Read <code>num_segments</code> on a test message.</strong> Twilio&apos;s API reports the real count after sending. It starts at 0 on a Messaging Service, since no sender has been picked yet, so check it again afterwards.
              </li>
              <li>
                <strong>Keep it short anyway.</strong> Twilio recommends staying under 320 characters, and the body limit is 1,600 (<Link href="/twilio-errors/21617">error 21617</Link>).
              </li>
            </ol>
            <Callout type="info" title="UCS-2 isn't a mistake">
              <p>
                If your customers read Arabic, Hindi, Chinese or Vietnamese, UCS-2 is the right encoding and worth paying for. Write in their language and budget for the extra segments.
                The aim is to avoid paying for characters you never meant to use.
              </p>
            </Callout>

            <h2 id="faq">Questions</h2>
            <Faq items={faq} />
          </Prose>
        </div>
      </Container>
      <RelatedLinks path={path} />
      <CtaBand
        title="Spot the costly character early"
        text="Dialbubble is a free iPhone app for sending texts through your own Twilio account at Twilio's normal rates, with no markup. Reuse checked wording with templates, and try it all first in Demo Mode."
      />
    </>
  );
}

import Link from "next/link";
import { ToolShell } from "@/components/ToolShell";
import { metaFor } from "@/lib/registry";
import { JsonLd, howToLd } from "@/lib/seo";
import { ToolCta } from "../_components/ToolCta";
import { Calculator } from "./Calculator";

const path = "/tools/sms-segment-calculator";
export const metadata = metaFor(path);

const faq = [
  {
    q: "How many characters are in one SMS segment?",
    a: "160 characters in GSM-7 and 70 in UCS-2 when the message fits in a single segment. Once a message has to split, each segment holds 153 GSM-7 characters or 67 UCS-2 code units, because part of each segment carries the header that lets the phone join them back together.",
  },
  {
    q: "Why does my 100-character message count as two segments?",
    a: "It almost certainly contains a character outside GSM-7, such as a curly apostrophe pasted from a word processor or an emoji. That one character sends the whole message as UCS-2, where the limit drops to 70. Paste it above, and the tool marks the character responsible.",
  },
  {
    q: "How many segments does an emoji use?",
    a: "An emoji doesn't use segments by itself, but it does switch the message to UCS-2 and usually costs two code units. Flags cost four. Joined emoji such as a family cost more, since each person and joiner counts. So 35 simple emoji fit in one segment, and the 36th starts a second.",
  },
  {
    q: "Does the euro sign count as two characters?",
    a: "Yes, in GSM-7. The euro sign and the characters ^ { } \\ [ ] ~ and | live in the extension table, so each one takes two characters' worth of space: an escape code and the character itself. In a UCS-2 message, they count as one like anything else.",
  },
  {
    q: "What's the maximum length of a Twilio SMS?",
    a: "Twilio documents a limit of 1,600 characters for a message body. Long messages still bill for every segment, and this tool warns you past that limit. Twilio's glossary shows a lower figure of 700 for UCS-2 messages in one table, so keep Unicode messages well under 1,600.",
  },
  {
    q: "Do I pay per message or per segment?",
    a: "Per segment. A message that splits into three segments costs three times the per-segment price, and the same goes for each recipient. Received messages are billed by segment too.",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={howToLd({
          name: "Count the SMS segments in a message",
          description: "Find out how many segments a text will use, which encoding it needs and how to make it cheaper.",
          path,
          steps: [
            { name: "Paste your message", text: "Type or paste the text exactly as you plan to send it." },
            { name: "Read the count", text: "See the segment count, the encoding, and how the message splits." },
            { name: "Fix what forces UCS-2", text: "Use the buttons to replace smart punctuation or remove emoji, and watch the count drop." },
            { name: "Estimate the price", text: "Enter your price per segment and the number of recipients to see the cost." },
          ],
        })}
      />
      <ToolShell
        path={path}
        title="SMS segment calculator"
        intro="Paste a message to see exactly how many segments it uses, whether it sends as GSM-7 or UCS-2, and which character is costing you extra. It runs in your browser, so your message stays with you."
        faq={faq}
        seo={
          <>
            <h2 id="what-is-a-segment">What is an SMS segment?</h2>
            <p>
              An SMS segment is the unit carriers actually send and Twilio actually bills. A single SMS can carry only 140 bytes, so a longer message is cut into pieces that your recipient&apos;s phone stitches back together. It usually looks like one message on the screen, but on your bill it&apos;s several. If you want the full background, read our guide to <Link href="/guides/gsm-7-vs-ucs-2-sms-encoding">GSM-7 and UCS-2 encoding</Link>.
            </p>

            <h2 id="how-it-works">How this SMS character counter works</h2>
            <p>The calculator follows the same steps as the network.</p>
            <ol>
              <li>
                <strong>It picks the encoding.</strong> If every character is in the GSM 03.38 alphabet, the message goes as GSM-7, at 7 bits a character. If even one isn&apos;t, the whole message goes as UCS-2, at 16 bits a code unit. You can browse the alphabet in the <Link href="/tools/gsm-7-character-checker">GSM-7 character checker</Link>.
              </li>
              <li>
                <strong>It counts units.</strong> A normal GSM-7 character is one unit. The ten characters in the extension table, including the euro sign and square brackets, are two. In UCS-2, most characters are one unit and those outside the basic plane, such as most emoji, are two.
              </li>
              <li>
                <strong>It decides whether the message splits.</strong> Up to 160 GSM-7 units or 70 UCS-2 units fit in one segment. Beyond that, each segment holds 153 or 67, since each one now carries a header.
              </li>
              <li>
                <strong>It packs the segments.</strong> A character is never cut in half. If an emoji&apos;s two units or a euro&apos;s escape sequence would straddle the boundary, the whole character moves to the next segment and the previous one is left a unit short.
              </li>
            </ol>
            <p>
              That last step is why simple division can be wrong. A GSM-7 message of 306 units looks like exactly two segments, but if a euro sign lands on the boundary, it needs three. The bars under each bubble above show how full each segment is, so you can see this happen as you type.
            </p>

            <h2 id="worked-example">Worked example: one apostrophe, three times the price</h2>
            <p>
              Take the message that&apos;s loaded above when you open this page. It&apos;s a 137-character appointment reminder with one curly apostrophe in &ldquo;it&apos;s&rdquo;, which word processors and phone keyboards add automatically. The curly apostrophe isn&apos;t in GSM-7, so the message goes as UCS-2. At 67 units per segment, 137 units take <strong>three segments</strong>: 67, 67 and 3.
            </p>
            <p>
              Press &ldquo;Replace smart punctuation&rdquo; and it becomes a straight apostrophe. Now the message is GSM-7, and 137 is under the 160 limit, so it fits in <strong>one segment</strong>. Sent to 1,000 US recipients at the $0.0083 list price with a $0.0045 carrier fee, that one character is the difference between $38.40 and $12.80. You can put those numbers in the <Link href="/tools/twilio-pricing-calculator">Twilio pricing calculator</Link> to see the effect on a whole month.
            </p>

            <h2 id="toll-free">Do toll-free numbers have different limits?</h2>
            <p>
              Slightly. <a href="https://www.twilio.com/docs/glossary/what-sms-character-limit" rel="noopener">Twilio&apos;s glossary</a> says that multi-segment messages sent from toll-free numbers to the US or Canada hold 152 GSM-7 characters or 66 UCS-2 characters per segment. The single-segment limits don&apos;t change. Tick the toll-free box above to use those numbers.
            </p>

            <h2 id="how-to-reduce">How to reduce your SMS segments</h2>
            <ul>
              <li>Paste from a plain text editor, or use the replace button, so smart quotes, long dashes and ellipses don&apos;t slip in.</li>
              <li>Use emoji only where they earn their cost. One emoji can take a message from a 160 limit to a 70 limit.</li>
              <li>Watch out for accented letters. Some, such as é and ñ, are in GSM-7, while others, such as á and ç, aren&apos;t. The tool can remove accents, but check the result still reads correctly.</li>
              <li>Avoid square brackets, curly braces and the euro sign when you&apos;re close to a limit, since each counts double.</li>
              <li>Shorten links and sign-offs. They&apos;re often the easiest place to find spare characters.</li>
            </ul>
            <p>
              Long messages can also be filtered more often by carriers. If a text isn&apos;t arriving, our guide to <Link href="/guides/fix-twilio-error-30007">fixing Twilio error 30007</Link> covers carrier filtering, and <Link href="/guides/how-does-twilio-sms-work">how Twilio SMS works</Link> explains the rest of the path a message takes.
            </p>
          </>
        }
      >
        <Calculator />
        <ToolCta
          title="See the segment count before you press send"
          text="Dialbubble's composer shows you how many segments a text will use while you type it, whichever Twilio number you send from. Try it in Demo Mode, with no Twilio account."
          linkHref="/features"
          linkText="See how Dialbubble handles texting"
        />
      </ToolShell>
    </>
  );
}

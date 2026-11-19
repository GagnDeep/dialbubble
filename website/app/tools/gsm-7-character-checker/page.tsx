import Link from "next/link";
import { ToolShell } from "@/components/ToolShell";
import { metaFor } from "@/lib/registry";
import { JsonLd, howToLd } from "@/lib/seo";
import { ToolCta } from "../_components/ToolCta";
import { Checker } from "./Checker";

const path = "/tools/gsm-7-character-checker";
export const metadata = metaFor(path);

const faq = [
  {
    q: "What are GSM characters?",
    a: "GSM characters are the set a standard text message can send at 7 bits each. The GSM 03.38 default alphabet has 128 positions covering English letters, digits, common punctuation, some accented letters and a few Greek capitals. Ten more characters are available through an extension table.",
  },
  {
    q: "Is an apostrophe a GSM-7 character?",
    a: "The straight apostrophe (') is. The curly apostrophe (’) that phones and word processors insert isn't, and it's the most common reason a plain-looking message sends as UCS-2. The two look nearly the same, which is why a checker helps.",
  },
  {
    q: "Are emoji GSM-7 characters?",
    a: "No. Every emoji is outside GSM-7, so one emoji sends the entire message as UCS-2. That cuts a single segment from 160 characters to 70.",
  },
  {
    q: "Which currency symbols are in GSM-7?",
    a: "The default alphabet has the dollar, pound and yen signs, plus the generic currency sign. The euro is in the extension table, so it counts as two characters. Others, such as the cent sign and the rupee sign, aren't in GSM-7 at all, so one of them sends the message as UCS-2.",
  },
  {
    q: "Are lowercase Greek letters in GSM-7?",
    a: "No. The alphabet has only the Greek capitals that don't look like Latin letters, such as Δ, Φ and Ω. Lowercase Greek letters send the message as UCS-2.",
  },
  {
    q: "Does replacing smart punctuation change what the reader sees?",
    a: "Only slightly. Curly quotes become straight ones, long dashes become hyphens, and an ellipsis becomes three dots. Letters and emoji aren't touched, so the meaning stays the same. Read the result before you send it, since three dots do use three characters rather than one.",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={howToLd({
          name: "Check a message for non-GSM characters",
          description: "Find the characters that force an SMS into UCS-2, and replace smart punctuation with one click.",
          path,
          steps: [
            { name: "Paste your text", text: "Paste the message into the box." },
            { name: "Read the highlights", text: "Characters outside GSM-7 are marked in the text and listed with their code points." },
            { name: "Replace smart punctuation", text: "Press the replace button to swap curly quotes, long dashes and ellipses for GSM-7 equivalents." },
            { name: "Copy the clean text", text: "Copy the result into your message template." },
          ],
        })}
      />
      <ToolShell
        path={path}
        title="GSM-7 character checker"
        intro="Paste a message to find the characters that aren't in GSM-7, replace smart punctuation with one click, and browse the full GSM 03.38 table. Everything runs in your browser."
        faq={faq}
        seo={
          <>
            <h2 id="what-is-gsm-7">What is GSM-7?</h2>
            <p>
              GSM-7 is the default character set for text messages. It fits each character into 7 bits, which is how 160 characters fit in a single SMS. The set is defined in a standard known as GSM 03.38, now maintained as 3GPP TS 23.038. It&apos;s far smaller than the set of characters your keyboard can type, and that gap is what catches people out.
            </p>
            <p>
              A character outside the set can&apos;t be sent in GSM-7, so the phone network switches the entire message to UCS-2, a 16-bit encoding. There&apos;s no mixing within a message. One odd character changes the limit for all the others, from 160 to 70. The practical effect on your bill is covered in the <Link href="/tools/sms-segment-calculator">SMS segment calculator</Link> and our guide to <Link href="/guides/gsm-7-vs-ucs-2-sms-encoding">GSM-7 vs UCS-2</Link>.
            </p>

            <h2 id="how-to-read-the-table">How to read the GSM 03.38 table</h2>
            <p>
              The table above has 128 cells, one for each 7-bit value. Read the column and then the row to get a character&apos;s code: the column labeled 4x and the row labeled x1 give 0x41, which is a capital A. Some cells aren&apos;t printable. LF is a line feed, CR is a carriage return, SP is the space and ESC is the escape code at 0x1B.
            </p>
            <p>
              The escape code is the door to the extension table. When a phone reads ESC, it looks up the next value in that second table. This is how the euro sign, square brackets, curly braces, the backslash, the caret, the tilde and the vertical bar get in. It&apos;s also why they count double: they take two 7-bit values, one for ESC and one for the character. The form feed at 0x0A works the same way, though you&apos;ll rarely meet one.
            </p>
            <p>
              The standard also defines national shift tables for languages such as Turkish, Spanish and Portuguese, which swap in other characters. This checker uses only the default alphabet and its default extension table, because those are what a message can count on everywhere.
            </p>

            <h2 id="worked-example">Worked example: a short message that isn&apos;t GSM-7</h2>
            <p>
              The sample above reads like plain English: &ldquo;We&apos;re open today, see you at 10&rdquo;, with a dash and a trailing ellipsis. It has three characters outside GSM-7, all easy to miss: the curly apostrophe (U+2019), the en dash (U+2013) and the single-character ellipsis (U+2026). Each is highlighted in the text and listed below it with what can replace it.
            </p>
            <p>
              Press &ldquo;Replace smart punctuation&rdquo; and they become a straight apostrophe, a hyphen and three dots. This short message fits one segment either way, but the same three characters in a 150-character message would change the result from one segment to three. Long messages and message templates are where this check pays for itself, so run your templates through it once and save the clean versions.
            </p>

            <h2 id="common-culprits">Which characters most often break GSM-7?</h2>
            <ul>
              <li>
                <strong>Smart punctuation.</strong> Curly quotes, en and em dashes, and the ellipsis. Word processors and phone keyboards produce these on their own. The one-click replacement handles all of them.
              </li>
              <li>
                <strong>Invisible characters.</strong> Non-breaking spaces and zero-width spaces come along when you copy from web pages and documents. You can&apos;t see them, but the checker marks them, and the replacement removes or swaps them.
              </li>
              <li>
                <strong>Accented letters.</strong> GSM-7 includes some, such as é, è, ñ, ü and à, but not others, such as á, í, ó, ú and ç. There&apos;s no automatic fix here, because changing a letter can change a word. The <Link href="/tools/sms-segment-calculator">segment calculator</Link> offers an optional button to remove accents.
              </li>
              <li>
                <strong>Emoji and symbols.</strong> These have no GSM-7 form at all. Decide whether each is worth the shorter limit.
              </li>
              <li>
                <strong>Backticks.</strong> A ` isn&apos;t in GSM-7, even though it sits on most keyboards. The replacement swaps it for a straight apostrophe.
              </li>
            </ul>
            <p>
              If you&apos;re new to sending texts through Twilio, <Link href="/guides/how-does-twilio-sms-work">how Twilio SMS works</Link> explains how encoding fits in with the rest of the process, and the <Link href="/tools/twilio-pricing-calculator">pricing calculator</Link> shows what segments mean for your bill.
            </p>
          </>
        }
      >
        <Checker />
        <ToolCta
          title="Save your clean text as a template"
          text="Once a message is GSM-7, keep it that way. Dialbubble stores message templates on your iPhone and sends them from your own Twilio number, and Demo Mode lets you try this with no account."
          linkHref="/features"
          linkText="See templates and broadcast in Dialbubble"
        />
      </ToolShell>
    </>
  );
}

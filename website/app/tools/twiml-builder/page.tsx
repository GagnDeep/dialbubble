import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { ToolShell } from "@/components/ToolShell";
import { metaFor } from "@/lib/registry";
import { JsonLd, howToLd } from "@/lib/seo";
import { ToolCta } from "../_components/ToolCta";
import { Builder } from "./Builder";

const path = "/tools/twiml-builder";
export const metadata = metaFor(path);

const faq = [
  {
    q: "What is TwiML?",
    a: "TwiML is the XML that tells Twilio what to do on a call. A document has one Response element containing verbs such as Say, Play, Gather and Dial, and Twilio runs them from top to bottom. When it reaches the end, the call hangs up.",
  },
  {
    q: "What's the TwiML character limit?",
    a: "Twilio's Calls API takes at most 4,000 characters in its Twiml parameter, so inline TwiML has to fit that. TwiML served from a URL isn't subject to that parameter limit. Say has its own limits, depending on the voice: 3,000 characters for Amazon Polly, and 5,000 for Google and ElevenLabs voices.",
  },
  {
    q: "Does this tool test my TwiML on a real call?",
    a: "No. It checks the XML and compares verbs, attributes and allowed values with Twilio's docs, all in your browser. It can't tell whether a URL works or whether your account may use a caller ID. Place a test call before relying on it.",
  },
  {
    q: "Which verbs can go inside Gather?",
    a: "Say, Play and Pause. Anything else inside Gather is invalid, and Twilio also doesn't allow the digits attribute on a Play inside Gather. If you need to dial after a key press, do it in the TwiML at the action URL, which is what the press a key template does.",
  },
  {
    q: "What's the Echo Twimlet?",
    a: "It's a small service from Twilio Labs, at twimlets.com/echo, that returns whatever TwiML you put in its Twiml query parameter. It lets you have a follow-up step, such as the action of a Gather, without running a server. The TwiML sits in the URL, so don't put anything secret in it.",
  },
  {
    q: "Do I have to include the XML declaration?",
    a: "No. Twilio's examples include it, and the readable output here does too, but the one-line output leaves it out to save characters. What matters is that the root element is Response, since Twilio treats any other structure as invalid.",
  },
];

const bridge = `<Response>
  <Gather numDigits="1" timeout="8" method="GET"
          action="https://twimlets.com/echo?Twiml=...encoded TwiML...">
    <Say loop="2">Press any key to connect.</Say>
  </Gather>
  <Say>No key pressed, so the call was cancelled. Goodbye.</Say>
  <Hangup/>
</Response>`;

export default function Page() {
  return (
    <>
      <JsonLd
        data={howToLd({
          name: "Build TwiML without writing XML",
          description: "Create a valid TwiML document with a visual builder and copy it into a TwiML Bin or your app.",
          path,
          steps: [
            { name: "Start from a template", text: "Pick a template such as press a key to connect, or start with an empty list." },
            { name: "Add and order verbs", text: "Add Say, Play, Pause, Gather, Dial, Record, Redirect and Hangup, then move them into place." },
            { name: "Set the options", text: "Fill in text, URLs and attributes. The output and its validation update as you type." },
            { name: "Copy the TwiML", text: "Copy the readable version for a TwiML Bin, or the one-line version for the Calls API." },
          ],
        })}
      />
      <ToolShell
        path={path}
        title="TwiML builder and validator"
        intro="Build TwiML visually, see escaped XML update as you type, and paste existing TwiML to find mistakes with line numbers. It all runs in your browser, and nothing is sent to Twilio or to us."
        faq={faq}
        seo={
          <>
            <h2 id="what-it-does">What does this TwiML builder do?</h2>
            <p>
              It writes the XML for you. Add verbs from the list, reorder them with the arrows, and fill in their options. Every attribute comes with its allowed values and defaults, taken from Twilio&apos;s docs for each verb, so you don&apos;t have to keep a tab open. For more patterns to adapt, see our <Link href="/guides/twiml-examples">TwiML examples guide</Link>.
            </p>
            <p>
              The builder handles the fiddly parts. Text and attribute values are XML-escaped, so an ampersand in a company name won&apos;t break the document. Gather accepts nested Say, Play and Pause. Dial takes nested Number blocks, with extension digits and answering machine detection under More options. The counter shows how much of the 4,000-character inline limit you&apos;ve used.
            </p>

            <h2 id="validator">How the TwiML validator checks your document</h2>
            <p>
              Paste a document in the checker at the bottom of the tool. A small parser written for this page reads it with no network access and no browser XML engine, so it can give you line numbers and plain explanations rather than a generic parse error. It catches:
            </p>
            <ul>
              <li>Broken XML, such as mismatched tags, missing quotes and a raw &amp; that should be &amp;amp;.</li>
              <li>A root element other than Response, and text placed directly inside Response.</li>
              <li>Wrong capitalization, since TwiML is case-sensitive: numdigits fails, and numDigits works.</li>
              <li>Attributes a verb doesn&apos;t have, and values it doesn&apos;t allow, such as a Dial timeout outside 5 to 600.</li>
              <li>Verbs in the wrong place, such as Dial inside Gather or Number outside Dial.</li>
              <li>Phone numbers that aren&apos;t in E.164. The <Link href="/tools/e164-phone-number-formatter">E.164 formatter</Link> fixes those in bulk.</li>
              <li>Verbs that can never run, because they come after Hangup, Redirect or a Dial with an action.</li>
              <li>A Say over its voice&apos;s character limit, and a document over the 4,000-character inline limit.</li>
            </ul>
            <p>
              Verbs beyond the ones the builder edits, such as Connect, Enqueue, Pay and Reject, are accepted with a note, and their attributes aren&apos;t checked. Press &ldquo;Load into the builder&rdquo; to keep editing what you pasted.
            </p>

            <h2 id="worked-example">Worked example: press a key to connect, with no server</h2>
            <p>
              A problem with click-to-call is that a voicemail or call screener can answer your phone and trigger the second call, leaving the other person connected to nothing. The fix is to ask for a key press first, since a voicemail box won&apos;t press one. The difficulty is that Gather sends its result to a URL, which usually means running a server.
            </p>
            <p>The &ldquo;Press a key to connect&rdquo; template gets around that with the Echo Twimlet. The call starts with this TwiML:</p>
            <CodeBlock title="First document" language="xml" code={bridge} />
            <p>
              When a key is pressed, Twilio requests the action URL. The Echo Twimlet returns the TwiML encoded inside it, which says &ldquo;Connecting&rdquo; and dials the other person. If nobody presses a key within 8 seconds, Twilio falls through to the goodbye message and hangs up, and the second call is never made.
            </p>
            <p>
              Because the second document is percent-encoded into a URL, it&apos;s hard to edit by hand. The builder shows a decoded version below the action field, so change the caller ID and number there and the URL updates. The template comes to about 540 characters on one line, well inside the inline limit. Keep in mind that this call bills as two legs, which the <Link href="/tools/twilio-pricing-calculator">Twilio pricing calculator</Link> can show you. This is the same approach Dialbubble uses for <Link href="/how-it-works#talk">its Talk calls</Link>.
            </p>

            <h2 id="where-to-use">Where do you use the TwiML once it&apos;s built?</h2>
            <p>
              Paste the readable version into a TwiML Bin in the Twilio Console, or return it from your own web server with an XML content type. Use the one-line version for the Twiml parameter when you create a call through the API. To forward calls to your cell phone with this tool&apos;s Dial template, see <Link href="/guides/twilio-call-forwarding">Twilio call forwarding</Link>. For recording options, <Link href="/guides/twilio-call-recording-guide">the call recording guide</Link> goes further. You can also find what a failed call&apos;s error code means in our list of <Link href="/twilio-errors">Twilio errors</Link>.
            </p>
          </>
        }
      >
        <Builder />
        <ToolCta
          title="Run your TwiML from your iPhone"
          text="Dialbubble has a Custom TwiML call type: paste what you built here and place the call from your Twilio number, with no server. Try it in Demo Mode first, with no Twilio account."
          linkHref="/features"
          linkText="See Dialbubble's call types"
        />
      </ToolShell>
    </>
  );
}

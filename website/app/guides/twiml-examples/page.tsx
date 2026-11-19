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

const path = "/guides/twiml-examples";
export const metadata = metaFor(path, { type: "article" });

const head = `<?xml version="1.0" encoding="UTF-8"?>`;

const say = `${head}
<Response>
  <Say voice="Polly.Joanna-Generative" language="en-US">Your table is ready. Please come to the front desk.</Say>
  <Pause length="1"/>
  <Say>Again, your table is ready.</Say>
  <Hangup/>
</Response>`;

const play = `${head}
<Response>
  <Play loop="2">https://example.com/audio/store-closed.mp3</Play>
</Response>`;

const dial = `${head}
<Response>
  <Dial timeout="20">+14155550111</Dial>
  <Say>Sorry, nobody could take your call.</Say>
</Response>`;

const ring = `${head}
<Response>
  <Dial timeout="20">
    <Number>+14155550111</Number>
    <Number>+14155550177</Number>
  </Dial>
</Response>`;

const menu = `${head}
<Response>
  <Gather numDigits="1" timeout="6" action="https://example.com/menu" method="POST">
    <Say>For opening hours, press 1. To reach a person, press 2.</Say>
  </Gather>
  <Say>We didn't get a choice. Goodbye.</Say>
</Response>`;

const menuReply = `${head}
<Response>
  <Say>We are open nine to five, Monday to Friday.</Say>
</Response>`;

const voicemail = `${head}
<Response>
  <Say>Please leave a message after the beep. Press pound when you are done.</Say>
  <Record maxLength="120" finishOnKey="#" action="https://example.com/thanks" method="POST"/>
  <Say>We did not get a recording. Goodbye.</Say>
</Response>`;

const reject = `${head}
<Response>
  <Reject reason="busy"/>
</Response>`;

const sms = `${head}
<Response>
  <Message>Thanks for your text. We reply within one working day.</Message>
</Response>`;

const template = `${head}
<Response>
  <Message>Hello {{From}}, you wrote: {{Body}}</Message>
</Response>`;

const redirect = `${head}
<Response>
  <Say>Thanks for calling.</Say>
  <Redirect method="POST">https://example.com/next-step</Redirect>
</Response>`;

export default function Page() {
  const entry = getEntry(path)!;
  return (
    <>
      <JsonLd data={articleLd({ title: entry.title, description: entry.description, path, published: entry.published! })} />
      <Breadcrumbs path={path} />
      <PageHero
        eyebrow="Guide"
        title={entry.title}
        lede="TwiML is the short XML that tells Twilio what to do on a call or text, such as say this, dial that number, or record a message. Below are working examples for each common job, and you can run them in a Twilio-hosted TwiML Bin without a server."
      />
      <Container>
        <div className="toc-layout">
          <TocSidebar
            items={[
              { id: "format", title: "The format" },
              { id: "run", title: "Where to put it" },
              { id: "message", title: "Speak a message" },
              { id: "audio", title: "Play audio" },
              { id: "forward", title: "Forward a call" },
              { id: "menu", title: "Phone menu" },
              { id: "voicemail", title: "Voicemail" },
              { id: "block", title: "Reject a call" },
              { id: "sms", title: "Auto-reply to texts" },
              { id: "redirect", title: "Hand off with Redirect" },
              { id: "trial", title: "Trial limits" },
              { id: "errors", title: "Errors to watch for" },
              { id: "faq", title: "Questions" },
            ]}
          />
          <Prose>
            <h2 id="format">What is the TwiML format?</h2>
            <p>
              A TwiML document has one root element, <code>&lt;Response&gt;</code>, with verbs inside it that Twilio runs from top to bottom. Twilio&apos;s <a href="https://www.twilio.com/docs/voice/twiml" rel="noopener">TwiML docs</a> note that verb and attribute names are case sensitive, so <code>&lt;Say&gt;</code> works and <code>&lt;say&gt;</code> doesn&apos;t. Every example here has been written against the current verb docs, and uses example numbers and URLs that you&apos;ll need to replace.
            </p>

            <h2 id="run">Where do you put TwiML?</h2>
            <p>
              The easiest place is a <a href="https://www.twilio.com/docs/serverless/twiml-bins/getting-started" rel="noopener">TwiML Bin</a>, which Twilio hosts for you. Create one under Developer tools in the Console, paste the XML and save. Then open your number&apos;s configuration, find &quot;A call comes in&quot; under Voice, choose TwiML and select your Bin. Text replies go in the matching messaging setting.
            </p>
            <p>
              You can also send TwiML with an outgoing call, using the <code>Twiml</code> parameter of the <a href="https://www.twilio.com/docs/voice/api/call-resource" rel="noopener">Calls API</a>, which has a 4,000-character limit. Dialbubble&apos;s Custom TwiML call mode uses this approach. Note that any <code>action</code> URL must be absolute when you do this. If you&apos;d rather not write XML by hand, our <Link href="/tools/twiml-builder">TwiML builder</Link> assembles it in your browser.
            </p>

            <h2 id="message">Example: read a voice message</h2>
            <p>
              <code>&lt;Say&gt;</code> turns text into speech. The <code>voice</code> and <code>language</code> attributes are optional, and if you leave out <code>voice</code>, your account&apos;s text-to-speech default applies. <code>&lt;Pause&gt;</code> waits for the number of seconds you set, and <code>&lt;Hangup&gt;</code> ends the call.
            </p>
            <CodeBlock title="Read a message aloud" code={say} />
            <Callout type="cost" title="What 200 reminder calls cost">
              <p>
                Twilio <a href="https://www.twilio.com/docs/voice/api/call-resource" rel="noopener">bills calls by the minute</a>, so count a 30-second reminder as one minute. At <a href="https://www.twilio.com/en-us/voice/pricing/us" rel="noopener">$0.0140 per minute for US outbound, as of November 2026</a>, 200 answered calls come to 200 × 1 × $0.0140 = $2.80. Calls that go unanswered aren&apos;t charged, but a voicemail that picks up is.
              </p>
            </Callout>

            <h2 id="audio">Example: play an audio file</h2>
            <p>
              <code>&lt;Play&gt;</code> fetches an audio file from a public URL and plays it. <code>loop</code> sets how many times. A value of <code>0</code> repeats until the caller hangs up or 1,000 plays are done, so be careful with it, because you pay for those minutes.
            </p>
            <CodeBlock title="Play an MP3 twice" code={play} />

            <h2 id="forward">Example: forward a call with Twilio Dial</h2>
            <p>
              <code>&lt;Dial&gt;</code> connects the caller to another number. <code>timeout</code> sets how long it rings, with a default of 30 seconds and a minimum of 5. Twilio adds about 5 seconds on top. When the dial finishes without an <code>action</code>, Twilio moves to the next verb, so the <code>&lt;Say&gt;</code> plays if nobody answers.
            </p>
            <CodeBlock title="Forward to one number" code={dial} />
            <p>
              To ring several phones at once, nest up to ten <code>&lt;Number&gt;</code> nouns. The first to answer wins and the others stop ringing.
            </p>
            <CodeBlock title="Ring two phones together" code={ring} />
            <p>
              Caller ID, voicemail fallback and cost all need more detail than fits here, so see <Link href="/guides/twilio-call-forwarding">how to set up Twilio call forwarding</Link>. Forwarded calls bill two legs.
            </p>

            <h2 id="menu">Example: a phone menu with Gather</h2>
            <p>
              <code>&lt;Gather&gt;</code> collects keypad presses or speech. Here it plays the menu, waits up to 6 seconds for one digit, and posts the result to your <code>action</code> URL as a <code>Digits</code> parameter. Without an <code>action</code>, Twilio requests the same document again, which usually means a loop.
            </p>
            <CodeBlock title="Menu with one digit" code={menu} />
            <p>
              Your URL needs to answer with the next piece of TwiML, such as this one for digit 1:
            </p>
            <CodeBlock title="Reply when the caller presses 1" code={menuReply} />
            <p>
              A Bin can&apos;t choose between replies, because Twilio describes Bin templates as logic-less by design. For real branching on <code>Digits</code>, use your own server, a <a href="https://www.twilio.com/docs/serverless/functions-assets/functions" rel="noopener">Twilio Function</a> or <a href="https://www.twilio.com/docs/studio" rel="noopener">Twilio Studio</a>.
            </p>

            <h2 id="voicemail">Example: voicemail with Record</h2>
            <p>
              <code>&lt;Record&gt;</code> captures the caller and then requests your <code>action</code> URL with a <code>RecordingUrl</code> parameter. By default it stops after 5 seconds of silence and allows up to an hour, so set <code>maxLength</code> to something sensible. The <code>action</code> matters because without one, Twilio re-requests the same document and the caller goes around again.
            </p>
            <CodeBlock title="Take a two-minute message" code={voicemail} />
            <p>
              Recording adds its own charges and legal duties. Read about <Link href="/guides/twilio-call-recording-guide">Twilio call recording cost and consent</Link> first.
            </p>

            <h2 id="block">Example: reject a call without being billed</h2>
            <p>
              Twilio&apos;s <a href="https://www.twilio.com/docs/voice/twiml/reject" rel="noopener">Reject docs</a> say that using <code>&lt;Reject&gt;</code> as the first verb is the only way to stop Twilio answering a call, and that any other response is an answered, billed call. Use <code>reason=&quot;busy&quot;</code> for a busy signal, or leave it out for the default not-in-service response.
            </p>
            <CodeBlock title="Send a busy signal" code={reject} />

            <h2 id="sms">Example: auto-reply to a text</h2>
            <p>
              <code>&lt;Message&gt;</code> sends a text back. Put this in a Bin and attach it to your number&apos;s incoming message setting.
            </p>
            <CodeBlock title="Fixed auto-reply" code={sms} />
            <p>
              Bins can also fill in values from Twilio&apos;s request, using double braces:
            </p>
            <CodeBlock title="Template that echoes the sender" code={template} />
            <p>
              Replies are normal billable messages. US long-code numbers need <Link href="/guides/a2p-10dlc-registration-guide">A2P 10DLC registration</Link> before they can reliably send, and <Link href="/guides/how-does-twilio-sms-work">how Twilio SMS works</Link> explains the rest of the path.
            </p>

            <h2 id="redirect">Example: hand off to another document</h2>
            <p>
              <code>&lt;Redirect&gt;</code> tells Twilio to fetch a different TwiML document and carry on from there. It&apos;s a tidy way to reuse a greeting across several numbers, or to chain Bins together, since every Bin has its own URL. Any verbs after it are ignored, so make it the last thing in the document.
            </p>
            <CodeBlock title="Say hello, then move on" code={redirect} />

            <h2 id="trial">What TwiML works on a trial account?</h2>
            <p>
              Less than you might expect. Twilio&apos;s <a href="https://www.twilio.com/docs/usage/trials/try-out-voice" rel="noopener">trial docs</a> list <code>&lt;Record&gt;</code>, <code>&lt;Start&gt;&lt;Recording&gt;</code> and <code>&lt;Dial&gt;&lt;Number&gt;</code> among the blocked verbs, and replace each with a spoken message saying it isn&apos;t available. That means the forwarding and voicemail examples above need an upgraded account. <code>&lt;Say&gt;</code>, <code>&lt;Gather&gt;</code> and <code>&lt;Play&gt;</code> are supported with some limits, and <code>&lt;Pause&gt;</code>, <code>&lt;Hangup&gt;</code> and <code>&lt;Reject&gt;</code> pass through unchanged. If an example here speaks a surprising message on a trial, that&apos;s the likely reason.
            </p>

            <h2 id="errors">Which TwiML errors should you watch for?</h2>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Common TwiML errors">
              <table>
                <thead>
                  <tr>
                    <th>Error</th>
                    <th>Usual cause</th>
                    <th>Fix</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><Link href="/twilio-errors/12100">12100</Link> Document parse failure</td>
                    <td>Unclosed tag, unquoted attribute, or a raw <code>&amp;</code></td>
                    <td>Write <code>&amp;amp;</code> for an ampersand, and leave nothing before the XML header</td>
                  </tr>
                  <tr>
                    <td><Link href="/twilio-errors/12200">12200</Link> Schema validation warning</td>
                    <td>A misspelled verb, the wrong case, or an unknown attribute</td>
                    <td>Compare the line it names with the verb&apos;s docs</td>
                  </tr>
                  <tr>
                    <td><Link href="/twilio-errors/11200">11200</Link> HTTP retrieval failure</td>
                    <td>Your <code>action</code> or webhook URL returned an error or can&apos;t be reached</td>
                    <td>Open the URL yourself, and make sure it accepts POST</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Also note that a TwiML response can be at most 64 kB, and that the Console&apos;s error logs show the exact line that caused a parse failure or warning, which is usually faster than rereading the XML by eye.
            </p>

            <h2 id="faq">Questions people ask</h2>
            <Faq
              items={[
                {
                  q: "What is a TwiML Bin?",
                  a: "A TwiML Bin is a piece of TwiML that Twilio hosts for you at its own URL. You don't need a server, so it suits fixed replies, simple forwarding and prototypes. It can fill in values from the request, but it can't make real decisions.",
                },
                {
                  q: "Do I need the XML header line?",
                  a: "It's good practice to include it, and Twilio's examples do. If you include it, make sure there's no blank line or space before it, because that's a known cause of error 12100.",
                },
                {
                  q: "Can TwiML start a call by itself?",
                  a: "No. TwiML only says what happens during a call or in reply to a message. Something else has to start the call, such as an API request, an app or someone dialing your number.",
                },
                {
                  q: "Why does my Gather keep repeating?",
                  a: "Probably because there's no action attribute. When the caller enters input and no action is set, Twilio requests the current document again and the menu restarts. Point action at a different URL, and add a verb after the Gather for when nothing is pressed.",
                },
              ]}
            />
          </Prose>
        </div>
      </Container>
      <RelatedLinks path={path} />
      <CtaBand title="Try your TwiML on a real call from your iPhone" text="Dialbubble's Custom TwiML mode has Twilio call a number and run the XML you wrote, using your own account. No server needed." />
    </>
  );
}

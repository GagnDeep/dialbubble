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

const path = "/guides/twilio-call-forwarding";
export const metadata = metaFor(path, { type: "article" });

const VOICE_PRICING = "https://www.twilio.com/en-us/voice/pricing/us";

const steps = [
  { name: "Create a TwiML Bin", text: "In the Twilio Console, open TwiML Bins under Developer tools, create a new Bin and name it." },
  { name: "Paste the forwarding TwiML", text: "Enter a Response with a Dial verb containing the phone number you want calls sent to, in E.164 format, and save." },
  { name: "Attach it to your number", text: "Open your Twilio number's configuration, set A call comes in to TwiML, select your Bin and save." },
  { name: "Test with a real call", text: "Call your Twilio number from another phone and confirm that your destination phone rings." },
];

const basic = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial answerOnBridge="true" timeout="20">+14155550111</Dial>
</Response>`;

const withCallerId = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial answerOnBridge="true" timeout="20" callerId="+14155550199">
    <Number>+14155550111</Number>
  </Dial>
</Response>`;

const twimletUrl = `https://twimlets.com/forward?PhoneNumber=%2B14155550111&Timeout=20&FailUrl=https%3A%2F%2Ftwimlets.com%2Fvoicemail%3FEmail%3Dyou%2540example.com%26Transcribe%3Dfalse`;

const twoPhones = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="20">
    <Number>+14155550111</Number>
    <Number>+14155550177</Number>
  </Dial>
</Response>`;

export default function Page() {
  const entry = getEntry(path)!;
  return (
    <>
      <JsonLd data={howToLd({ name: entry.title, description: entry.description, path, steps })} />
      <Breadcrumbs path={path} />
      <PageHero
        eyebrow="Guide"
        title={entry.title}
        lede="To forward a Twilio number, create a TwiML Bin containing a Dial verb with your destination number, then choose that Bin under A call comes in on your number. It takes a few minutes, needs no code, and each forwarded call bills as two legs."
      />
      <Container>
        <div className="toc-layout">
          <TocSidebar
            items={[
              { id: "setup", title: "Set it up" },
              { id: "cost", title: "What it costs" },
              { id: "callerid", title: "Which caller ID shows" },
              { id: "voicemail", title: "Add voicemail" },
              { id: "more", title: "Ring more than one phone" },
              { id: "fail", title: "When it fails" },
              { id: "faq", title: "Questions" },
            ]}
          />
          <Prose>
            <h2 id="setup">How do you set up call forwarding in Twilio?</h2>
            <p>
              Twilio numbers don&apos;t ring anywhere until you tell them what to do. Here&apos;s how to send calls to your mobile, using +1 415 555 0111 as the destination. You&apos;ll need a voice-capable number. If you don&apos;t have one, see <Link href="/guides/how-to-use-a-twilio-phone-number">how to use a Twilio phone number</Link>.
            </p>
            <ol>
              <li>
                <strong>Create a TwiML Bin.</strong> In the Twilio Console, open TwiML Bins under Developer tools and create a new one. <a href="https://www.twilio.com/docs/serverless/twiml-bins/getting-started" rel="noopener">Twilio&apos;s Bin guide</a> shows the screens. Call it something like &quot;Forward to mobile&quot;.
              </li>
              <li>
                <strong>Paste the forwarding TwiML.</strong> Use the code below with your own number in <Link href="/guides/e164-phone-number-format">E.164 format</Link>, then save.
              </li>
              <li>
                <strong>Attach it to your number.</strong> Open your number&apos;s configuration, find &quot;A call comes in&quot; in the Voice section, choose TwiML, select your Bin and save.
              </li>
              <li>
                <strong>Test with a real call.</strong> Call your Twilio number from a different phone. Your mobile should ring.
              </li>
            </ol>
            <CodeBlock title="Basic forwarding TwiML Bin" code={basic} />
            <Callout type="warning" title="This needs an upgraded account">
              <p>
                Twilio&apos;s <a href="https://www.twilio.com/docs/usage/trials/try-out-voice" rel="noopener">trial docs</a> list <code>&lt;Dial&gt;&lt;Number&gt;</code> as blocked during a trial. Instead of forwarding, the caller hears a message saying the verb isn&apos;t available, so upgrade before you test this with real callers.
              </p>
            </Callout>
            <p>
              <code>timeout=&quot;20&quot;</code> sets how long it rings. Per the <a href="https://www.twilio.com/docs/voice/twiml/dial" rel="noopener">Dial docs</a>, the default is 30 seconds and Twilio adds a buffer of about 5 seconds. <code>answerOnBridge=&quot;true&quot;</code> keeps the caller hearing ringing until the destination answers, as long as <code>&lt;Dial&gt;</code> is the first verb. If you prefer a form, our <Link href="/tools/twiml-builder">TwiML builder</Link> writes this for you, and there are more patterns in the <Link href="/guides/twiml-examples">TwiML examples guide</Link>.
            </p>

            <h2 id="cost">How much does Twilio call forwarding cost?</h2>
            <p>
              A forwarded call has two legs: inbound from the caller to Twilio, and outbound from Twilio to your phone. You pay for both. <a href={VOICE_PRICING} rel="noopener">As of November 2026, Twilio&apos;s US voice prices</a> are $0.0085 a minute inbound to a local number, $0.0220 a minute inbound to a toll-free number, and $0.0140 a minute outbound.
            </p>
            <Callout type="cost" title="A small business's month">
              <p>One 10-minute call to a local number: (10 × $0.0085) + (10 × $0.0140) = $0.085 + $0.14 = $0.225.</p>
              <p>30 calls of 4 minutes: 120 inbound minutes × $0.0085 = $1.02, plus 120 outbound minutes × $0.0140 = $1.68, for $2.70.</p>
              <p>Add the US local number at <a href={VOICE_PRICING} rel="noopener">$1.15 a month</a>: $2.70 + $1.15 = $3.85.</p>
            </Callout>
            <p>
              The same 120 minutes on a toll-free number would be (120 × $0.0220) + (120 × $0.0140) = $4.32, plus $2.15 for the number. A <Link href="/guides/how-much-does-a-twilio-phone-number-cost">full look at Twilio number costs</Link> covers the rest. Your own mobile plan may also count the incoming call, since it arrives like any other. Twilio&apos;s <a href="https://help.twilio.com/articles/223132547" rel="noopener">billing help</a> says that a completed leg is charged, which includes a call your phone&apos;s voicemail picks up, a trap covered next.
            </p>

            <p>
              You can see the two legs yourself. After a test call, open the call logs in the Console and look at the entry. There&apos;s the inbound call to your number and a child call out to your phone, each with its own duration and price. Comparing those to your bill is the quickest way to check the sums above against your own traffic.
            </p>

            <h2 id="callerid">What caller ID shows on a forwarded call?</h2>
            <p>
              By default, your phone shows the original caller&apos;s number. That&apos;s usually what you want. If you&apos;d rather know at a glance that it&apos;s a work call, set <code>callerId</code> to your Twilio number. The trade-off is that you won&apos;t see who&apos;s calling.
            </p>
            <CodeBlock title="Show your Twilio number on your mobile" code={withCallerId} />
            <p>
              The <code>callerId</code> value must be a number you bought from Twilio, one you&apos;ve verified, or the call&apos;s own <code>To</code> or <code>From</code> number. There&apos;s more on those rules in <Link href="/guides/what-is-outbound-caller-id">what outbound caller ID is</Link>.
            </p>

            <h2 id="voicemail">How do you add voicemail to a forward?</h2>
            <p>
              Watch out for one common trap first. If your mobile&apos;s own voicemail answers, Twilio treats the call as completed, and any fallback you set up never runs. Set <code>timeout</code> lower than the time your phone rings before voicemail takes over. Call your own number to time it, and remember the 5-second buffer.
            </p>
            <p>
              For a real fallback without a server, Twilio&apos;s Twimlets are ready-made hosted URLs that return TwiML. Rather than a Bin, choose Webhook under &quot;A call comes in&quot; and paste a URL like this, using your own number and email:
            </p>
            <CodeBlock title="Forward, with email voicemail if nobody answers" code={twimletUrl} />
            <p>
              We tested this URL. It returns a <code>&lt;Dial&gt;</code> with your timeout. When the status comes back as <code>no-answer</code>, it redirects to the voicemail Twimlet, which asks for a message and records it. When the call was completed, it hangs up. The <code>Transcribe=false</code> part matters: the voicemail Twimlet transcribes by default, and transcription costs <a href={VOICE_PRICING} rel="noopener">$0.05 a minute as of November 2026</a>. Recording itself is $0.0025 a minute plus storage.
            </p>
            <p>
              Twimlets are older, simple tools, so for a business-critical line consider <a href="https://www.twilio.com/docs/studio/widget-library/connect-call" rel="noopener">Twilio Studio&apos;s Connect Call widget</a> or a small Function, where you can check <code>DialCallStatus</code> yourself. Taking messages also raises consent questions, which the <Link href="/guides/twilio-call-recording-guide">call recording guide</Link> covers.
            </p>

            <h2 id="more">Can you ring more than one phone?</h2>
            <p>
              Yes. Nest up to ten <code>&lt;Number&gt;</code> nouns and <a href="https://www.twilio.com/docs/voice/twiml/number" rel="noopener">they all ring together</a>. The first to answer is connected, and the others are hung up.
            </p>
            <CodeBlock title="Ring two phones at the same time" code={twoPhones} />

            <h2 id="fail">Why is my Twilio call forward failing?</h2>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Call forwarding problems and fixes">
              <table>
                <thead>
                  <tr>
                    <th>Symptom</th>
                    <th>Likely cause</th>
                    <th>Fix</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Caller hears an application error</td>
                    <td><Link href="/twilio-errors/12100">Error 12100</Link>: XML that won&apos;t parse</td>
                    <td>Check for unclosed tags and raw <code>&amp;</code> characters</td>
                  </tr>
                  <tr>
                    <td>Webhook URL fails</td>
                    <td><Link href="/twilio-errors/11200">Error 11200</Link>: Twilio can&apos;t fetch the URL</td>
                    <td>Open the URL yourself, then check for typos and broken encoding</td>
                  </tr>
                  <tr>
                    <td>Forwarding abroad fails</td>
                    <td><Link href="/twilio-errors/13227">Error 13227</Link>: country not enabled</td>
                    <td>Enable the country in Voice Geo Permissions</td>
                  </tr>
                  <tr>
                    <td>Calls to +1 numbers are blocked</td>
                    <td><Link href="/twilio-errors/13225">Error 13225</Link>: a Primary Customer Profile may be missing</td>
                    <td>Complete and get approval for your profile in Trust Hub</td>
                  </tr>
                  <tr>
                    <td>A voice says the verb isn&apos;t available</td>
                    <td><a href="https://www.twilio.com/docs/usage/trials/try-out-voice" rel="noopener">Twilio blocks <code>&lt;Dial&gt;&lt;Number&gt;</code> on trial accounts</a></td>
                    <td>Upgrade your account, as explained in <Link href="/guides/is-twilio-free-trial-limits">Twilio trial limits</Link></td>
                  </tr>
                  <tr>
                    <td>Your mobile never rings, with no error</td>
                    <td>The number&apos;s setting wasn&apos;t saved, or your phone is blocking the caller</td>
                    <td>Reopen the number&apos;s configuration, then check Twilio&apos;s call logs</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Your iPhone&apos;s Settings don&apos;t come into this. iPhone call forwarding only applies to calls to your carrier number, and it has no effect on your Twilio number, which is set up at Twilio. Dialbubble doesn&apos;t answer incoming calls either, so this forward is how incoming calls to your Twilio number reach you if you use the app for outgoing calls and texts.
            </p>

            <h2 id="faq">Questions people ask</h2>
            <Faq
              items={[
                {
                  q: "Does a forwarded call cost double?",
                  a: "It bills two legs, though they aren't the same price. A US call to a local number is $0.0085 a minute inbound plus $0.0140 a minute outbound, or $0.0225 a minute combined, as of November 2026. Check Twilio's voice pricing page for current rates.",
                },
                {
                  q: "Can a Twilio number forward calls without a server?",
                  a: "Yes. A TwiML Bin or a Twimlet is enough, and Twilio hosts both. You only need your own server, a Function or Studio if you want logic such as office hours.",
                },
                {
                  q: "Can I forward calls to a landline or a number in another country?",
                  a: "Yes, Dial can call any number your account is allowed to reach. For another country, enable it in Voice Geo Permissions first, and check the rate for that destination, which can be much higher than a US call.",
                },
                {
                  q: "Are texts forwarded too?",
                  a: "No. This setup is voice only. Texts to your number follow a separate messaging setting at Twilio.",
                },
                {
                  q: "Why did the call go to my mobile's voicemail?",
                  a: "Your phone answered before Twilio's timeout ended. Lower the timeout value so Twilio gives up first. Remember that Twilio adds about 5 seconds to whatever you set.",
                },
              ]}
            />
          </Prose>
        </div>
      </Container>
      <RelatedLinks path={path} />
      <CtaBand title="Calls forwarded. Now call back from that number" text="Twilio handles incoming calls. Dialbubble handles the other direction, placing calls and sending texts from your Twilio number on your iPhone." />
    </>
  );
}

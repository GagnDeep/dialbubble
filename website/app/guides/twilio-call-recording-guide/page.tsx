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

const path = "/guides/twilio-call-recording-guide";
export const metadata = metaFor(path, { type: "article" });

const VOICE_PRICING = "https://www.twilio.com/en-us/voice/pricing/us";

const apiRecord = `curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Calls.json" \\
  --data-urlencode "To=+14155550123" \\
  --data-urlencode "From=+14155550199" \\
  --data-urlencode "Url=https://example.com/call-instructions" \\
  --data-urlencode "Record=true" \\
  --data-urlencode "RecordingChannels=dual" \\
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"`;

const dialRecord = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>This call may be recorded. If you do not agree, please hang up.</Say>
  <Dial record="record-from-answer-dual" timeout="20">+14155550111</Dial>
</Response>`;

const liveRecord = `curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Calls/CAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Recordings.json" \\
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"`;

const stopRecord = `curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Calls/CAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Recordings/REXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.json" \\
  --data-urlencode "Status=stopped" \\
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"`;

const deleteRecord = `curl -X DELETE "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Recordings/REXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.json" \\
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"`;

export default function Page() {
  const entry = getEntry(path)!;
  return (
    <>
      <JsonLd data={articleLd({ title: entry.title, description: entry.description, path, published: entry.published! })} />
      <Breadcrumbs path={path} />
      <PageHero
        eyebrow="Guide"
        title={entry.title}
        lede="To record a Twilio call, set Record=true on an API call or add a record attribute to Dial in your TwiML. Recording costs $0.0025 a minute plus $0.0005 a minute per month for storage as of November 2026, and many places require you to get consent first."
      />
      <Container>
        <div className="toc-layout">
          <TocSidebar
            items={[
              { id: "consent", title: "Consent comes first" },
              { id: "enable", title: "Ways to turn it on" },
              { id: "outbound", title: "Record an outbound call" },
              { id: "inbound", title: "Record a forwarded call" },
              { id: "cost", title: "What it costs" },
              { id: "storage", title: "Storage and deletion" },
              { id: "faq", title: "Questions" },
            ]}
          />
          <Prose>
            <h2 id="consent">Do you need consent to record a call?</h2>
            <p>
              Often, yes, and the rules differ by location. This section is a high-level overview and not legal advice. Talk to a lawyer about your own situation, especially if you record business calls routinely.
            </p>
            <ul>
              <li>
                <strong>US federal law</strong> generally permits recording if you&apos;re a party to the call or one party has given prior consent, and the recording isn&apos;t for a criminal or tortious purpose. See <a href="https://www.law.cornell.edu/uscode/text/18/2511" rel="noopener">18 U.S.C. § 2511(2)(d)</a>.
              </li>
              <li>
                <strong>Some US states ask for more.</strong> Washington requires <a href="https://app.leg.wa.gov/rcw/default.aspx?cite=9.73.030" rel="noopener">the consent of all participants</a> in a private call. Twilio&apos;s <a href="https://www.twilio.com/docs/voice/api/recording" rel="noopener">recording docs</a> name California&apos;s Invasion of Privacy Act as another law to comply with. Lists of &quot;all-party&quot; states vary between sources, so don&apos;t rely on a chart alone. A call between two states can also raise questions about which law applies.
              </li>
              <li>
                <strong>Outside the US.</strong> Twilio&apos;s <a href="https://support.twilio.com/hc/en-us/articles/360011522553-Legal-Considerations-With-Recording-Voice-and-Video-Communications" rel="noopener">legal considerations article</a> says EU laws also require participants&apos; consent before recording. A recording can also count as personal data, which brings duties about notice and storage.
              </li>
            </ul>
            <p>
              Twilio&apos;s advice is a sensible default: because the laws vary and it&apos;s hard to know where people are, follow the strictest rules and get everyone&apos;s consent. In practice that means:
            </p>
            <ol>
              <li>Announce the recording before it starts, in words people can understand.</li>
              <li>Give people a real way to say no, and respect it.</li>
              <li>Keep a record of how you got consent.</li>
              <li>Say how you use recordings in your privacy notice, and don&apos;t keep what you don&apos;t need.</li>
            </ol>

            <h2 id="enable">How do you enable call recording in Twilio?</h2>
            <p>There&apos;s no single switch. You choose one of these methods per call or per flow.</p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Ways to record calls with Twilio">
              <table>
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Use it for</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>Record=true</code> on the <a href="https://www.twilio.com/docs/voice/api/call-resource" rel="noopener">Calls API</a></td>
                    <td>Outbound calls you start</td>
                    <td>Records the whole call. <code>RecordingChannels</code> sets mono or dual</td>
                  </tr>
                  <tr>
                    <td><code>record</code> on <a href="https://www.twilio.com/docs/voice/twiml/dial" rel="noopener"><code>&lt;Dial&gt;</code></a></td>
                    <td>Forwarded or connected calls</td>
                    <td>Starts from answer or from ringing, in mono or dual</td>
                  </tr>
                  <tr>
                    <td><a href="https://www.twilio.com/docs/voice/twiml/recording" rel="noopener"><code>&lt;Start&gt;&lt;Recording&gt;</code></a></td>
                    <td>Recording alongside other TwiML</td>
                    <td>Recording begins, then the next verb runs</td>
                  </tr>
                  <tr>
                    <td><a href="https://www.twilio.com/docs/voice/api/recording" rel="noopener">Recordings API</a></td>
                    <td>Starting on a live call</td>
                    <td>Can also pause, resume and stop, useful when someone reads out card details</td>
                  </tr>
                  <tr>
                    <td><a href="https://www.twilio.com/docs/voice/twiml/record" rel="noopener"><code>&lt;Record&gt;</code></a></td>
                    <td>Voicemail</td>
                    <td>Captures one caller, not a two-way conversation</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 id="outbound">How do you record an outbound call?</h2>
            <p>
              Add <code>Record=true</code> to the request. The <code>Url</code> points to the TwiML that controls the call, which you can write using our <Link href="/guides/twiml-examples">TwiML examples</Link>. Dual channels put each person on a separate audio channel, which helps with transcription later.
            </p>
            <CodeBlock title="Outbound call with recording (curl)" code={apiRecord} />
            <p>
              Nothing here tells the other person the call is being recorded, so say it yourself at the start: &quot;I&apos;m recording this call, is that OK?&quot; To start on a call already in progress, use its Call SID:
            </p>
            <CodeBlock title="Start recording a live call" code={liveRecord} />
            <p>
              If someone says no, stop right away. The Recordings API accepts a status change on an active recording, so you can end it without ending the call. The status can also be <code>paused</code> or <code>in-progress</code>, if you only want to skip a sensitive part.
            </p>
            <CodeBlock title="Stop a recording when someone objects" code={stopRecord} />
            <p>
              Dialbubble offers recording as an option on its calls, using these same Twilio features. The charges below still apply, and consent is still your job. Test all of this after upgrading, because Twilio&apos;s <a href="https://www.twilio.com/docs/usage/trials/try-out-voice" rel="noopener">trial docs</a> list <code>&lt;Record&gt;</code> and <code>&lt;Start&gt;&lt;Recording&gt;</code> as blocked, and strip recording attributes on the <code>&lt;Dial&gt;</code> calls they allow.
            </p>

            <h2 id="inbound">How do you record a forwarded incoming call?</h2>
            <p>
              Here&apos;s a concrete setup: a landscaping business whose Twilio number <Link href="/guides/twilio-call-forwarding">forwards calls to a mobile</Link>. This TwiML plays a notice to the caller, then rings the mobile and records from the moment it&apos;s answered. Use it as a TwiML Bin on your number.
            </p>
            <CodeBlock title="Announce, forward and record" code={dialRecord} />
            <p>
              <code>record-from-answer-dual</code> skips the ringing, which you probably don&apos;t want to pay for or store. The person who answers doesn&apos;t hear the notice, so they should know that your line is recorded too.
            </p>

            <h2 id="cost">How much does Twilio call recording cost?</h2>
            <p>
              <a href={VOICE_PRICING} rel="noopener">As of November 2026, Twilio&apos;s US voice pricing</a> lists recording at $0.0025 a minute, storage at $0.0005 a minute per month, and transcription at $0.05 a minute. Calls are billed as usual on top. Twilio&apos;s <a href="https://www.twilio.com/en-us/changelog/dual-channel-voice-recordings-by-default" rel="noopener">changelog</a> says dual-channel storage costs the same as mono.
            </p>
            <p>Say that same business records 200 calls of 5 minutes each in a month. That&apos;s 1,000 recorded minutes.</p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Worked recording cost for 1,000 minutes">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Sum</th>
                    <th>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Recording</td>
                    <td>1,000 × $0.0025</td>
                    <td>$2.50</td>
                  </tr>
                  <tr>
                    <td>Storage, first month</td>
                    <td>1,000 × $0.0005</td>
                    <td>$0.50</td>
                  </tr>
                  <tr>
                    <td>Optional transcription</td>
                    <td>1,000 × $0.05</td>
                    <td>$50.00</td>
                  </tr>
                  <tr>
                    <td>The calls, forwarded (two legs)</td>
                    <td>1,000 × ($0.0085 + $0.0140)</td>
                    <td>$22.50</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Without transcription, that&apos;s $25.50 for the first month. Transcription is by far the biggest optional cost, so turn it on deliberately. You can try other volumes in the <Link href="/tools/twilio-pricing-calculator">Twilio pricing calculator</Link>, and <Link href="/guides/how-does-twilio-pricing-work">how Twilio pricing works</Link> explains the call charges.
            </p>
            <Callout type="cost" title="Storage adds up if you never delete">
              <p>
                Keep all 1,000 new minutes every month and you&apos;re storing 1,000 minutes in month one, 2,000 in month two, and 12,000 in month twelve. The first year&apos;s total is (1 + 2 + ... + 12) × 1,000 = 78,000 minute-months, and 78,000 × $0.0005 = $39.00.
              </p>
            </Callout>

            <h2 id="storage">Where are recordings stored, and how do you delete them?</h2>
            <p>
              Recordings stay in your Twilio account, where you can list and download them from the Console or the API. Twilio&apos;s <a href="https://www.twilio.com/docs/voice/api/recording" rel="noopener">docs</a> say two-party recordings are stored as dual-channel by default, and that you can request a mono downmix when you download. A deleted recording&apos;s audio goes away, while its metadata is kept for 40 days.
            </p>
            <CodeBlock title="Delete a recording" code={deleteRecord} />
            <p>
              Set a retention period and stick to it, since each recording is sensitive data. Also, recordings aren&apos;t PCI compliant by default. Twilio&apos;s docs point to separate PCI Mode if you handle card details, and to its encryption and HTTP authentication options for protecting media.
            </p>

            <h2 id="faq">Questions people ask</h2>
            <Faq
              items={[
                {
                  q: "Is it legal to record calls with Twilio?",
                  a: "It can be, but it depends on where everyone on the call is and on who has consented. Twilio makes you responsible for complying. Its own advice is to follow the strictest law that might apply and get everyone's consent. This isn't legal advice, so ask a lawyer about your case.",
                },
                {
                  q: "Does Twilio charge for storing call recordings?",
                  a: "Yes. It's $0.0005 per minute per month in the US as of November 2026, until you delete the recording. Twilio has lower rates above 5 million stored minutes. Check Twilio's voice pricing page for the current numbers.",
                },
                {
                  q: "Can I pause a recording during a call?",
                  a: "Yes. The Recordings API can pause, resume and stop an active recording. That's useful if someone is about to read out sensitive details.",
                },
                {
                  q: "Is a beep enough for consent?",
                  a: "Don't assume so. Rules on what counts as notice or consent vary by place. A clear spoken announcement with the option to refuse is a safer start, and a lawyer can tell you what your situation needs.",
                },
              ]}
            />
          </Prose>
        </div>
      </Container>
      <RelatedLinks path={path} />
      <CtaBand title="Record calls from your iPhone, when you have consent" text="Dialbubble can turn on Twilio recording for your calls and uses your own Twilio account, so you pay Twilio's per-minute rates and no markup." />
    </>
  );
}

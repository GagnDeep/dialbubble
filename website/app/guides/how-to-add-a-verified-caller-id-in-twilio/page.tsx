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

const path = "/guides/how-to-add-a-verified-caller-id-in-twilio";
export const metadata = metaFor(path, { type: "article" });

const steps = [
  { name: "Have the phone next to you", text: "Keep the phone you're verifying nearby and turn off any call screening or silencing of unknown callers." },
  { name: "Open Verified Caller IDs", text: "In the Twilio Console, go to the phone numbers area and open Verified Caller IDs." },
  { name: "Add the number", text: "Choose to add a new caller ID and enter the number in E.164 format, such as +14155550111." },
  { name: "Answer the call and enter the code", text: "Twilio shows a six-digit code and calls the number. Answer and enter the code on the keypad." },
  { name: "Test it", text: "Place a test call with the verified number as the caller ID and confirm what the other phone shows." },
];

const addCurl = `curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/OutgoingCallerIds.json" \\
  --data-urlencode "PhoneNumber=+14155550111" \\
  --data-urlencode "FriendlyName=Office line" \\
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"`;

const extensionCurl = `curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/OutgoingCallerIds.json" \\
  --data-urlencode "PhoneNumber=+14155550111" \\
  --data-urlencode "Extension=204" \\
  --data-urlencode "CallDelay=30" \\
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"`;

export default function Page() {
  const entry = getEntry(path)!;
  return (
    <>
      <JsonLd data={howToLd({ name: entry.title, description: entry.description, path, steps })} />
      <Breadcrumbs path={path} />
      <PageHero
        eyebrow="Guide"
        title={entry.title}
        lede="Add the number under Verified Caller IDs in the Twilio Console, then answer the call Twilio places to it and enter the six-digit code. After that you can show the number as your caller ID on outbound calls, though not on texts."
      />
      <Container>
        <div className="toc-layout">
          <TocSidebar
            items={[
              { id: "what", title: "What it does" },
              { id: "console", title: "Add one in the Console" },
              { id: "api", title: "Add one with the API" },
              { id: "use", title: "Use it on a call" },
              { id: "fail", title: "If verification fails" },
              { id: "limits", title: "What it can't do" },
              { id: "faq", title: "Questions" },
            ]}
          />
          <Prose>
            <h2 id="what">What is a verified caller ID in Twilio?</h2>
            <p>
              It&apos;s a phone number you already own, outside Twilio, that you&apos;ve proven you control. Twilio keeps a list of these on your account, and the <a href="https://www.twilio.com/docs/voice/api/outgoing-caller-ids" rel="noopener">OutgoingCallerIds docs</a> describe them as numbers you can use as caller ID on outgoing calls, through either the API or TwiML <code>&lt;Dial&gt;</code>.
            </p>
            <p>
              It&apos;s useful when people already know your number. Your office line or mobile can appear on calls that Twilio places, so call-backs reach you there and you don&apos;t have to hand out a new number. Only verify numbers you own or are authorized to use. Our guide to <Link href="/guides/what-is-outbound-caller-id">what outbound caller ID is</Link> explains the wider rules.
            </p>

            <h2 id="console">How do you add a verified caller ID in the Console?</h2>
            <p>Twilio is moving between two versions of its Console, so the labels may differ a little from these.</p>
            <ol>
              <li>
                <strong>Have the phone next to you.</strong> Twilio calls right away. Turn off call screening or silencing of unknown callers for now, or the call may never ring.
              </li>
              <li>
                <strong>Open Verified Caller IDs.</strong> Look under Numbers &amp; senders, or Phone Numbers in the <a href="https://www.twilio.com/console/phone-numbers/verified" rel="noopener">legacy Console</a>. You need the right account, because verified numbers belong to one account.
              </li>
              <li>
                <strong>Add the number.</strong> Choose to add a new caller ID and enter it in <Link href="/guides/e164-phone-number-format">E.164 format</Link>, such as +14155550111.
              </li>
              <li>
                <strong>Answer the call and enter the code.</strong> Twilio shows a six-digit code and calls the number. Twilio&apos;s <a href="https://www.twilio.com/docs/voice/api/verifying-caller-ids-scale" rel="noopener">verification docs</a> say the call comes from +1 415 723 4000 and is in English only. Enter the code on the keypad when asked.
              </li>
              <li>
                <strong>Test it.</strong> The number now appears on your list. Make a test call, as shown below, and check what the other phone displays.
              </li>
            </ol>

            <h2 id="api">How do you add one with the API?</h2>
            <p>
              Send a request to the <code>OutgoingCallerIds</code> endpoint. Adding by API has the same result as using the Console. The response includes the code you need, and the call comes in right after.
            </p>
            <CodeBlock title="Start verification (curl)" code={addCurl} />
            <p>
              Read <code>validation_code</code> in the response and enter it when the phone rings. If you&apos;re verifying a number behind a switchboard, the API has two helpful options: <code>Extension</code> holds digits to dial after connecting, and <code>CallDelay</code> waits up to 60 seconds before calling, which gives you time to get to the phone.
            </p>
            <CodeBlock title="Verify an office extension, 30 seconds from now" code={extensionCurl} />

            <h2 id="use">How do you use a verified number on a call?</h2>
            <p>
              Here&apos;s a typical case. Sam is a consultant whose clients all know her office line, +1 415 555 0111. She verifies it, then makes calls from her mobile, +1 415 555 0177, through Twilio. Clients see the office line and their call-backs go to the office. Her request looks like this:
            </p>
            <CodeBlock
              title="Sam's call, showing the verified office line"
              code={`curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Calls.json" \\
  --data-urlencode "To=+14155550177" \\
  --data-urlencode "From=+14155550111" \\
  --data-urlencode 'Twiml=<Response><Dial callerId="+14155550111">+14155550123</Dial></Response>' \\
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"`}
            />
            <p>
              Twilio rings Sam&apos;s mobile first, then dials the client. That makes two legs, so a 10-minute US call costs 10 × 2 × $0.0140 = $0.28, using the $0.0140 per minute rate <a href="https://www.twilio.com/en-us/voice/pricing/us" rel="noopener">on Twilio&apos;s US voice pricing, as of November 2026</a>. Fifty of those a month is $14.00. She isn&apos;t renting the office number from Twilio, so there&apos;s no $1.15 number fee for it, but a Twilio number would add attestation and texting options, as covered below.
            </p>
            <p>
              Sam&apos;s request needs an upgraded account, because Twilio&apos;s <a href="https://www.twilio.com/docs/usage/trials/try-out-voice" rel="noopener">trial docs</a> list <code>&lt;Dial&gt;&lt;Number&gt;</code> as blocked during a trial.
            </p>
            <p>
              Dialbubble can use a verified number as the caller ID on calls too, if you prefer buttons to curl. Its two-way calls ring your regular phone in the same way and bill the same two legs.
            </p>

            <h2 id="fail">Why isn&apos;t my verified caller ID working?</h2>
            <p>Most problems fall into one of these. Work through whichever matches what you see.</p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Verified caller ID problems and fixes">
              <table>
                <thead>
                  <tr>
                    <th>What you see</th>
                    <th>Likely cause</th>
                    <th>What to do</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>The verification call never rings</td>
                    <td>Call screening, a blocked unknown caller or a carrier filter</td>
                    <td>Turn off screening, allow +1 415 723 4000, and check Twilio&apos;s call logs to see if the call went out</td>
                  </tr>
                  <tr>
                    <td>A number abroad won&apos;t verify</td>
                    <td>Your account can&apos;t dial that country</td>
                    <td>Enable it in <a href="https://www.twilio.com/docs/sip-trunking/voice-dialing-geographic-permissions" rel="noopener">Voice Geo Permissions</a> first, as <a href="https://www.twilio.com/docs/voice/api/verifying-caller-ids-scale" rel="noopener">Twilio requires</a></td>
                  </tr>
                  <tr>
                    <td>Voicemail or an auto-attendant picks up</td>
                    <td>Nobody&apos;s there to enter the code</td>
                    <td>Answer in person, or use <code>Extension</code> and <code>CallDelay</code> in the API</td>
                  </tr>
                  <tr>
                    <td>Code entered, still fails</td>
                    <td>A wrong digit, or a phone system that doesn&apos;t pass keypad tones</td>
                    <td>Start again, or verify from a phone that sends tones directly</td>
                  </tr>
                  <tr>
                    <td><Link href="/twilio-errors/21210">Error 21210 on a call</Link></td>
                    <td>The number isn&apos;t verified on this account</td>
                    <td>Check you&apos;re using the same account or subaccount where you verified it</td>
                  </tr>
                  <tr>
                    <td><Link href="/twilio-errors/21219">Error 21219 on a trial</Link></td>
                    <td>The person you&apos;re calling isn&apos;t verified</td>
                    <td>Verify them as a recipient, or upgrade</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 id="limits">What can&apos;t a verified caller ID do?</h2>
            <ul>
              <li>
                <strong>Send texts.</strong> Twilio <a href="https://support.twilio.com/hc/en-us/articles/223135427-What-s-the-Difference-Between-a-Verified-Phone-Number-and-a-Twilio-Phone-Number" rel="noopener">says verified numbers can&apos;t send SMS or MMS</a>. To text, you need a Twilio number that can send SMS, and in the US <Link href="/guides/a2p-10dlc-registration-guide">A2P 10DLC registration</Link> too.
              </li>
              <li><strong>Receive calls through Twilio.</strong> Call-backs go to the phone you already had. Twilio isn&apos;t involved, so a TwiML Bin won&apos;t run on them.</li>
              <li>
                <strong>Reach the top US trust level.</strong> Twilio&apos;s <a href="https://www.twilio.com/docs/voice/trusted-calling-with-shakenstir/shakenstir-onboarding" rel="noopener">SHAKEN/STIR docs</a> say level B is the highest possible for non-Twilio numbers, because Twilio can&apos;t attest to your right to use them. A Twilio number can reach level A.
              </li>
            </ul>
            <p>
              So when should you verify a number, and when should you buy one? Verify when people already know the number and you only need to show it on calls you place. Buy a Twilio number when you want to text from it, take incoming calls through Twilio, or get the higher trust level. Plenty of people do both: a verified office line for familiar clients, and a Twilio number for everything else. The cost of a purchased number is covered in <Link href="/guides/how-much-does-a-twilio-phone-number-cost">how much a Twilio phone number costs</Link>.
            </p>
            <Callout type="info" title="Two uses of the word verified">
              <p>
                On a <Link href="/guides/is-twilio-free-trial-limits">Twilio free trial</Link>, you also verify the people you call and text, up to 5 per account. That&apos;s a different purpose for the same word: on a trial, verifying someone&apos;s number lets you reach it, while a caller ID is the number other people see when you call.
              </p>
            </Callout>

            <h2 id="faq">Questions people ask</h2>
            <Faq
              items={[
                {
                  q: "How do I remove a verified caller ID?",
                  a: "Delete it from the Verified Caller IDs list in the Console, or send a DELETE request for its OutgoingCallerIds SID in the API. Twilio then stops accepting it as a caller ID on that account.",
                },
                {
                  q: "Can I verify someone else's number?",
                  a: "Only with their authorization, such as a company line you're allowed to use. Showing a number you have no right to use can break the law and Twilio's terms, even if someone reads you the code.",
                },
                {
                  q: "Do I need a Twilio number if I've got a verified one?",
                  a: "Not to show it on outbound calls. You'll want a Twilio number to text, to receive calls through Twilio or to forward them.",
                },
                {
                  q: "Does the verification call work in other languages?",
                  a: "No. Twilio says the verification call is in English only. The code itself is just six digits, so you can enter it either way.",
                },
              ]}
            />
          </Prose>
        </div>
      </Container>
      <RelatedLinks path={path} />
      <CtaBand title="Verified? Put that number on your next call" text="Dialbubble uses your own Twilio account to place calls with your verified number as the caller ID, right from your iPhone." />
    </>
  );
}

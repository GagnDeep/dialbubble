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

const path = "/guides/how-to-make-calls-from-a-different-number";
export const metadata = metaFor(path, { type: "article" });

const VOICE_PRICING = "https://www.twilio.com/en-us/voice/pricing/us";

const steps = [
  { name: "Get a number you have the right to use", text: "Buy a voice-enabled number in your Twilio account, or verify a phone number you already own." },
  { name: "Ring your own phone from Twilio", text: "Send a call request with To set to your phone and From set to your Twilio number." },
  { name: "Connect the other person with Dial", text: "Include TwiML that dials the other person, with callerId set to the number you want them to see." },
  { name: "Answer and check what they see", text: "Pick up when Twilio rings you. Test with a friend's phone first and confirm the number on their screen." },
];

const twoWayCall = `curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Calls.json" \\
  --data-urlencode "To=+14155550111" \\
  --data-urlencode "From=+14155550199" \\
  --data-urlencode 'Twiml=<Response><Dial callerId="+14155550199">+14155550123</Dial></Response>' \\
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
        lede="To call from a different number, use one you own or have verified: add a second line to your iPhone, use a second-number app, or set a Twilio number or verified number as your caller ID. Showing a number that isn't yours to mislead someone is spoofing, which is illegal in the US and many other places."
      />
      <Container>
        <div className="toc-layout">
          <TocSidebar
            items={[
              { id: "options", title: "Your real options" },
              { id: "legal", title: "Is it legal?" },
              { id: "twilio", title: "Call from a Twilio number" },
              { id: "cost", title: "What it costs" },
              { id: "errors", title: "If Twilio refuses the number" },
              { id: "faq", title: "Questions" },
            ]}
          />
          <Prose>
            <h2 id="options">What are your options for calling from another number?</h2>
            <p>
              Each route below gives you a real second number that people can call back. The right one depends on whether you need a separate line all day or only want to show a certain number now and then.
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Ways to call from a different number">
              <table>
                <thead>
                  <tr>
                    <th>Option</th>
                    <th>What they see</th>
                    <th>Best when</th>
                    <th>The catch</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Second line on your iPhone (eSIM)</td>
                    <td>Your second carrier number</td>
                    <td>You want normal calling in the Phone app</td>
                    <td>You pay for a second carrier plan</td>
                  </tr>
                  <tr>
                    <td>Second-number app</td>
                    <td>The number the app gives you</td>
                    <td>You want calls, texts and voicemail in one app</td>
                    <td>A subscription, or limits on the free tier</td>
                  </tr>
                  <tr>
                    <td>A Twilio number</td>
                    <td>Your purchased Twilio number</td>
                    <td>You want pay-as-you-go pricing and control</td>
                    <td>A two-way call rings your phone and bills two legs</td>
                  </tr>
                  <tr>
                    <td>A verified caller ID at Twilio</td>
                    <td>A number you already own, such as your office line</td>
                    <td>Call-backs should reach an existing number</td>
                    <td>Calls only, no texting from that number</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              On an iPhone with Dual SIM, Apple says you can <a href="https://support.apple.com/en-us/109317" rel="noopener">label each plan, such as Business and Personal</a>, and choose which number to use for calls and messages. If that sounds like what you want, our <Link href="/guides/second-phone-number-for-business-on-iphone">comparison of second business numbers on iPhone</Link> sets the costs side by side.
            </p>

            <h2 id="legal">Is it legal to call from a different number?</h2>
            <p>
              Using a number you own or have the right to use is fine. The FCC&apos;s own example of a legitimate use is <a href="https://www.fcc.gov/consumers/guides/spoofing" rel="noopener">a doctor calling from a personal mobile and displaying the office number</a>. What the law targets is deception.
            </p>
            <ul>
              <li>
                <strong>United States.</strong> The Truth in Caller ID Act, at <a href="https://www.law.cornell.edu/uscode/text/47/227" rel="noopener">47 U.S.C. § 227(e)</a>, makes it unlawful to knowingly send misleading or inaccurate caller ID with intent to defraud, cause harm or wrongfully obtain anything of value. The statute sets penalties of up to $10,000 per violation, and the FCC adjusts its figures over time.
              </li>
              <li>
                <strong>United Kingdom.</strong> Ofcom&apos;s <a href="https://www.ofcom.org.uk/siteassets/resources/documents/consultations/category-2-6-weeks/276698---further-action-to-tackle--scam-calls/associated-documents/annex-2-cli-guidance-2024-update.pdf?v=393568" rel="noopener">caller ID guidance</a> says the number sent with a call must be valid, dialable and uniquely identify the caller, and providers must try to stop calls that fail that test.
              </li>
              <li>
                <strong>Twilio&apos;s terms.</strong> Twilio&apos;s <a href="https://www.twilio.com/en-us/legal/aup" rel="noopener">Acceptable Use Policy</a> forbids creating a false identity or trying to mislead others about who sent a communication. Twilio also enforces this technically: its API only accepts a Twilio number or a verified number.
              </li>
            </ul>
            <p>
              Rules differ by country, so check locally if you call abroad. This is general information, not legal advice. Hiding your number is a separate thing: the statute doesn&apos;t restrict blocking your own caller ID, and the FCC says doing so isn&apos;t spoofing.
            </p>

            <h2 id="twilio">How do you call from a Twilio number?</h2>
            <p>
              Here&apos;s a concrete case. Maya runs a small bakery and wants customers to see her shop&apos;s Twilio number, +1 415 555 0199, when she calls from her mobile, +1 415 555 0111. She&apos;s calling a customer on +1 415 555 0123. These are the steps.
            </p>
            <ol>
              <li>
                <strong>Get a number you have the right to use.</strong> Buy a voice-enabled number in the Twilio Console, or <Link href="/guides/how-to-add-a-verified-caller-id-in-twilio">add a verified caller ID</Link> for a phone you already own. If you&apos;re new to this, <Link href="/guides/how-to-use-a-twilio-phone-number">how to use a Twilio phone number</Link> covers the basics.
              </li>
              <li>
                <strong>Ring your own phone from Twilio.</strong> Twilio has no handset of its own, so a two-way call starts with Twilio calling you. Set <code>To</code> to your mobile and <code>From</code> to your Twilio number.
              </li>
              <li>
                <strong>Connect the other person with Dial.</strong> The TwiML in the request runs when you pick up. It dials the customer and shows them the number in <code>callerId</code>.
              </li>
              <li>
                <strong>Answer and check what they see.</strong> Pick up when your phone rings. Try it on a friend&apos;s phone first.
              </li>
            </ol>
            <CodeBlock title="Maya's two-way call (curl)" code={twoWayCall} />
            <p>
              Twilio&apos;s <a href="https://www.twilio.com/docs/voice/api/call-resource" rel="noopener">Call resource docs</a> say <code>From</code> must be a Twilio number or a verified outgoing caller ID for your account. The <a href="https://www.twilio.com/docs/voice/twiml/dial" rel="noopener">Dial docs</a> set a similar limit on <code>callerId</code>. Put your numbers in <Link href="/guides/e164-phone-number-format">E.164 format</Link>, with a plus sign and country code.
            </p>
            <Callout type="warning" title="Upgrade first">
              <p>
                This won&apos;t run on a trial account. Twilio&apos;s <a href="https://www.twilio.com/docs/usage/trials/try-out-voice" rel="noopener">trial docs</a> list <code>&lt;Dial&gt;&lt;Number&gt;</code> as blocked, and replace it with a spoken message. Trials also use shared numbers, so you can&apos;t show your own until you upgrade.
              </p>
            </Callout>
            <p>
              Think about call-backs before you settle on a number. If a customer calls +1 415 555 0199 back, that Twilio number does nothing until you tell it what to do. Set up <Link href="/guides/twilio-call-forwarding">call forwarding on your Twilio number</Link> so those calls reach you.
            </p>
            <p>
              Dialbubble runs this same flow from a button if you&apos;d rather not use a terminal, and adds a safety step: you press a key before the other person is dialed. It has no in-app calling, so your regular phone still rings and you still pay for two legs.
            </p>

            <h2 id="cost">What does it cost to call from a Twilio number?</h2>
            <p>
              A US call costs $0.0140 a minute for each leg, and a US local number costs $1.15 a month, <a href={VOICE_PRICING} rel="noopener">as of November 2026 on Twilio&apos;s US voice pricing</a>. Maya&apos;s call has two legs: Twilio to her, and Twilio to the customer.
            </p>
            <Callout type="cost" title="Maya's month, worked out">
              <p>One 6-minute call: 6 minutes × 2 legs × $0.0140 = $0.168, or about 17 cents.</p>
              <p>40 calls of 6 minutes: 240 minutes × 2 legs × $0.0140 = $6.72.</p>
              <p>Add the number: $6.72 + $1.15 = $7.87 for the month.</p>
            </Callout>
            <p>
              If she shows a verified number instead, she isn&apos;t renting that number from Twilio, so the $1.15 fee for it falls away, though the call legs cost the same. Try your own numbers in the <Link href="/tools/twilio-pricing-calculator">Twilio pricing calculator</Link>.
            </p>

            <h2 id="errors">Why does Twilio refuse my number?</h2>
            <p>
              The usual cause is <Link href="/twilio-errors/21210">error 21210, &quot;From phone number not verified&quot;</Link>. It means the number isn&apos;t a Twilio number on this account and hasn&apos;t been verified on it. Check that you&apos;re using the right account, then verify the number or buy one. Don&apos;t look for a way around it: that check is what stops people from impersonating numbers they don&apos;t control.
            </p>
            <p>
              If calls go through but show up as &quot;spam likely&quot;, the number is working and the label comes from elsewhere. Our guide to <Link href="/guides/what-is-outbound-caller-id">how outbound caller ID works</Link> explains who decides that and what you can do. Trial accounts have their own limits on who you can call, covered in <Link href="/guides/is-twilio-free-trial-limits">Twilio&apos;s free trial limits</Link>.
            </p>

            <h2 id="faq">Questions people ask</h2>
            <Faq
              items={[
                {
                  q: "Can you call from a different number on an iPhone?",
                  a: "Yes, if the iPhone has a second line. With Dual SIM you can choose which of your two numbers to use for a call. Without a second line, you need an app or service that gives you another number, because iPhone has no setting to display an arbitrary number.",
                },
                {
                  q: "Is it illegal to show a different number when I call?",
                  a: "Showing a number you own or are authorized to use is generally fine. In the US, it's unlawful to knowingly send misleading or inaccurate caller ID with intent to defraud, cause harm or wrongfully obtain something of value. Other countries have their own rules. This is general information, not legal advice.",
                },
                {
                  q: "Can I use Twilio to show someone else's number?",
                  a: "No. Twilio requires the number on an outgoing call to be one you bought from Twilio or verified. Verification means someone answers a call on that number and enters a code, which proves control of it. Don't try to verify a number that isn't yours.",
                },
                {
                  q: "Can I hide my number instead?",
                  a: "Yes. US law doesn't restrict blocking your own caller ID, and the FCC says that isn't spoofing. Many people ignore calls from unknown numbers, though, so a real number you can be called back on often works better.",
                },
              ]}
            />
          </Prose>
        </div>
      </Container>
      <RelatedLinks path={path} />
      <CtaBand title="Call from your Twilio number, without the terminal" text="Dialbubble starts the same two-leg call from your iPhone, using your own Twilio account and the numbers you own or have verified." />
    </>
  );
}

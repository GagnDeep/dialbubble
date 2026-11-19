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

const path = "/guides/is-twilio-free-trial-limits";
export const metadata = metaFor(path, { type: "article" });

const TRIALS = "https://www.twilio.com/docs/usage/trials";
const VOICE_TRIAL = "https://www.twilio.com/docs/usage/trials/try-out-voice";
const SMS_PRICES = "https://www.twilio.com/en-us/sms/pricing/us";
const VOICE_PRICES = "https://www.twilio.com/en-us/voice/pricing/us";

const toc = [
  { id: "included", title: "What you get free" },
  { id: "limits", title: "The limits" },
  { id: "custom", title: "Why custom texts fail" },
  { id: "example", title: "A worked trial" },
  { id: "upgrade", title: "What upgrading costs" },
  { id: "testing", title: "Other ways to test" },
  { id: "faq", title: "Questions" },
];

const faq = [
  {
    q: "Is Twilio SMS free?",
    a: "Only during the trial, and only for 100 messages built from Twilio's templates to numbers you've verified. After you upgrade you get another 100 free messages, then each text is charged per segment plus a carrier fee.",
  },
  {
    q: "Do I need a credit card for the Twilio trial?",
    a: "No. Twilio says you can sign up for a free trial without a credit card. You verify your email address and your own phone number instead.",
  },
  {
    q: "What happens when the 30 days end?",
    a: "The trial expires and you can no longer use trial resources. Upgrade before then to keep building. Your Account SID and Auth Token stay the same when you upgrade.",
  },
  {
    q: "Can I keep my trial phone number?",
    a: "No. Trial numbers are shared and owned by Twilio, so you can't keep one. After upgrading you buy your own number, and the first month of a US local or US and Canada toll-free number is free.",
  },
  {
    q: "Can I use the trial to call someone in another country?",
    a: "No. Trial calls and texts are limited to your sign-up country, which Twilio works out from the phone number you registered with. Trials are also offered only in selected countries.",
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
        lede="You can use Twilio for free for 30 days with no credit card, including 100 SMS messages and 75 voice minutes. It's a trial to test with, not a free plan: you can only reach verified numbers, and you can't write your own text messages until you upgrade."
      />
      <Container>
        <div className="toc-layout">
          <TocSidebar items={toc} />
          <Prose>
            <h2 id="included">What does the Twilio free trial include?</h2>
            <p>
              The trial gives you an allowance for each product rather than a shared dollar balance. Older blog posts describe a dollar credit, and that no longer matches Twilio&apos;s{" "}
              <a href={TRIALS} rel="noopener">
                trial documentation
              </a>
              , which these figures come from (as of November 2026).
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Twilio trial free units">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col">Free during trial</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>SMS messages</td><td>100</td></tr>
                  <tr><td>WhatsApp messages</td><td>100</td></tr>
                  <tr><td>Voice call minutes</td><td>75</td></tr>
                  <tr><td>Emails</td><td>3,000</td></tr>
                  <tr><td>Verify verifications</td><td>40</td></tr>
                  <tr><td>Lookups</td><td>100</td></tr>
                </tbody>
              </table>
            </div>
            <p>
              Text-to-speech, speech recognition, answering machine detection, conferencing and transcriptions have no separate count during the trial. Your voice minutes cover them. In the Console, the <strong>Free units tracker</strong> shows what you have left.
            </p>

            <h2 id="limits">What are the Twilio trial account limitations?</h2>
            <p>The units are only half of it. These rules decide what you can actually test:</p>
            <ul>
              <li><strong>30 days.</strong> The trial expires 30 days after sign-up, even if you have units left.</li>
              <li><strong>Verified recipients only.</strong> You can call and text only verified numbers, up to 5 per account. Your sign-up number counts automatically. One number can be verified on at most three accounts.</li>
              <li><strong>Your own country.</strong> Calls and SMS stay within your sign-up country.</li>
              <li><strong>Templates for messages.</strong> SMS and WhatsApp have to use Twilio&apos;s pre-defined templates.</li>
              <li><strong>Shared numbers.</strong> Your calls and texts come from Twilio-owned trial numbers. They aren&apos;t yours and can differ by product and recipient.</li>
              <li><strong>Blocked voice features.</strong> Some TwiML is stripped out during the trial, as the next section explains.</li>
            </ul>
            <p>
              Try to reach a number you haven&apos;t verified and you&apos;ll hit{" "}
              <Link href="/twilio-errors/21608">error 21608 for texts</Link> or{" "}
              <Link href="/twilio-errors/21219">error 21219 for calls</Link>. The fix is either to verify that person&apos;s number or to upgrade.
            </p>

            <h2 id="custom">Why do my custom texts and call forwarding fail on trial?</h2>
            <p>
              This surprises most people. Twilio says custom message bodies aren&apos;t supported during the trial, so you can&apos;t type your own wording and send it. You choose from templates such as order confirmations and appointment reminders.
            </p>
            <p>
              Voice is looser, because custom TwiML is allowed, but Twilio&apos;s{" "}
              <a href={VOICE_TRIAL} rel="noopener">
                Voice trial page
              </a>{" "}
              lists verbs it blocks. Among them are <code>&lt;Record&gt;</code>, <code>&lt;Stream&gt;</code>, <code>&lt;Pay&gt;</code> and <code>&lt;Dial&gt;&lt;Number&gt;</code>. If your TwiML uses one, a voice message tells the caller the verb isn&apos;t available on trial accounts.
            </p>
            <p>
              That last one matters a lot. <code>&lt;Dial&gt;&lt;Number&gt;</code> is how you connect a call to another phone, so a setup like <Link href="/guides/twilio-call-forwarding">forwarding a Twilio number to your phone</Link> or a two-way bridged call has to wait until you upgrade.
            </p>

            <h2 id="example">A worked example: testing appointment reminders</h2>
            <p>Say you run a small salon and want to see whether reminders by text and phone would work. Here&apos;s how the free units might go over a month.</p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Example use of trial units">
              <table>
                <thead>
                  <tr>
                    <th scope="col">What you do</th>
                    <th scope="col">Used</th>
                    <th scope="col">Left</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Verify your phone plus 3 colleagues</td><td>4 of 5 recipients</td><td>1 recipient</td></tr>
                  <tr><td>Send 40 template reminders to them</td><td>40 SMS</td><td>60 SMS</td></tr>
                  <tr><td>Place 10 text-to-speech calls of 3 minutes each</td><td>30 minutes</td><td>45 minutes</td></tr>
                </tbody>
              </table>
            </div>
            <p>
              You&apos;ve learned how delivery, statuses and logs work, and it cost nothing. You haven&apos;t tested your own wording, reached a real customer, or used your own number. Those need an upgraded account.
            </p>

            <h2 id="upgrade">What does upgrading from the Twilio trial cost?</h2>
            <p>
              Upgrading has no subscription. You add a payment method and load a starting balance. Twilio&apos;s trial docs don&apos;t state a fixed minimum, so check the amount on the upgrade screen. Usage then comes out of that balance. Twilio removes the verified-recipient limit and allows custom messages, custom TwiML and multiple numbers.
            </p>
            <p>You also get a fresh set of post-upgrade free units, whatever you used during the trial. A few that matter most:</p>
            <ul>
              <li>First month free on a US local or US and Canada toll-free number</li>
              <li>100 messages</li>
              <li>75 call minutes</li>
              <li>75 minutes of on-demand recording</li>
            </ul>
            <p>Twilio adds a 30% bonus on most of these if you upgrade directly during sign-up. After the free units run out, here&apos;s what you&apos;d pay in the US:</p>
            <ul>
              <li>
                A local number is $1.15 a month and an outbound call is $0.0140 a minute, as of November 2026 (
                <a href={VOICE_PRICES} rel="noopener">
                  Twilio voice pricing
                </a>
                ).
              </li>
              <li>
                A text is $0.0083 per segment plus a carrier fee, as of November 2026 (
                <a href={SMS_PRICES} rel="noopener">
                  Twilio SMS pricing
                </a>
                ).
              </li>
            </ul>
            <p>
              Our guide to <Link href="/guides/how-does-twilio-pricing-work">how Twilio pricing works</Link> includes a full example monthly bill. Two things also take time after upgrading:
            </p>
            <ul>
              <li>
                <strong>US texting</strong> from a regular number needs <Link href="/guides/a2p-10dlc-registration-guide">A2P 10DLC registration</Link>, which has its own fees.
              </li>
              <li>
                <strong>Calling +1 numbers</strong> can require an approved Primary Customer Profile in Trust Hub. If you see <Link href="/twilio-errors/13225">error 13225</Link> or <Link href="/twilio-errors/21216">error 21216</Link>, that&apos;s the likely cause. Accounts created outside the US or Canada on or after October 8, 2025 need a Business profile.
              </li>
            </ul>
            <Callout type="info" title="Calling from a number you already own">
              <p>
                You don&apos;t have to buy a number to use your own caller ID on calls. You can <Link href="/guides/how-to-add-a-verified-caller-id-in-twilio">add a verified caller ID in Twilio</Link> instead. It only covers outbound calls.
              </p>
            </Callout>

            <h2 id="testing">Are there other ways to test for free?</h2>
            <p>
              Developers who already have test credentials from the legacy Console can also use Twilio&apos;s{" "}
              <a href="https://www.twilio.com/docs/iam/test-credentials" rel="noopener">
                test credentials
              </a>
              . They simulate buying a number, sending an SMS or making a call with no charge, but they never connect to real phones, so they&apos;re useful for checking your code only.
            </p>
            <p>
              If you&apos;re thinking of using Dialbubble with a trial, know the limits first. Dialbubble sends the text you type, so free-text SMS needs an upgraded account. Its two-way Talk calls connect with <code>&lt;Dial&gt;&lt;Number&gt;</code>, so they need one too. Demo Mode needs no Twilio account at all, so you can see how everything works before you decide.
            </p>

            <h2 id="faq">Questions about using Twilio for free</h2>
            <Faq items={faq} />
          </Prose>
        </div>
      </Container>
      <RelatedLinks path={path} />
      <CtaBand
        title="Trial too limited to judge? See it in Demo Mode"
        text="Dialbubble's Demo Mode shows calling and texting with sample data and needs no Twilio account. When you're ready for real use, it works with your own upgraded account, with no markup."
      />
    </>
  );
}

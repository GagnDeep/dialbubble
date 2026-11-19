import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Callout } from "@/components/Callout";
import { Container } from "@/components/Container";
import { Faq } from "@/components/Faq";
import { PageHero } from "@/components/PageHero";
import { Prose } from "@/components/Prose";
import { RelatedLinks } from "@/components/RelatedLinks";
import { coreFaq } from "@/content/faq";
import { site } from "@/content/site";
import { metaFor } from "@/lib/registry";

export const metadata = metaFor("/support");

const supportFaq = [
  ...coreFaq,
  {
    q: "Why haven't my new texts shown up?",
    a: "While the app is open, it checks every 20 seconds, and every 5 seconds inside an open conversation. When it's closed, it only checks if you turned on Alerts While Closed in Settings › Notifications, and iOS decides when those background checks run. Open the app, then pull to refresh or wait a moment.",
  },
  {
    q: "Why won't my picture message send?",
    a: "MMS needs a public https link to the image, because Twilio fetches the media itself and the app has no server to upload to. Also check that your Twilio number supports MMS. The app shows each number's capabilities.",
  },
  {
    q: "How do I schedule a text?",
    a: "Scheduling goes through a Twilio Messaging Service. Create one in the Twilio Console, then add its SID (it starts with MG) in the app under Settings, Account.",
  },
  {
    q: "Can I get calls in Dialbubble?",
    a: "No. Calls to your Twilio number follow whatever you set up in the Twilio Console, such as forwarding to your phone. Dialbubble doesn't answer them.",
  },
  {
    q: "I moved to a new iPhone. Where did my account go?",
    a: "Credentials are stored on one device only and don't transfer. Install Dialbubble on the new iPhone and connect your Twilio account again. Your numbers, messages and call history come back from Twilio.",
  },
  {
    q: "Can I export my calls and texts?",
    a: "Yes. In Settings › Your Data, tap Export History to share a CSV file of your calls and texts, ready for Numbers, Excel or Google Sheets.",
  },
  {
    q: "I found a bug or have an idea. Where do I send it?",
    a: "Open an issue on GitHub. Dialbubble is open source, so you can follow the fix, or even send a pull request yourself.",
  },
];

export default function SupportPage() {
  return (
    <>
      <Breadcrumbs path="/support" />
      <PageHero
        title="How can we help?"
        lede={
          <>
            Check the answers below, or{" "}
            <a className="link" href={site.newIssue} rel="noopener">
              open an issue on GitHub
            </a>
            . We read every one.
          </>
        }
      />

      <Container as="section" className="mt-4">
        <div className="rounded-xl bg-surface p-6 shadow-[inset_0_0_0_1px_var(--line)] sm:p-8">
          <h2 className="display-3">Contact support</h2>
          <p className="mt-2 max-w-[42rem] text-ink-soft">
            Open an issue on GitHub with your iPhone model, your iOS version, what you were doing and any error code you saw. Issues are public, so never include your Auth Token, API Key secret, phone numbers or message text. We will never ask for your credentials.
          </p>
          <p className="mt-5">
            <span className="flex flex-wrap gap-3">
              <a className="btn btn-sm btn-mint" href={site.newIssue} rel="noopener">
                Open a support issue
              </a>
              <a className="btn btn-sm btn-ghost" href={site.security} rel="noopener">
                Report privately
              </a>
            </span>
          </p>
          <p className="mt-5 max-w-[42rem] text-ink-soft">
            In the app, Help &amp; Guides (from Settings, the Home question mark button or Search) has step-by-step guides. For problems with your Twilio account or bill, contact Twilio, since we can&apos;t see or change anything there.
          </p>
        </div>
      </Container>

      <Container as="section" className="mt-16">
        <h2 className="display-2">Frequently asked questions</h2>
        <Faq items={supportFaq} className="mt-6" />
      </Container>

      <Container className="mt-16">
        <Prose>
          <h2 id="two-way-calls">Troubleshooting two-way calls</h2>
          <p>
            A Talk call has several stages, and Dialbubble shows you each one while the call is live. Find the stage where it stopped. <Link href="/how-it-works#talk">How two-way calls work</Link> explains the normal order.
          </p>

          <h3>My phone doesn&apos;t ring</h3>
          <ul>
            <li>Check your own phone number in Settings, including the country code. This is the phone Twilio calls first.</li>
            <li>Check your Twilio balance on the Home screen. Twilio won&apos;t place calls without funds.</li>
            <li>Talk calls don&apos;t work on a Twilio trial account, because Twilio blocks the step that connects the two phones. Upgrade your Twilio account, or use Voice Message to reach a verified number.</li>
            <li>Make sure your phone isn&apos;t silencing unknown callers or blocking the Twilio number you&apos;re calling from. Turn off Silence Unknown Callers, or save your Twilio number as a contact.</li>
          </ul>

          <h3>My phone rings, but the other person never does</h3>
          <ul>
            <li>You need to press a key. The voice prompt plays twice and then waits a few seconds. If you don&apos;t press anything, the call is cancelled and the other person is never dialed.</li>
            <li>If voicemail or call screening picked up, no key was pressed. Answer the call yourself and try again.</li>
            <li>If the key press isn&apos;t registering, make sure your phone is sending keypad tones. Bring up the keypad on the call screen and press a number.</li>
            <li>
              You can turn off this step with <strong>Press a key to connect</strong> under Settings, Numbers &amp; Calling. Then voicemail can answer and trigger the second leg, so we recommend leaving it on.
            </li>
          </ul>

          <h3>The call to them fails or ends right away</h3>
          <ul>
            <li>Calling another country? Twilio blocks many countries by default. Allow the destination under Voice Geographic Permissions in the Twilio Console.</li>
            <li>Trial accounts can only call verified numbers, and only with Voice Message.</li>
            <li>Check that the number is in full international format, with the country code.</li>
            <li>Open the call in Recents to see its details and any error. Dialbubble explains each Twilio error in plain English.</li>
          </ul>

          <h3>They see the wrong number</h3>
          <p>
            They see the number you chose for that call, or your default calling number in Settings. Caller ID must be a voice-capable Twilio number or a verified caller ID on your account. Some carriers change or hide caller ID, which isn&apos;t something the app can control.
          </p>

          <h3>The call costs more than I expected</h3>
          <p>
            Talk calls bill two legs, and the first one starts when you answer. Check your costs in the Home dashboard, and read <Link href="/pricing">how pricing works</Link>.
          </p>

          <h2 id="delete-data">How to delete your data</h2>
          <p>We don&apos;t hold any of your data on servers, so there&apos;s nothing for us to delete and no account to close. Everything Dialbubble stores is on your iPhone.</p>
          <ul>
            <li>
              <strong>Remove the account in the app.</strong> In Settings, open the account and tap Remove Account. This deletes its credentials from the Keychain and removes it from Dialbubble.
            </li>
            <li>
              <strong>Clear saved history.</strong> In Settings › Your Data, tap Clear Saved History to delete the calls and texts kept on this iPhone for offline use.
            </li>
            <li>
              <strong>Or delete the app.</strong> Deleting Dialbubble from your iPhone removes its stored settings and data. iOS can keep Keychain items after an app is deleted, so to be sure your credentials are gone, remove your accounts in the app first.
            </li>
          </ul>
          <Callout type="info" title="Data at Twilio stays at Twilio">
            <p>Messages, call logs and recordings belong to your Twilio account. Removing Dialbubble doesn&apos;t delete them. To delete them, use the Twilio Console or contact Twilio. If you want to cut Dialbubble off entirely, revoke the API Key or rotate your Auth Token there as well.</p>
          </Callout>
          <p>
            See the <Link href="/privacy">privacy policy</Link> for more, or ask on <a href={site.issues} rel="noopener">GitHub</a>.
          </p>
        </Prose>
      </Container>

      <RelatedLinks path="/support" />
    </>
  );
}

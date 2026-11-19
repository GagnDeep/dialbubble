import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { Prose } from "@/components/Prose";
import { site } from "@/content/site";
import { metaFor } from "@/lib/registry";

export const metadata = metaFor("/privacy");

export default function PrivacyPage() {
  return (
    <>
      <Breadcrumbs path="/privacy" />
      <PageHero title="Privacy policy" lede="The short version: the Dialbubble app sends nothing to us, and this website has no trackers.">
        <p className="mt-4 text-ink-soft">Effective date: November 19, 2026</p>
      </PageHero>
      <Container className="mt-2">
        <Prose>
          <p>
            This policy explains how the Dialbubble iPhone app (&quot;the app&quot;) and this website (&quot;the website&quot;) handle information. &quot;We&quot; and &quot;us&quot; mean {site.developer}, the developer of Dialbubble. Dialbubble is open source, so you can check everything described here in the <a href={site.repo} rel="noopener">source code on GitHub</a>.
          </p>

          <h2 id="summary">Summary</h2>
          <ul>
            <li>The app has no server. It sends nothing to us, and we can&apos;t see your credentials, messages, calls, contacts or usage.</li>
            <li>The app has no analytics, advertising or third-party tracking code.</li>
            <li>Your Twilio credentials stay in the iPhone Keychain.</li>
            <li>The app sends requests directly to Twilio, under your own Twilio account.</li>
            <li>Optional alerts and the app icon badge are created on your iPhone. There is no push server.</li>
            <li>The website has no trackers or analytics and sets no cookies.</li>
          </ul>

          <h2 id="app-collection">What the app collects</h2>
          <p>
            Nothing is collected by us. Dialbubble doesn&apos;t have accounts, a backend, analytics or crash-reporting services of its own, and the app doesn&apos;t send your information to any server that we run.
          </p>

          <h2 id="on-device">What the app stores on your iPhone</h2>
          <p>To work, the app keeps some information on your device. We can&apos;t access any of it.</p>
          <ul>
            <li>
              <strong>Credentials.</strong> Your Auth Token or API Key secret is stored in the iOS Keychain, restricted to this device.
            </li>
            <li>
              <strong>Account and app details.</strong> Details such as your Account SID, account names, number nicknames and colors, your own phone number, message templates, recent lookups and searches, and your preferences are stored in the app&apos;s local storage.
            </li>
            <li>
              <strong>Saved history.</strong> Your latest calls and texts are saved in the app&apos;s private storage, protected by iOS file encryption, so the app opens instantly and works offline. Turn this off or clear it in Settings › Your Data.
            </li>
            <li>
              <strong>Drafts and pins.</strong> Unsent messages and pinned conversations are kept in the app&apos;s local storage.
            </li>
            <li>
              <strong>Exports you create.</strong> If you choose Export History, the app builds a CSV file of your calls and texts and hands it to the iOS share sheet. It goes only where you send it.
            </li>
            <li>
              <strong>Recordings you play or share.</strong> A call recording may be saved briefly to the app&apos;s temporary files so it can be played or shared.
            </li>
          </ul>
          <p>The app&apos;s local storage, other than the Keychain items described above, may be included in your iCloud or computer backups, depending on your iPhone&apos;s settings.</p>

          <h2 id="twilio">Requests to Twilio</h2>
          <p>
            When you use the app, it sends requests directly from your iPhone to Twilio over an encrypted connection, using your credentials and under your own Twilio account. These requests can include phone numbers, message text, media links, call instructions and any text you ask Twilio to speak. The app also reads information back from Twilio, such as your numbers, messages, call history, recordings, balance and usage.
          </p>
          <p>
            On two-way calls that wait for a key press, Twilio fetches its next instructions, which include the number being dialed, from Twilio&apos;s Echo Twimlet service at twimlets.com.
          </p>
          <p>
            Twilio handles this data as your provider, under your agreement with Twilio. Twilio&apos;s privacy policy applies, and you can read it at{" "}
            <a href="https://www.twilio.com/en-us/legal/privacy" rel="noopener">
              twilio.com/legal/privacy
            </a>
            . We have no access to your Twilio account and no control over how Twilio handles this data. If you use a paid lookup or a text-to-speech voice, Twilio may process it through its own partners.
          </p>

          <h2 id="contacts">Contacts</h2>
          <p>
            To pick a number, the app uses the iOS contacts picker, which doesn&apos;t need permission: the app only receives the contact you choose. If you also turn on contact names in Settings and allow access, the app reads your contacts&apos; names and numbers on your iPhone to show names instead of numbers and to suggest people as you type. Contacts are never uploaded to us or to anyone else. A number reaches Twilio only when you call or text it. You can turn contact access off at any time in the iPhone Settings app.
          </p>

          <h2 id="notifications">Notifications and background checks</h2>
          <p>
            Notifications are off unless you turn them on. If you allow them, the app can show a badge on its icon with your unread texts and missed calls, and use Background App Refresh to check Twilio now and then while it&apos;s closed and post an alert on your iPhone for new texts or missed calls. These checks go directly from your iPhone to Twilio, like any other request, and the alerts are created on the device. Dialbubble doesn&apos;t use a push server, so nothing about your messages passes through us or through Apple&apos;s push service.
          </p>

          <h2 id="face-id">Face ID</h2>
          <p>If you turn on the app lock, iOS handles Face ID. The app only learns whether authentication succeeded and never receives your biometric data.</p>

          <h2 id="siri">Siri and Shortcuts</h2>
          <p>If you use Dialbubble through Siri or Shortcuts, Apple processes those requests under Apple&apos;s privacy policy. The resulting call or text goes to Twilio in the way described above.</p>

          <h2 id="demo-mode">Demo Mode</h2>
          <p>Demo Mode runs on simulated data inside the app. It doesn&apos;t contact Twilio and nothing is sent or charged.</p>

          <h2 id="apple">The App Store</h2>
          <p>Apple may collect information when you download the app or use the App Store, under Apple&apos;s privacy policy. If Apple gives us aggregated download or crash statistics through its developer tools, they don&apos;t identify you to us.</p>

          <h2 id="website">The website</h2>
          <p>
            The website is a static site hosted on GitHub Pages. It has no analytics, advertising or third-party trackers, serves its own fonts, and sets no cookies. GitHub, as the host, may log technical information such as your IP address to deliver and secure the site, under the{" "}
            <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener">
              GitHub Privacy Statement
            </a>
            . We don&apos;t receive those logs.
          </p>
          <p>Any free tools on the website run in your browser. What you type into them isn&apos;t sent to us unless a tool clearly says otherwise.</p>

          <h2 id="email">If you contact us</h2>
          <p>
            Support happens on GitHub. Issues and discussions are public, so please don&apos;t post phone numbers, message content or your Twilio credentials there. To report something privately, such as a security problem, use GitHub&apos;s private vulnerability reporting. Whatever you send is used only to reply and to keep a record of the conversation, and GitHub handles it under its own privacy statement.
          </p>

          <h2 id="sharing">Sharing and sale of data</h2>
          <p>We don&apos;t sell personal information or share it for advertising. We hold almost nothing: only what you choose to send us on GitHub. We disclose that only if the law requires it.</p>

          <h2 id="choices">Your choices and deleting your data</h2>
          <ul>
            <li>
              <strong>In the app.</strong> Remove an account in Settings to delete its credentials and details from your iPhone, or delete the app. iOS can keep Keychain items after an app is deleted, so remove your accounts first to be sure your credentials are gone. <Link href="/support#delete-data">Deletion steps</Link> are on the support page.
            </li>
            <li>
              <strong>At Twilio.</strong> Your messages, call logs and recordings are held by Twilio. Use the Twilio Console or contact Twilio to access or delete them.
            </li>
            <li>
              <strong>With us.</strong> Depending on where you live, you may have rights to access, correct or delete personal information we hold, such as messages you sent us, and to complain to a data protection authority. Contact us as described below and we&apos;ll respond.
            </li>
          </ul>

          <h2 id="children">Children</h2>
          <p>Dialbubble and the website aren&apos;t directed at children under 13, or the minimum age required where you live, and using the app requires a Twilio account. We don&apos;t knowingly collect information from children. If you think a child has sent us personal information, contact us and we&apos;ll delete it.</p>

          <h2 id="changes">Changes to this policy</h2>
          <p>If this policy changes, we&apos;ll post the new version on this page and update the effective date. If a change materially affects how your information is handled, we&apos;ll also make it clear in the app or on the website before it takes effect.</p>

          <h2 id="contact">Contact</h2>
          <p>
            For privacy questions, open an issue at <a href={site.issues} rel="noopener">github.com/GagnDeep/dialbubble/issues</a>, or for anything private, use <a href={site.security} rel="noopener">private reporting on GitHub</a>. The developer is {site.developer}.
          </p>
        </Prose>
      </Container>
    </>
  );
}

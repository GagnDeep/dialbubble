import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { Prose } from "@/components/Prose";
import { site } from "@/content/site";
import { metaFor } from "@/lib/registry";

export const metadata = metaFor("/terms");

export default function TermsPage() {
  return (
    <>
      <Breadcrumbs path="/terms" />
      <PageHero title="Terms of use" lede="The rules for using Dialbubble and this website. The important part: your Twilio account, what it costs and how you use it are your responsibility.">
        <p className="mt-4 text-ink-soft">Effective date: November 19, 2026</p>
      </PageHero>
      <Container className="mt-2">
        <Prose>
          <p>
            These terms apply to the Dialbubble iPhone app (&quot;the app&quot;) and this website (&quot;the website&quot;). &quot;We&quot; and &quot;us&quot; mean {site.developer}, the developer of Dialbubble. By using either one, you agree to these terms. If you don&apos;t agree, please don&apos;t use them.
          </p>

          <h2>What Dialbubble is</h2>
          <p>
            Dialbubble is a client app that connects directly to a Twilio account you provide. We don&apos;t provide telephone or messaging service. Twilio places your calls and sends your messages under your agreement with Twilio. {site.disclaimer}
          </p>

          <h2>Your license</h2>
          <p>
            If you download Dialbubble from the App Store, you may use it on Apple devices you own or control, subject to these terms and to Apple&apos;s Licensed Application End User License Agreement. Don&apos;t use it to break the law.
          </p>
          <p>
            Dialbubble&apos;s source code is open source under the{" "}
            <a href={`${site.repo}/blob/main/LICENSE`} rel="noopener">
              MIT License
            </a>
            . That license governs what you may do with the code, including copying, changing and redistributing it. If you build and distribute your own version, please give it a different name and icon so people don&apos;t confuse it with Dialbubble.
          </p>

          <h2>Your Twilio account and charges</h2>
          <ul>
            <li>You need your own Twilio account for real calls and texts, and you must follow Twilio&apos;s terms and acceptable use policy.</li>
            <li>The app is currently free. <strong>All Twilio charges are yours</strong>, including for two-leg Talk calls, broadcasts, recordings, lookups and anything sent or called by mistake.</li>
            <li>You are responsible for your credentials, for keeping your device secure, and for everything done with your account through the app.</li>
            <li>Check your usage and set limits at Twilio. Cost information shown in the app comes from Twilio, and it may be delayed or incomplete.</li>
          </ul>

          <h2>Using it lawfully</h2>
          <p>You are responsible for how you use Dialbubble, including complying with the laws that apply to your calls and messages. In particular:</p>
          <ul>
            <li>Get the consent you need before you call or text people, especially for marketing, automated voice messages and broadcasts.</li>
            <li>Follow call-recording laws. Some places require everyone on a call to agree to recording.</li>
            <li>Meet carrier and registration rules such as A2P 10DLC.</li>
            <li>Don&apos;t use Dialbubble for spam, harassment, fraud, or to misrepresent who you are.</li>
          </ul>

          <h2>No emergency calling</h2>
          <p>
            <strong>Don&apos;t rely on Dialbubble for emergency calls.</strong> The app isn&apos;t a replacement for your phone service and isn&apos;t designed to reach emergency services. In an emergency, use your phone&apos;s regular dialer.
          </p>

          <h2>Known limits</h2>
          <p>
            Dialbubble has no in-app calling and no push notifications, and depends on Twilio, your phone and your network. Optional alerts while the app is closed depend on Background App Refresh, which iOS schedules, so they can be late or not arrive at all. Don&apos;t rely on it for anything time-critical. See <Link href="/how-it-works#limits">the limits</Link> for details.
          </p>

          <h2>Website content</h2>
          <p>
            Guides, tools and estimates on the website are for general information. They aren&apos;t legal or financial advice, and Twilio&apos;s prices and rules can change. Check Twilio&apos;s own documentation before you rely on them.
          </p>

          <h2>Our intellectual property</h2>
          <p>The Dialbubble name and logo belong to us. The source code is licensed under the MIT License as described above. Other trademarks, including Twilio, belong to their owners.</p>

          <h2>No warranty</h2>
          <p>
            To the extent the law allows, the app and website are provided &quot;as is&quot; and &quot;as available&quot;, with no warranties of any kind, including merchantability, fitness for a particular purpose and non-infringement. We don&apos;t promise that they will be uninterrupted or error-free, or that any call or message will be delivered.
          </p>

          <h2>Limit of liability</h2>
          <p>
            To the extent the law allows, we aren&apos;t liable for indirect, incidental, special, consequential or punitive damages, or for lost profits, lost data, or charges on your Twilio or phone accounts. Our total liability for any claim is limited to US$50. Some places don&apos;t allow these limits, so they may not fully apply to you, and nothing here limits rights that can&apos;t be limited by law.
          </p>

          <h2>Indemnity</h2>
          <p>To the extent the law allows, you agree to cover claims and costs against us that result from your use of Dialbubble in breach of these terms or the law, including the calls and messages you send.</p>

          <h2>Apple</h2>
          <p>
            These terms are between you and us, not Apple. Apple isn&apos;t responsible for the app, its maintenance or support, or any claims relating to it. Apple and its subsidiaries are third-party beneficiaries of these terms and may enforce them against you.
          </p>

          <h2>Changes and ending use</h2>
          <p>
            We may change or discontinue the app or website, and we may update these terms by posting a new version with a new effective date. If you keep using Dialbubble after that, you accept the changes. You can stop at any time by deleting the app. Sections that by their nature should survive, such as the warranty disclaimer and liability limits, continue to apply.
          </p>

          <h2>Other terms</h2>
          <p>If part of these terms can&apos;t be enforced, the rest still applies. Consumer rights that the law of your country gives you aren&apos;t affected.</p>

          <h2>Contact</h2>
          <p>
            Questions about these terms? Open an issue at <a href={site.issues} rel="noopener">github.com/GagnDeep/dialbubble/issues</a>.
          </p>
        </Prose>
      </Container>
    </>
  );
}

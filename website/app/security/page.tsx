import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Callout } from "@/components/Callout";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { DirectDiagram } from "@/components/DirectDiagram";
import { PageHero } from "@/components/PageHero";
import { Prose } from "@/components/Prose";
import { RelatedLinks } from "@/components/RelatedLinks";
import { TocSidebar } from "@/components/TocSidebar";
import { site } from "@/content/site";
import { metaFor } from "@/lib/registry";

export const metadata = metaFor("/security");

const toc = [
  { id: "no-server", title: "There is no Dialbubble server" },
  { id: "credentials", title: "Where your credentials live" },
  { id: "api-keys", title: "Use an API Key if you can" },
  { id: "lock", title: "Locking the app" },
  { id: "requests", title: "Where requests go" },
  { id: "your-part", title: "Your part" },
  { id: "report", title: "Reporting a security problem" },
];

export default function SecurityPage() {
  return (
    <>
      <Breadcrumbs path="/security" />
      <PageHero
        title="Nothing of ours to break into"
        lede="Dialbubble has no server and no account system. Your Twilio credentials stay on your iPhone, and the app talks directly to Twilio."
      />
      <Container className="mt-4">
        <DirectDiagram />
      </Container>
      <Container className="mt-14">
        <div className="toc-layout">
          <TocSidebar items={toc} />
          <Prose>
            <h2 id="no-server">There is no Dialbubble server</h2>
            <p>
              Most apps that sit on top of Twilio run a backend that holds your credentials and handles your traffic. Dialbubble doesn&apos;t. There&apos;s no Dialbubble account, database or analytics service, so we have no copy of your credentials, messages, call history or recordings to lose.
            </p>
            <p>Your messages, calls and recordings live in your Twilio account, under Twilio&apos;s security and privacy terms.</p>

            <h2 id="credentials">Where your credentials live</h2>
            <p>
              Your Auth Token or API Key secret is stored in the iOS Keychain, using a setting that keeps it on this device only (<code>AfterFirstUnlockThisDeviceOnly</code>). It doesn&apos;t sync to your other devices and isn&apos;t restored onto a new phone, so you&apos;ll enter it again if you move to a new iPhone.
            </p>
            <p>If you leave onboarding partway through, the app saves your progress but never stores the secret until you finish.</p>

            <h2 id="api-keys">Use an API Key if you can</h2>
            <p>
              Dialbubble works with your Account SID and Auth Token, or with an API Key (<code>SK…</code>) and its secret. We recommend an API Key: you create it in the Twilio Console and can revoke that one key at any time, without changing your Auth Token or anything else that uses it.
            </p>

            <h2 id="lock">Locking the app</h2>
            <p>
              Turn on the Face ID app lock in Settings, and Dialbubble stays locked until you authenticate. iOS handles Face ID, so the app never sees your biometric data. A privacy screen also hides the app&apos;s contents in the app switcher.
            </p>

            <h2 id="requests">Where requests go</h2>
            <p>
              The app makes its requests over TLS to Twilio&apos;s own API hosts, such as <code>api.twilio.com</code>. On a Talk call that waits for a key press, the instructions Twilio follows after you press a key are served by Twilio&apos;s Echo Twimlet at <code>twimlets.com</code>, because there&apos;s no server of ours to host them. Those instructions include the number being dialed. Twilio fetches them, not your phone.
            </p>
            <p>Help links and &quot;Learn More&quot; links open Twilio&apos;s website in your browser.</p>

            <h2 id="your-part">Your part</h2>
            <p>Having no server means there&apos;s no one else guarding your keys, so a few habits matter.</p>
            <ul>
              <li>Keep a passcode on your iPhone and turn on the app lock. Anyone who can use the unlocked app can spend from your Twilio account.</li>
              <li>If your iPhone is lost or a credential may have leaked, revoke the API Key or rotate your Auth Token in the Twilio Console straight away.</li>
              <li>Turn on two-factor authentication for your Twilio login, and set usage alerts or limits in the Twilio Console.</li>
              <li>Only share a Dialbubble setup with someone by creating a separate API Key for them, so you can revoke it later.</li>
            </ul>
            <Callout type="warning" title="Your credentials can spend your money">
              <p>Treat your iPhone like a key holder. Twilio credentials can place calls and send messages billed to your account, whichever app they&apos;re used in.</p>
            </Callout>

            <h2 id="report">Reporting a security problem</h2>
            <p>
              If you think you&apos;ve found a security issue in Dialbubble or this website, please report it privately through <a href={site.security} rel="noopener">GitHub security advisories</a> rather than a public issue. Dialbubble is open source, so you can also review the code yourself on <a href={site.repo} rel="noopener">GitHub</a>. For how we handle information, read the <Link href="/privacy">privacy policy</Link>.
            </p>
          </Prose>
        </div>
      </Container>
      <RelatedLinks path="/security" />
      <CtaBand />
    </>
  );
}

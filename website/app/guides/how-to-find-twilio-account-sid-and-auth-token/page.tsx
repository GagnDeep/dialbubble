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

const path = "/guides/how-to-find-twilio-account-sid-and-auth-token";
export const metadata = metaFor(path, { type: "article" });

const steps = [
  { name: "Log in to the Twilio Console", text: "Sign in at 1console.twilio.com. If your account still opens the legacy Console at console.twilio.com, the same details are there under slightly different menu names." },
  { name: "Copy your Account SID", text: "Your Account SID is shown on the Console's account home or dashboard. It starts with AC and is 34 characters long. It isn't secret on its own, so it's normally visible without an extra click." },
  { name: "Open the API keys and tokens page", text: "In the current Console, go to Settings, then Account settings, then API keys & auth tokens. In the legacy Console, go to Admin, then Account management, then API keys & tokens." },
  { name: "Check the region", text: "Pick your region on that page. Twilio's API credentials are region-specific. Most accounts use the default United States region unless someone set up Twilio Regions." },
  { name: "Reveal and copy the Auth Token", text: "The token is hidden by default. Select the eye icon to show it, then copy it straight into wherever you store secrets, such as an environment variable or a password manager." },
  { name: "Test the pair", text: "Run a simple read request with the SID as the username and the token as the password. A JSON reply describing your account means the pair works. An authentication error means one of the values is wrong." },
];

const toc = [
  { id: "where", title: "Where to find them" },
  { id: "shape", title: "What each one looks like" },
  { id: "test", title: "Test them" },
  { id: "rotate", title: "Change your Auth Token" },
  { id: "safe", title: "Keep them safe" },
  { id: "fails", title: "If they don't work" },
  { id: "faq", title: "Questions" },
];

const faq = [
  {
    q: "Is the Twilio Account SID secret?",
    a: "Treat it as private but not as a password. It identifies your account and appears in API URLs, so it can't sign anyone in by itself. The Auth Token is the real secret. Anyone holding both can use your account and spend your balance.",
  },
  {
    q: "Do subaccounts have their own SID and Auth Token?",
    a: "Yes. A subaccount is its own account resource with its own SID and token. A common cause of error 20003 is pairing a SID from one account with a token from another, so copy both from the same account.",
  },
  {
    q: "What happens to my Account SID when I upgrade from a trial?",
    a: "Nothing. Twilio keeps the same Account SID and Auth Token when you upgrade, so anything already set up with them keeps working.",
  },
  {
    q: "Can I recover an API key secret I lost?",
    a: "No. Twilio shows an API key's secret only once, when you create it. If you lost it, create a new key, update whatever used the old one, and revoke the old key.",
  },
];

export default function Page() {
  const entry = getEntry(path)!;
  return (
    <>
      <JsonLd data={howToLd({ name: entry.title, description: entry.description, path, steps })} />
      <Breadcrumbs path={path} />
      <PageHero
        eyebrow="Guide"
        title={entry.title}
        lede="Your Account SID is on the Twilio Console's account home, and your Auth Token is on the API keys & auth tokens page under Settings, hidden until you select the eye icon. Copy both from the same account and you're ready to make requests."
      />
      <Container>
        <div className="toc-layout">
          <TocSidebar items={toc} />
          <Prose>
            <h2 id="where">Where do I find my Twilio Account SID and Auth Token?</h2>
            <p>
              Twilio is moving people to a new Console, so you may see either of two layouts. These steps cover both. If a menu name has moved again, type &quot;API keys&quot; into the Console search bar.
            </p>
            <ol>
              {steps.map((step) => (
                <li key={step.name}>
                  <strong>{step.name}.</strong> {step.text}
                </li>
              ))}
            </ol>
            <p>
              Twilio documents the current path in its{" "}
              <a href="https://www.twilio.com/docs/iam/api-keys/keys-in-console" rel="noopener">
                guide to API keys in the Console
              </a>
              . Haven&apos;t signed up yet? A new account starts as a trial, and our guide to{" "}
              <Link href="/guides/is-twilio-free-trial-limits">what the Twilio free trial includes and blocks</Link> explains what you can do before paying.
            </p>

            <h2 id="shape">What does a Twilio Account SID look like?</h2>
            <p>
              Twilio publishes the exact format of a SID: two letters that show the type of resource, then 32 hexadecimal characters. That makes mistakes easy to spot. These examples are fake and won&apos;t work.
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Twilio credential formats">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Credential</th>
                    <th scope="col">Format</th>
                    <th scope="col">Fake example</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Account SID</td>
                    <td>AC + 32 hex characters</td>
                    <td><code>ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</code></td>
                  </tr>
                  <tr>
                    <td>API key SID</td>
                    <td>SK + 32 hex characters</td>
                    <td><code>SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</code></td>
                  </tr>
                  <tr>
                    <td>Auth Token</td>
                    <td>No prefix, no published pattern</td>
                    <td><code>TWILIO_AUTH_TOKEN</code> (keep it in a variable)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Twilio&apos;s{" "}
              <a href="https://www.twilio.com/docs/iam/api/account" rel="noopener">
                Accounts reference
              </a>{" "}
              defines the Account SID pattern, but it describes the token only as a secret string, so don&apos;t expect a prefix to check. To test the shape of what you copied, use the{" "}
              <Link href="/tools/twilio-credentials-format-checker">Twilio credentials format checker</Link>, which runs entirely in your browser.
            </p>
            <Callout type="tip" title="The usual copy mistakes">
              <p>A stray space at either end, an API key SID (SK) pasted where the Account SID (AC) belongs, or a token from a different subaccount. Check those three before anything else.</p>
            </Callout>

            <h2 id="test">How do I check that they work?</h2>
            <p>
              Fetching your own account record is a safe test because it only reads data and sends nothing. Put the values in environment variables so they don&apos;t end up in your shell history, then run:
            </p>
            <CodeBlock
              title="Terminal"
              code={'export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"\nexport TWILIO_AUTH_TOKEN="your_auth_token"\n\ncurl "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID.json" \\\n  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"'}
            />
            <p>
              Twilio uses HTTP Basic authentication, so the SID is the username and the token is the password. A good reply is JSON that includes your account&apos;s <code>friendly_name</code> and <code>status</code>. A 401 reply with code 20003 means the pair was rejected. Our page on{" "}
              <Link href="/twilio-errors/20003">Twilio error 20003, authentication failed</Link> goes through the causes.
            </p>

            <h2 id="rotate">How do I change my Twilio Auth Token?</h2>
            <p>
              Rotate your token if it may have leaked, if someone with access has left, or as routine upkeep. Twilio gives you a secondary token so you can do this without downtime. Do the steps in this order, because promoting removes the old token straight away:
            </p>
            <ol>
              <li>On the API keys and tokens page, request a secondary Auth Token.</li>
              <li>Reveal it and update every app, script and device that uses the old token.</li>
              <li>Confirm each one still works, using the secondary token.</li>
              <li>Select <strong>Promote to Primary</strong>. The new token becomes the main one and the old one stops working.</li>
            </ol>
            <p>
              You can do the same with the{" "}
              <a href="https://www.twilio.com/docs/iam/api/secondary_authtoken" rel="noopener">
                Secondary Auth Token
              </a>{" "}
              and{" "}
              <a href="https://www.twilio.com/docs/iam/api/authtoken" rel="noopener">
                Auth Token promotion
              </a>{" "}
              endpoints. Two details from Twilio&apos;s docs are worth knowing. Every token change emails all owners and administrators on the account, so a surprise email of this kind deserves a look. And if you hard-coded the token in Twilio Functions, allow one minute for the change to spread, or those functions will fail with a 403.
            </p>

            <h2 id="safe">How do I keep them safe?</h2>
            <p>The Account SID and Auth Token together give full access to your account, including your balance and your numbers. A few habits cover most of the risk:</p>
            <ul>
              <li>Keep them out of source code. Use environment variables or a secrets manager, and add any local <code>.env</code> file to <code>.gitignore</code>.</li>
              <li>Never paste them into a website you don&apos;t trust, a support ticket or a chat.</li>
              <li>Use API keys for your applications, which is what Twilio recommends. You can revoke one key without touching the others. See <Link href="/guides/twilio-auth-token-vs-api-key">Auth Token vs API Key</Link> for how to choose.</li>
              <li>If you think a token leaked, rotate it now, then check your usage logs for calls and texts you don&apos;t recognize.</li>
            </ul>
            <p>
              If you use the credentials with a phone app, check where they&apos;re stored. Dialbubble keeps them in the iPhone Keychain and talks only to Twilio. Our <Link href="/security">security page</Link> explains how that works.
            </p>

            <h2 id="fails">Why isn&apos;t my Auth Token working?</h2>
            <ul>
              <li><strong>Mismatched account:</strong> the SID and the token came from different accounts or subaccounts.</li>
              <li><strong>Old token:</strong> someone promoted a secondary token, so the one you saved no longer exists.</li>
              <li><strong>Wrong region:</strong> credentials are region-specific, so ones made for another region can fail against the default API.</li>
              <li><strong>Test credentials:</strong> Twilio&apos;s <a href="https://www.twilio.com/docs/iam/test-credentials" rel="noopener">test credentials</a> never reach real phones and can&apos;t touch your live numbers, so real sends with them won&apos;t work.</li>
              <li><strong>Suspended account:</strong> if your balance ran out or the account was suspended, sort that out in the Console first.</li>
            </ul>

            <h2 id="faq">Questions about your Twilio credentials</h2>
            <Faq items={faq} />
          </Prose>
        </div>
      </Container>
      <RelatedLinks path={path} />
      <CtaBand
        title="Got your SID and token? Try them on iPhone"
        text="Dialbubble uses your Account SID and Auth Token to call and text through your own Twilio account, and keeps them in the iPhone Keychain. No credentials yet? Demo Mode needs none."
      />
    </>
  );
}

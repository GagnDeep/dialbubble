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

const path = "/guides/twilio-auth-token-vs-api-key";
export const metadata = metaFor(path, { type: "article" });

const toc = [
  { id: "compare", title: "Side by side" },
  { id: "types", title: "The three key types" },
  { id: "leak", title: "What happens in a leak" },
  { id: "example", title: "A worked example" },
  { id: "still", title: "When you still need the token" },
  { id: "switch", title: "Moving to API keys" },
  { id: "faq", title: "Questions" },
];

const faq = [
  {
    q: "Is a Twilio API key more secure than an Auth Token?",
    a: "A key isn't stronger as a password, but it limits the damage. You can give each app its own key, restrict what it can do, and revoke it alone. An Auth Token is a single credential with full access that everything shares.",
  },
  {
    q: "Which should I use for a quick local test?",
    a: "The Auth Token is fine for testing on your own machine, and Twilio's own code samples say so. Twilio recommends API keys for production, so switch before you ship.",
  },
  {
    q: "Can a Standard API key create more API keys?",
    a: "No. Standard keys can't reach the Accounts or Keys resources. If a job truly needs those, it needs a Main key or the Account SID and Auth Token.",
  },
  {
    q: "Does an API key work without the Account SID?",
    a: "You still need the Account SID. It appears in the request URL and helper libraries ask for it alongside the key SID and secret. The key replaces the Auth Token, not the account identifier.",
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
        lede="Use API keys for anything running in production, and keep the Auth Token for local testing and the few jobs that require it. A key can be limited and revoked on its own, while the Auth Token is one master credential that everything shares."
      />
      <Container>
        <div className="toc-layout">
          <TocSidebar items={toc} />
          <Prose>
            <h2 id="compare">What is the difference between a Twilio Auth Token and an API key?</h2>
            <p>
              Both let a program sign in to Twilio&apos;s REST API using HTTP Basic authentication. The difference is how much each one can do and what happens when you have to replace it. Twilio&apos;s{" "}
              <a href="https://www.twilio.com/docs/iam/api-keys" rel="noopener">
                API keys overview
              </a>{" "}
              calls keys the preferred way to authenticate.
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Auth Token and API key compared">
              <table>
                <thead>
                  <tr>
                    <th scope="col">&nbsp;</th>
                    <th scope="col">Auth Token</th>
                    <th scope="col">API key</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Username</th>
                    <td>Account SID (starts AC)</td>
                    <td>Key SID (starts SK)</td>
                  </tr>
                  <tr>
                    <th scope="row">Password</th>
                    <td>Auth Token</td>
                    <td>Key secret</td>
                  </tr>
                  <tr>
                    <th scope="row">How many</th>
                    <td>One primary, plus an optional secondary during rotation</td>
                    <td>As many as you create</td>
                  </tr>
                  <tr>
                    <th scope="row">Access</th>
                    <td>Everything on the account</td>
                    <td>Depends on key type</td>
                  </tr>
                  <tr>
                    <th scope="row">Can you view it again?</th>
                    <td>Yes, in the Console</td>
                    <td>No, the secret is shown once</td>
                  </tr>
                  <tr>
                    <th scope="row">Replacing it</th>
                    <td>Affects everything using the token</td>
                    <td>Affects only what uses that key</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>Here&apos;s the same request with each one. Only the login changes, which is why switching usually takes minutes.</p>
            <CodeBlock
              title="Terminal"
              code={'# With the Auth Token\ncurl "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json?PageSize=1" \\\n  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"\n\n# With an API key\ncurl "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json?PageSize=1" \\\n  -u "$TWILIO_API_KEY:$TWILIO_API_SECRET"'}
            />
            <p>
              Not sure where these values live? See <Link href="/guides/how-to-find-twilio-account-sid-and-auth-token">how to find your Account SID and Auth Token</Link>.
            </p>

            <h2 id="types">What are Main, Standard and Restricted API keys?</h2>
            <p>
              Twilio has three types, listed in its{" "}
              <a href="https://www.twilio.com/docs/iam/api-keys/keys-in-console" rel="noopener">
                Console guide to keys
              </a>
              . Start with the narrowest one that does the job.
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Twilio API key types">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Type</th>
                    <th scope="col">What it can reach</th>
                    <th scope="col">Good for</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Main</td>
                    <td>All API resources, the same as Account SID and Auth Token</td>
                    <td>Tools that manage accounts or other keys</td>
                  </tr>
                  <tr>
                    <td>Standard</td>
                    <td>All resources except Accounts and Keys</td>
                    <td>Most apps that send texts and place calls</td>
                  </tr>
                  <tr>
                    <td>Restricted</td>
                    <td>Only the permissions you tick</td>
                    <td>A service with one job, such as sending messages</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Twilio&apos;s docs say Main keys can be created only in the Console, and Restricted keys are available only in the United States region in the legacy Console flow. Keys are also region-specific, so a key made for one region won&apos;t sign in to another.
            </p>

            <h2 id="leak">Why do they fail differently when one leaks?</h2>
            <p>This is the real reason to care. Imagine your credential ends up in a public code repository.</p>
            <ul>
              <li>
                <strong>Leaked Auth Token:</strong> whoever finds it has full access to the account. To shut them out, you need to rotate the token, and everything using it must be updated before you promote the new one. See the steps for <Link href="/guides/how-to-find-twilio-account-sid-and-auth-token#rotate">changing your Auth Token safely</Link>.
              </li>
              <li>
                <strong>Leaked Standard or Restricted key:</strong> the finder gets only what that key allows. You revoke that one key, make a replacement for that one app, and nothing else is touched.
              </li>
            </ul>
            <Callout type="warning" title="A key still spends your money">
              <p>A Standard key can send texts and place calls, so a leak can still cost you. Treat every secret as sensitive, keep it out of source code, and check your usage logs after any leak.</p>
            </Callout>

            <h2 id="example">A worked example: one account, three programs</h2>
            <p>Say you run a small shop with three things talking to Twilio:</p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Example choice of credentials for three programs">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Program</th>
                    <th scope="col">Credential</th>
                    <th scope="col">Why</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Website order-confirmation texts</td>
                    <td>Restricted key</td>
                    <td>It only has to send messages</td>
                  </tr>
                  <tr>
                    <td>Staff call-back script</td>
                    <td>Standard key</td>
                    <td>It places calls and reads numbers and logs</td>
                  </tr>
                  <tr>
                    <td>Webhook signature check</td>
                    <td>Auth Token</td>
                    <td>Twilio signs webhooks with it, and no key can replace it</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Now the call-back script&apos;s server gets compromised. You revoke its key and issue a new one. The website keeps sending and webhooks keep validating. Had all three shared the Auth Token, you&apos;d be updating all three at once while the attacker still had full access to the account.
            </p>

            <h2 id="still">When do you still need the Auth Token?</h2>
            <p>API keys don&apos;t replace the token everywhere. You&apos;ll need it for:</p>
            <ul>
              <li>
                <strong>Webhook validation.</strong> Twilio signs each webhook request using{" "}
                <a href="https://www.twilio.com/docs/usage/security" rel="noopener">
                  your Auth Token as the key
                </a>
                . Rotating the token means updating your validation code too.
              </li>
              <li>
                <strong>Rotating the token itself.</strong> Twilio&apos;s{" "}
                <a href="https://www.twilio.com/docs/usage/requests-to-twilio" rel="noopener">
                  authentication guide
                </a>{" "}
                shows the promotion and secondary token endpoints using Account SID and Auth Token.
              </li>
              <li>
                <strong>Account and subaccount management.</strong> Those examples use the Account SID and Auth Token too. A Main key is the alternative, but a Standard key can&apos;t reach them.
              </li>
              <li>
                <strong>Any API whose reference asks for it.</strong> Twilio&apos;s rule is to use keys unless a specific page says otherwise.
              </li>
            </ul>

            <h2 id="switch">How do I move from an Auth Token to an API key?</h2>
            <ol>
              <li>In the Console, open the API keys and tokens page under your account settings, and choose your region.</li>
              <li>Create a key, name it after the app that will use it, and pick Standard or Restricted.</li>
              <li>Copy the secret right away. Twilio shows it only once.</li>
              <li>Change your app to use the key SID and secret, and keep the Account SID in your request URL.</li>
              <li>Deploy, then make a real test request. A rejected login returns <Link href="/twilio-errors/20003">error 20003</Link>.</li>
              <li>If the old token was widely shared, rotate it now, so old copies stop working. Update webhook validation at the same time.</li>
            </ol>
            <p>
              You can check you copied a key correctly using the <Link href="/tools/twilio-credentials-format-checker">credentials format checker</Link>, which never sends what you type anywhere.
            </p>
            <p>
              Using a phone app rather than your own code? The same logic applies. Dialbubble accepts either your Auth Token or a Standard API key. A Standard key is a sensible choice because you can revoke that one phone without disturbing anything else. Restricted keys aren&apos;t the right fit, since the app needs broad access. Read how Dialbubble stores them on the <Link href="/security">security page</Link>.
            </p>

            <h2 id="faq">Questions about Twilio API keys</h2>
            <Faq items={faq} />
          </Prose>
        </div>
      </Container>
      <RelatedLinks path={path} />
      <CtaBand
        title="One Standard key for one iPhone"
        text="Create a Standard API key just for Dialbubble and revoke it any time without touching your other apps. Want a look first? Demo Mode needs no credentials at all."
      />
    </>
  );
}

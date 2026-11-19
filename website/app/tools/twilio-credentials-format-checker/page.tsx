import Link from "next/link";
import { Callout } from "@/components/Callout";
import { CodeBlock } from "@/components/CodeBlock";
import { ToolShell } from "@/components/ToolShell";
import { metaFor } from "@/lib/registry";
import { JsonLd, howToLd } from "@/lib/seo";
import { ToolCta } from "../_components/ToolCta";
import { Checker } from "./Checker";

const path = "/tools/twilio-credentials-format-checker";
export const metadata = metaFor(path);

const faq = [
  {
    q: "What does a Twilio Account SID look like?",
    a: "It's 34 characters: the letters AC followed by 32 hexadecimal characters. A made-up example with the right shape is ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa. Twilio's sample code often shows ACXXXXXXXX instead, which is a placeholder that won't work.",
  },
  {
    q: "Is the Account SID a secret?",
    a: "It isn't a password, because it can't authenticate you by itself, and it appears in every API URL. It does identify your account, so it's still best not to post it publicly. The Auth Token and API key secrets are the true secrets, and they should never be shared.",
  },
  {
    q: "Where do I find my Auth Token?",
    a: "In the Twilio Console, on the account dashboard, in the Account Info section. Our guide on finding your Account SID and Auth Token has the full steps.",
  },
  {
    q: "Should I use an Auth Token or an API key?",
    a: "An API key, where you can. Twilio's docs call API keys the preferred way to authenticate with its REST APIs. You can create one for each app or person, restrict what it can do, and revoke it without affecting anything else. Rotating an Auth Token affects everything that uses it.",
  },
  {
    q: "Does a pass here mean my credentials work?",
    a: "No. This page only checks the format. A deleted key, a suspended account or a token that was rotated yesterday all pass as long as their shape is right. Only a real request to Twilio can show whether a credential works, and this page never makes one.",
  },
  {
    q: "What should I do if I've leaked my Auth Token?",
    a: "Rotate it in the Twilio Console straight away, then update everything that uses it. Check your usage and logs for activity you don't recognize. Removing a token from a code commit isn't enough, because it stays in the history and may already have been copied.",
  },
];

const envExample = `# .env (keep this file out of version control)
TWILIO_ACCOUNT_SID=ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
TWILIO_API_KEY_SID=SKaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
TWILIO_API_KEY_SECRET=put-your-secret-here`;

const nodeExample = `import twilio from "twilio";

const client = twilio(process.env.TWILIO_API_KEY_SID, process.env.TWILIO_API_KEY_SECRET, {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
});`;

export default function Page() {
  return (
    <>
      <JsonLd
        data={howToLd({
          name: "Check the format of Twilio credentials",
          description: "Check whether a Twilio Account SID, API key or token has the right format, without sending it anywhere.",
          path,
          steps: [
            { name: "Paste the value you're unsure of", text: "Use the matching field. For secrets, use a made-up value of the same shape if you only want to check how the format works." },
            { name: "Read the result", text: "Each field says whether the format is right, and what's wrong if it isn't." },
            { name: "Fix the problem", text: "Remove stray spaces or quotes, or swap values that went in the wrong setting." },
            { name: "Clear the fields", text: "Press Clear everything when you're done." },
          ],
        })}
      />
      <ToolShell
        path={path}
        title="Twilio credentials format checker"
        intro="Check whether a Twilio Account SID, API key SID or token has the right format. This runs entirely in your browser and only checks the shape of the text, so it can't tell you whether a credential works."
        faq={faq}
        seo={
          <>
            <h2 id="what-format">What format do Twilio credentials use?</h2>
            <p>
              An Account SID is AC plus 32 hexadecimal characters, 34 in total. An API key SID is SK plus 32 hexadecimal characters. An Auth Token and an API key secret are each 32 characters. Hexadecimal means only the digits 0 to 9 and the letters a to f.
            </p>
            <table>
              <thead>
                <tr>
                  <th scope="col">Credential</th>
                  <th scope="col">Format</th>
                  <th scope="col">Secret?</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Account SID</td>
                  <td>AC + 32 hex</td>
                  <td>No, but keep it private</td>
                </tr>
                <tr>
                  <td>Auth Token</td>
                  <td>32 characters</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td>API key SID</td>
                  <td>SK + 32 hex</td>
                  <td>No, but keep it private</td>
                </tr>
                <tr>
                  <td>API key secret</td>
                  <td>32 characters</td>
                  <td>Yes, and shown only once</td>
                </tr>
              </tbody>
            </table>
            <p>
              Every Twilio resource has a SID with a two-letter prefix that tells you its type. CA is a call, SM is a message, MG is a Messaging Service and PN is a phone number. So if you paste one of those into the Account SID field, this tool can tell you what you&apos;ve actually got. <Link href="/guides/how-to-find-twilio-account-sid-and-auth-token">Our guide to finding your Account SID and Auth Token</Link> shows where each value lives in the Console.
            </p>

            <h2 id="safety">Is it safe to paste my Auth Token here?</h2>
            <p>
              You shouldn&apos;t need to, and we&apos;d rather you didn&apos;t. A format problem can be spotted from the Account SID or by counting characters, and you can test how the check behaves with a made-up value. The token is the key to your account and your money, so the habit worth building is to never paste it into any web page.
            </p>
            <p>
              To be clear about what this page does: the check is a few lines of code in your browser. The fields aren&apos;t saved, they&apos;re never added to the URL, and the site&apos;s content security policy blocks connections to other servers. We&apos;ve also marked the fields to discourage password managers from storing them. But you can&apos;t verify all of that at a glance on any website, including this one, which is exactly why the habit matters.
            </p>

            <h2 id="account-sid-required">How do I fix &ldquo;account SID is required&rdquo;?</h2>
            <p>This family of errors usually means your code didn&apos;t receive the credential, and not that the credential is wrong. Work through these in order.</p>
            <ul>
              <li>
                <strong>The environment variable isn&apos;t loaded.</strong> If your code reads <code>TWILIO_ACCOUNT_SID</code> and it&apos;s empty, the SDK has nothing to use. Twilio&apos;s Node helper reports this as <code>username is required</code>, since the SID is the username for basic authentication. Check that your .env file is being read and that the variable name matches exactly.
              </li>
              <li>
                <strong>An API key is in the Account SID slot.</strong> The Node helper reports <code>accountSid must start with AC</code>. If what you passed starts with SK, you also have to give the Account SID as a separate option, as in the example below.
              </li>
              <li>
                <strong>The value has picked up extra characters.</strong> Quotes in a .env file, a trailing newline or a space from copying are all common. The checker above flags these.
              </li>
              <li>
                <strong>You still have a placeholder.</strong> ACXXXXXXXX and <code>your_auth_token</code> come from sample code, and the checker flags those too.
              </li>
            </ul>
            <p>
              If the format is right and Twilio still rejects it, you&apos;ll probably see an authentication error rather than a format error. <Link href="/twilio-errors">Our list of Twilio errors</Link> explains the codes in plain English.
            </p>

            <h2 id="worked-example">Worked example: moving from an Auth Token to an API key</h2>
            <p>
              Suppose you&apos;ve got an app using your Auth Token and you want to limit the risk. Create an API key in the Twilio Console. Twilio offers Main, Standard and Restricted keys, and for most apps a Standard or Restricted key is enough. Copy the SK value and the secret right away, because <a href="https://www.twilio.com/docs/iam/api-keys/key-resource-v2010" rel="noopener">Twilio returns the secret only once</a>. Then set your environment:
            </p>
            <CodeBlock title=".env" code={envExample} />
            <p>Pass the key to the SDK, with the Account SID as an option:</p>
            <CodeBlock title="Node.js" language="javascript" code={nodeExample} />
            <p>
              If a key leaks, you revoke that one key and nothing else breaks. Our comparison of the <Link href="/guides/twilio-auth-token-vs-api-key">Auth Token and API keys</Link> goes further into when to use each one. If you&apos;re still on a trial account, the <Link href="/guides/is-twilio-free-trial-limits">trial limits guide</Link> explains what to expect. And for testing without any charges, Twilio&apos;s{" "}
              <a href="https://www.twilio.com/docs/iam/test-credentials" rel="noopener">
                test credentials
              </a>{" "}
              let you make API requests that don&apos;t bill your account or reach real phones.
            </p>
            <Callout type="warning" title="This tool checks format only">
              <p>A value that passes can still be expired, revoked or belong to someone else. A value that fails here is worth copying again from the Console before you look for any other cause.</p>
            </Callout>
          </>
        }
      >
        <Checker />
        <ToolCta
          title="A safer home for your credentials"
          text="Dialbubble keeps your Twilio credentials in the iPhone Keychain, sends them only to Twilio, and has no server of its own. It's happy to use an API key, and Demo Mode needs no credentials at all."
          linkHref="/security"
          linkText="Read how Dialbubble handles your credentials"
        />
      </ToolShell>
    </>
  );
}

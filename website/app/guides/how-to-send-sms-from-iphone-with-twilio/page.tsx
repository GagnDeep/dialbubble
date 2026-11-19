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

const path = "/guides/how-to-send-sms-from-iphone-with-twilio";
export const metadata = metaFor(path, { type: "article" });

const PRICING = "https://www.twilio.com/en-us/sms/pricing/us";

const shortcutSettings = `Action: Get Contents of URL

URL
https://api.twilio.com/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Messages.json

Method: POST

Headers
Authorization: Basic [Base64 Encoded result]

Request Body: Form
To:   +12025550123
From: +12025550142
Body: [Ask for Input result]`;

const curlEquivalent = `curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \\
  --data-urlencode "To=+12025550123" \\
  --data-urlencode "From=+12025550142" \\
  --data-urlencode "Body=On my way, see you at 3." \\
  -u "$TWILIO_API_KEY:$TWILIO_API_SECRET"`;

const steps = [
  { name: "Check your account can send", text: "Upgrade from the trial, because free-text SMS is not allowed on it, and register or verify your number for US traffic." },
  { name: "Create an API key", text: "Make a Standard API key in the Twilio Console and copy its SID and secret. You can revoke it later without touching your main credentials." },
  { name: "Build the login text", text: "In a new Shortcut, add a Text action containing the key SID, a colon and the secret, then add a Base64 Encode action." },
  { name: "Ask what to send", text: "Add an Ask for Input action so that the Shortcut prompts you for the message each time." },
  { name: "Call Twilio", text: "Add Get Contents of URL, set the method to POST, add the Authorization header, and set a Form body with To, From and Body." },
  { name: "Run it and read the result", text: "Add Show Result, run the Shortcut, and look for a status of queued in the answer. An error code tells you what to fix." },
];

const toc = [
  { id: "options", title: "Three ways, compared" },
  { id: "first", title: "What you need first" },
  { id: "console", title: "Option 1: the Console in Safari" },
  { id: "shortcut", title: "Option 2: an iPhone Shortcut" },
  { id: "app", title: "Option 3: an app" },
  { id: "cost", title: "Can you send for free?" },
  { id: "fails", title: "If your text doesn't arrive" },
  { id: "faq", title: "Questions" },
];

const faq = [
  {
    q: "Can I send a Twilio text from the iPhone Messages app?",
    a: "No. The Messages app sends through your SIM or iMessage. A Twilio number lives in your Twilio account, so another app or a web request has to ask Twilio to send the text.",
  },
  {
    q: "Can I send SMS from my iPhone with Twilio for free?",
    a: "Not in any lasting way. The 30-day trial covers 100 SMS, but only predefined templates to verified numbers. Your own wording needs an upgraded account, and Twilio then charges per segment.",
  },
  {
    q: "Is it safe to put Twilio credentials in a Shortcut?",
    a: "It's stored in the Shortcut as plain text, so use an API key rather than your Auth Token, and never share that Shortcut. If it's ever exposed, revoke the key in the Console.",
  },
  {
    q: "How do I see replies on my iPhone?",
    a: "Replies stay in Twilio until something reads them. You can check the Console logs, or use an app that reads them from your account. Dialbubble checks every 20 seconds while open and doesn't send push notifications for texts.",
  },
];

export default function Page() {
  const entry = getEntry(path)!;
  return (
    <>
      <JsonLd data={howToLd({ name: "How to send SMS from an iPhone with a Twilio Shortcut", description: entry.description, path, steps })} />
      <Breadcrumbs path={path} />
      <PageHero
        eyebrow="Guide"
        title={entry.title}
        lede="You can send SMS from an iPhone with Twilio in three ways: the Twilio Console in Safari, an iPhone Shortcut that calls Twilio's API, or an app connected to your account. All three need an upgraded Twilio account, and none of them goes through the Messages app, because your Twilio number isn't on your SIM."
      />
      <Container>
        <div className="toc-layout">
          <TocSidebar items={toc} />
          <Prose>
            <h2 id="options">Three ways to text from your Twilio number, compared</h2>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Ways to send SMS from an iPhone with Twilio">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Method</th>
                    <th scope="col">Best for</th>
                    <th scope="col">Setup</th>
                    <th scope="col">See replies?</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Console in Safari</th>
                    <td>A one-off text</td>
                    <td>None, just sign in</td>
                    <td>In the logs</td>
                  </tr>
                  <tr>
                    <th scope="row">Shortcut</th>
                    <td>Sending the same kind of text often, or by Siri</td>
                    <td>A short build, one per sender</td>
                    <td>No</td>
                  </tr>
                  <tr>
                    <th scope="row">App</th>
                    <td>Regular back-and-forth texting</td>
                    <td>Add your credentials</td>
                    <td>Depends on the app</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Each one makes the same request to Twilio, and Twilio&apos;s prices are the same however you send. If you&apos;d like the background, read{" "}
              <Link href="/guides/how-does-twilio-sms-work">how Twilio SMS works</Link>.
            </p>

            <h2 id="first">What do you need first?</h2>
            <ul>
              <li>
                <strong>An upgraded account.</strong> On a trial, Twilio only sends{" "}
                <a href="https://www.twilio.com/docs/usage/trials" rel="noopener">
                  predefined templates to verified numbers
                </a>
                , so you can&apos;t type your own message. See <Link href="/guides/is-twilio-free-trial-limits">Twilio&apos;s trial limits</Link>.
              </li>
              <li>
                <strong>A number that&apos;s allowed to text.</strong> To reach US phones from a local number, you need{" "}
                <Link href="/guides/a2p-10dlc-registration-guide">A2P 10DLC registration</Link>, or you&apos;ll get <Link href="/twilio-errors/30034">error 30034</Link>. A toll-free number needs
                its own verification. Texting from an iPhone doesn&apos;t change this, since carriers treat all Twilio traffic the same way.
              </li>
              <li>
                <strong>Numbers in the right format.</strong> Twilio wants <Link href="/guides/e164-phone-number-format">E.164 format</Link>, such as <code>+12025550123</code>.
              </li>
            </ul>

            <h2 id="console">Option 1: How to send from the Console in Safari</h2>
            <p>This takes no setup, so it&apos;s the best way to check that your account can send at all.</p>
            <ol>
              <li>Open the Twilio Console in Safari and sign in.</li>
              <li>
                Find the Messaging section and its <strong>Try it out</strong> or <strong>Send an SMS</strong> page. Menus differ between Console versions, and the site is built for bigger
                screens, so you may need to zoom.
              </li>
              <li>Enter the recipient, choose your number as the sender, and type the message.</li>
              <li>Send it, then check the status in the Messaging logs.</li>
            </ol>

            <h2 id="shortcut">Option 2: How to build an iPhone Shortcut that texts through Twilio</h2>
            <p>
              Apple&apos;s Shortcuts app can call web APIs, and it&apos;s already on your iPhone. This version asks what to say, then sends it to one fixed person, which suits something like texting a
              client or your team. It&apos;s also a useful example of how simple the API is.
            </p>
            <ol>
              <li>
                <strong>Create an API key.</strong> In the Twilio Console, create a Standard API key and copy its SID (starts with <code>SK</code>) and secret. An{" "}
                <Link href="/guides/twilio-auth-token-vs-api-key">API key is safer here than your Auth Token</Link>, because you can revoke it on its own.
              </li>
              <li>
                <strong>Build the login text.</strong> In Shortcuts, tap + and add a <strong>Text</strong> action containing your key SID, a colon, then your secret, with no spaces. Add a{" "}
                <strong>Base64 Encode</strong> action after it. If it offers a line breaks option, choose None.
              </li>
              <li>
                <strong>Ask what to send.</strong> Add <strong>Ask for Input</strong> with the prompt &quot;Message&quot;.
              </li>
              <li>
                <strong>Call Twilio.</strong> Add <strong>Get Contents of URL</strong> and expand its options. Fill it in as shown below, using your own Account SID in the URL, which starts with{" "}
                <code>AC</code>. Insert the two results as variables where the square brackets are.
              </li>
              <li>
                <strong>Run it and read the result.</strong> Add <strong>Show Result</strong> at the end. A working send returns details including <code>&quot;status&quot;: &quot;queued&quot;</code>. An error returns a code you can look up in our <Link href="/twilio-errors">Twilio error guide</Link>.
              </li>
            </ol>
            <CodeBlock title="Shortcut settings (fictional numbers)" code={shortcutSettings} />
            <p>That is the same as this curl request, which is handy for testing on a computer if the Shortcut misbehaves:</p>
            <CodeBlock title="The same request with curl" code={curlEquivalent} />
            <Callout type="warning" title="Keep this Shortcut private">
              <p>
                The key sits in the Shortcut as plain text, so anyone you share it with can send texts on your bill. Don&apos;t share it, and revoke the key in the Console if you think it&apos;s leaked.
              </p>
            </Callout>
            <p>
              To send at a later time, a Shortcut can add <code>MessagingServiceSid</code>, <code>ScheduleType</code> and <code>SendAt</code>. Our guide on{" "}
              <Link href="/guides/how-to-schedule-sms-with-twilio">how to schedule SMS with Twilio</Link> has the rules.
            </p>

            <h2 id="app">Option 3: Using an app</h2>
            <p>
              If you text regularly, you&apos;ll want an inbox rather than a one-way Shortcut. Check three things before you give any app your credentials: where it stores them, whether it runs them through its own server, and whether it adds a fee on top of Twilio&apos;s rates.
            </p>
            <p>
              <Link href="/twilio-sms-app">Dialbubble</Link>, the app made by this site, is built for this. It&apos;s a free iPhone app that talks directly to Twilio, keeps your credentials in the iPhone Keychain, and adds no markup. It covers a text inbox, MMS, templates, scheduled texts and Shortcuts. It has limits too:
            </p>
            <ul>
              <li>There&apos;s no instant push for incoming texts. It checks every 20 seconds while it&apos;s open, and optional alerts while it&apos;s closed run when iOS allows a background check.</li>
              <li>MMS needs a public https link to the image, as it doesn&apos;t host files for you.</li>
              <li>Scheduled texts need a Messaging Service.</li>
              <li>It&apos;s iPhone only, and it can&apos;t get around the trial limits or registration above.</li>
            </ul>

            <h2 id="cost">Can you send SMS from an iPhone with Twilio for free?</h2>
            <p>
              Only in the trial, and only with templates. Everything else is pay-as-you-go. As of November 2026,{" "}
              <a href={PRICING} rel="noopener">
                Twilio&apos;s US pricing
              </a>{" "}
              is $0.0083 per segment plus a carrier fee, and a US local number is $1.15 a month. Say you send 200 one-segment texts in a month, all to Verizon customers, whose carrier fee is $0.005:
            </p>
            <ul>
              <li>Texts: 200 x ($0.0083 + $0.005) = $2.66</li>
              <li>Number: $1.15</li>
              <li>
                <strong>Total: $3.81</strong>, plus your <Link href="/guides/a2p-10dlc-registration-guide">registration fees</Link>
              </li>
            </ul>
            <p>
              An emoji or a long message can raise that by splitting a text into more segments. The <Link href="/tools/sms-segment-calculator">SMS segment calculator</Link> shows the count before you send.
            </p>

            <h2 id="fails">What if your text doesn&apos;t arrive?</h2>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Common errors when texting from an iPhone with Twilio">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Error</th>
                    <th scope="col">Usual cause on a phone</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><Link href="/twilio-errors/20003">20003</Link></td>
                    <td>A credential typo, a stray space in the login text, or a revoked key</td>
                  </tr>
                  <tr>
                    <td><Link href="/twilio-errors/21211">21211</Link></td>
                    <td>A contact&apos;s number with spaces or no plus and country code</td>
                  </tr>
                  <tr>
                    <td><Link href="/twilio-errors/21608">21608</Link></td>
                    <td>Your trial account is trying to reach an unverified number</td>
                  </tr>
                  <tr>
                    <td><Link href="/twilio-errors/30034">30034</Link></td>
                    <td>The number isn&apos;t linked to an approved A2P campaign</td>
                  </tr>
                  <tr>
                    <td><Link href="/twilio-errors/30007">30007</Link></td>
                    <td>Twilio or a carrier filtered the text. See <Link href="/guides/fix-twilio-error-30007">how to fix it</Link></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 id="faq">Questions</h2>
            <Faq items={faq} />
          </Prose>
        </div>
      </Container>
      <RelatedLinks path={path} />
      <CtaBand
        title="An inbox for your Twilio number"
        text="Dialbubble gives your Twilio number a text inbox on iPhone, free and with no markup. It doesn't push incoming texts, as it checks every 20 seconds while open. You can look around in Demo Mode with no Twilio account."
      />
    </>
  );
}

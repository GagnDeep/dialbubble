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

const path = "/guides/twilio-regulatory-bundle-guide";
export const metadata = metaFor(path, { type: "article" });

const GUIDELINES = "https://www.twilio.com/en-us/guidelines/regulatory";
const CONSOLE_GUIDE = "https://www.twilio.com/docs/phone-numbers/regulatory/getting-started/console-create-new-bundle";
const FAQ_URL = "https://www.twilio.com/docs/phone-numbers/regulatory/faq";

const steps = [
  { name: "Look up the rules", text: "Open Twilio's phone number regulations, choose the country, then find your number type (such as mobile) and whether you're an individual or a business." },
  { name: "Gather your documents", text: "Collect the listed proof of identity and address. Check that names and addresses match exactly across every document and that nothing has expired." },
  { name: "Start the bundle", text: "In the current Console, go to Communications, then Trust Hub, then Registrations, select the Regulatory Compliance tab and choose Create registration. In the legacy Console, go to Phone Numbers, then Regulatory Compliance, then Bundles." },
  { name: "Describe the number and its user", text: "Choose the country, number type and whether it's for an individual or a business. Twilio saves a draft as you move through the form." },
  { name: "Add your details and submit", text: "Enter the end-user information, upload your supporting documents, and select Submit for review." },
  { name: "Wait for the review", text: "Review generally takes up to three business days, but can take several weeks in some regions. Twilio emails you when the status changes to Approved." },
  { name: "Assign the bundle to a number", text: "Select the approved bundle when you buy a number, or on an existing number's Regulatory Information tab. Only approved bundles matching the number type appear in the list." },
  { name: "Wait for the number review", text: "Twilio reviews the bundle and number together, usually in up to three business days. You're finished when the number's status is Compliant." },
];

const toc = [
  { id: "what", title: "What it means" },
  { id: "inside", title: "What's in a bundle" },
  { id: "examples", title: "Requirements by country" },
  { id: "steps", title: "Get one approved" },
  { id: "example", title: "A worked example" },
  { id: "status", title: "Status values" },
  { id: "rejected", title: "Why bundles get rejected" },
  { id: "api", title: "Using the API" },
  { id: "faq", title: "Questions" },
];

const faq = [
  {
    q: "Do I need a regulatory bundle for US numbers?",
    a: "No. Twilio says regulatory compliance registrations aren't required for US phone numbers. Texting US phones from a local number needs A2P 10DLC registration, which is a separate process.",
  },
  {
    q: "Can I use a P.O. box or virtual address?",
    a: "Not as proof of a local address. Twilio's regulatory FAQ says it can't accept a document showing a P.O. box or virtual address for that purpose.",
  },
  {
    q: "How old can my documents be?",
    a: "If the country page sets a time limit, that applies. Otherwise Twilio prefers address documents such as utility bills to be dated within three months of submission, and other documents within one year.",
  },
  {
    q: "What if I can't meet the requirements?",
    a: "Look at another number type in that country, since requirements differ by type. For example, Australia lets a business use an address anywhere in the world for a mobile number. If nothing fits, contact Twilio Support.",
  },
  {
    q: "Can I reuse documents for another bundle?",
    a: "Yes. While creating a bundle, you can select existing individual or business information and existing supporting documents. If a document is more than a year old, you'll need to upload a new one.",
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
        lede="An approved mobile regulatory bundle is a set of identity and address details that Twilio has reviewed and approved for mobile numbers in one specific country. You need one that matches the country, number type and user type before you can buy or keep a regulated number there."
      />
      <Container>
        <div className="toc-layout">
          <TocSidebar items={toc} />
          <Prose>
            <Callout type="warning" title="This isn't legal advice">
              <p>
                This guide explains Twilio&apos;s process in plain language, as of November 2026. Rules vary by country and change often. Check <a href={GUIDELINES} rel="noopener">Twilio&apos;s regulations page</a> for your country, and speak to a qualified adviser about your own obligations.
              </p>
            </Callout>

            <h2 id="what">What does &quot;approved mobile regulatory bundle&quot; mean?</h2>
            <p>
              Each word does a job. A <strong>bundle</strong> packages who will use the number with documents that prove it. <strong>Regulatory</strong> means a country&apos;s rules require it. <strong>Mobile</strong> is the number type it was made for, so a bundle for local numbers won&apos;t cover a mobile one. <strong>Approved</strong> is the status it needs: Twilio&apos;s <a href={CONSOLE_GUIDE} rel="noopener">Console guide</a> says only approved bundles matching the number type appear when you assign one, and a rejected or pending bundle can&apos;t be mapped.
            </p>
            <p>
              Why it exists: governments treat phone numbers as a national resource and want to know who is using each one and where they are. Twilio warns that numbers without the right information risk being disconnected.
            </p>
            <p>
              You&apos;ll need one for most numbers outside the US and Canada. Twilio&apos;s <a href="https://www.twilio.com/docs/numbers-and-senders/phone-number-senders" rel="noopener">number setup guide</a> says to submit your registration before buying a non-US number. US numbers don&apos;t need one, though US texting has <Link href="/guides/a2p-10dlc-registration-guide">its own A2P 10DLC registration</Link>.
            </p>

            <h2 id="inside">What goes in a regulatory bundle?</h2>
            <ul>
              <li><strong>End-user information:</strong> the person or business that will actually use the number. Twilio defines end users as the people who answer the calls or receive the messages.</li>
              <li><strong>Supporting documents:</strong> proof of identity, such as a passport or a company registration, and proof of address, such as a utility bill.</li>
              <li><strong>An address:</strong> some numbers need only an address, some need only a bundle, and some need both. The country page tells you which.</li>
            </ul>

            <h2 id="examples">What are the mobile requirements in different countries?</h2>
            <p>Requirements really do differ. Here are three examples as of November 2026. Prices are monthly, in US dollars, where Twilio&apos;s pricing page lists them clearly.</p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Mobile number requirements by country">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Country</th>
                    <th scope="col">Individual</th>
                    <th scope="col">Business</th>
                    <th scope="col">Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><a href="https://www.twilio.com/en-us/guidelines/gb/regulatory" rel="noopener">United Kingdom</a></td>
                    <td>Government ID or passport. Valid address anywhere, no address document.</td>
                    <td>Business address anywhere, plus a senior authorized representative.</td>
                    <td><a href="https://www.twilio.com/en-us/voice/pricing/gb" rel="noopener">$2.50</a></td>
                  </tr>
                  <tr>
                    <td><a href="https://www.twilio.com/en-us/guidelines/de/regulatory" rel="noopener">Germany</a></td>
                    <td>Not available to individuals.</td>
                    <td>German address, no P.O. box, with a document such as a commercial register excerpt.</td>
                    <td><a href="https://www.twilio.com/en-us/voice/pricing/de" rel="noopener">$30.00</a></td>
                  </tr>
                  <tr>
                    <td><a href="https://www.twilio.com/en-us/guidelines/au/regulatory" rel="noopener">Australia</a></td>
                    <td>ID plus proof of an address within Australia.</td>
                    <td>Proof of identity, address (anywhere in the world) and business ID.</td>
                    <td>See <a href="https://www.twilio.com/en-us/voice/pricing/au" rel="noopener">Australia pricing</a></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Budgeting across countries? See <Link href="/guides/how-much-does-a-twilio-phone-number-cost">how much a Twilio phone number costs</Link>.
            </p>

            <h2 id="steps">How do I get a regulatory bundle approved?</h2>
            <ol>
              {steps.map((step) => (
                <li key={step.name}>
                  <strong>{step.name}.</strong> {step.text}
                </li>
              ))}
            </ol>
            <p>
              Notice there are two reviews: one for the bundle and one for its link to a number. Changing a number&apos;s mapping later restarts that second review. These steps follow Twilio&apos;s <a href={CONSOLE_GUIDE} rel="noopener">Console guide</a> and its <a href="https://www.twilio.com/docs/trust-hub/registrations/regulatory-compliance" rel="noopener">Trust Hub instructions</a>.
            </p>

            <h2 id="example">A worked example: a UK mobile number</h2>
            <p>
              Priya is a freelance tutor in Manchester who wants a UK mobile number for client calls. Using the UK rules in the table above, here&apos;s what she does:
            </p>
            <ol>
              <li>Selects United Kingdom, Mobile and Individual, and sees she needs proof of identity and a valid address.</li>
              <li>Prepares her passport, checking it hasn&apos;t expired and that every page she uploads can be read.</li>
              <li>Enters her name exactly as printed in the passport, including any middle name.</li>
              <li>Gives a contact mobile number. The UK rules say it can&apos;t be a number from a provider such as Twilio, so she uses her personal cell.</li>
              <li>Submits, gets the approval email, picks a number at $2.50 a month as of November 2026 (<a href="https://www.twilio.com/en-us/voice/pricing/gb" rel="noopener">UK pricing</a>), and assigns the bundle.</li>
            </ol>
            <p>Priya and her details are made up. Your country may ask for more, so always follow the current country page.</p>

            <h2 id="status">What do the regulatory bundle statuses mean?</h2>
            <p>
              You&apos;ll see one status on the bundle and another on the number. The API uses the names below, from Twilio&apos;s <a href="https://www.twilio.com/docs/phone-numbers/regulatory/api/bundles" rel="noopener">Bundles reference</a>, and the Console shows friendlier versions such as Approved.
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Bundle and number status values">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Status</th>
                    <th scope="col">Applies to</th>
                    <th scope="col">What it means</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td><code>draft</code></td><td>Bundle</td><td>Still editable, and can be deleted</td></tr>
                  <tr><td><code>pending-review</code></td><td>Bundle</td><td>Submitted, waiting for Twilio</td></tr>
                  <tr><td><code>in-review</code></td><td>Bundle</td><td>Twilio is reviewing it</td></tr>
                  <tr><td><code>twilio-approved</code></td><td>Bundle</td><td>Meets the rules, ready to assign</td></tr>
                  <tr><td><code>twilio-rejected</code></td><td>Bundle</td><td>Doesn&apos;t meet the rules, fix and resubmit</td></tr>
                  <tr><td>Compliant</td><td>Number</td><td>Bundle and number verified together, so you&apos;re done</td></tr>
                  <tr><td>Not Compliant</td><td>Number</td><td>The mapping failed review and needs fixing</td></tr>
                  <tr><td>Provisionally Approved</td><td>Number</td><td>Numbers needing only an address get this status</td></tr>
                </tbody>
              </table>
            </div>

            <h2 id="rejected">Why was my regulatory bundle rejected?</h2>
            <p>
              The Console shows the reason on the bundle page. Twilio&apos;s article on <a href="https://support.twilio.com/hc/en-us/articles/16066152436507-Understanding-Regulatory-Bundle-Rejections" rel="noopener">bundle rejections</a> and its <a href={FAQ_URL} rel="noopener">regulatory FAQ</a> point to these common problems:
            </p>
            <ul>
              <li><strong>Names don&apos;t match:</strong> the name on a document differs from what you typed. It must match exactly.</li>
              <li><strong>Expired or undated documents:</strong> the document has expired or shows no expiry date.</li>
              <li><strong>Hard to read:</strong> documents must be legible and unredacted.</li>
              <li><strong>Too old:</strong> a proof of address outside the allowed window, often three months.</li>
              <li><strong>Wrong address type:</strong> a P.O. box or virtual address where a local address is needed.</li>
            </ul>
            <p>
              To fix it, read the reason, remove any rejected document, upload a replacement and resubmit. A bundle can also be rejected later when rules change. <a href="https://www.twilio.com/docs/api/errors/22601" rel="noopener">Error 22601</a> means this has happened. Your existing numbers keep working, but you have to update and resubmit the bundle to buy new ones with it.
            </p>

            <h2 id="api">How do bundles work with the API?</h2>
            <p>
              Developers can look up the requirements for a number type, then pass the approved bundle&apos;s SID when buying. Bundle SIDs start with BU and address SIDs with AD. Twilio&apos;s <a href="https://www.twilio.com/docs/phone-numbers/regulatory/getting-started/create-new-bundle-public-rest-apis" rel="noopener">REST API guide</a> covers creating a bundle from scratch.
            </p>
            <CodeBlock
              title="Check the rules, then buy with a bundle"
              code={'curl "https://numbers.twilio.com/v2/RegulatoryCompliance/Regulations?IsoCountry=GB&NumberType=mobile&EndUserType=individual" \\\n  -u "$TWILIO_API_KEY:$TWILIO_API_SECRET"\n\ncurl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/IncomingPhoneNumbers.json" \\\n  --data-urlencode "PhoneNumber=+447700900123" \\\n  --data-urlencode "BundleSid=BUxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \\\n  --data-urlencode "AddressSid=ADxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \\\n  -u "$TWILIO_API_KEY:$TWILIO_API_SECRET"'}
            />
            <p>
              Buying without the right bundle returns <a href="https://www.twilio.com/docs/api/errors/21649" rel="noopener">error 21649</a>, and a missing address returns <a href="https://www.twilio.com/docs/api/errors/21631" rel="noopener">error 21631</a>.
            </p>
            <p>
              Once your number is Compliant, it works like any other Twilio number. See <Link href="/guides/how-to-use-a-twilio-phone-number">how to use a Twilio phone number</Link> for forwarding, calls and texts. If you&apos;re calling abroad, read about <Link href="/guides/international-calling-on-iphone-with-your-own-number">international calling on iPhone</Link> too. Dialbubble can use a compliant number for calls and texts, but it doesn&apos;t create or file bundles. You do that with Twilio.
            </p>

            <h2 id="faq">Questions about Twilio regulatory bundles</h2>
            <Faq items={faq} />
          </Prose>
        </div>
      </Container>
      <RelatedLinks path={path} />
      <CtaBand
        title="Bundle approved? Put the number to work"
        text="Once your number is compliant, Dialbubble lets you call and text from it on your iPhone through your own Twilio account. The paperwork stays with Twilio. Try Demo Mode with no account."
      />
    </>
  );
}

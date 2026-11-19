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

const path = "/guides/e164-phone-number-format";
export const metadata = metaFor(path, { type: "article" });

const E164 = "https://www.twilio.com/docs/glossary/what-e164";
const LOOKUP = "https://www.twilio.com/docs/lookup/v2-api";

const lookupRequest = `curl "https://lookups.twilio.com/v2/PhoneNumbers/2025550142?CountryCode=US" \\
  -u "$TWILIO_API_KEY:$TWILIO_API_SECRET"`;

const lookupResponse = `{
  "calling_country_code": "1",
  "country_code": "US",
  "phone_number": "+12025550142",
  "national_format": "(202) 555-0142",
  "valid": true,
  "validation_errors": null
}`;

const encodedRight = `# Right: curl encodes the + for you
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \\
  --data-urlencode "To=+12025550123" \\
  --data-urlencode "From=+12025550142" \\
  --data-urlencode "Body=Hello" \\
  -u "$TWILIO_API_KEY:$TWILIO_API_SECRET"

# Wrong: in form data, a bare + can be read as a space
#   -d "To=+12025550123"`;

const toc = [
  { id: "format", title: "What E.164 looks like" },
  { id: "us", title: "E.164 format for US numbers" },
  { id: "international", title: "International examples" },
  { id: "rules", title: "How to convert any number" },
  { id: "mistakes", title: "Mistakes that cause errors" },
  { id: "validate", title: "How to check a number" },
  { id: "faq", title: "Questions" },
];

const faq = [
  {
    q: "What is the E.164 format for a US phone number?",
    a: "A plus sign, the country code 1, then the 10-digit number with no spaces or punctuation. For example, (202) 555-0142 becomes +12025550142.",
  },
  {
    q: "Does E.164 always start with a plus sign?",
    a: "Yes, as Twilio writes it. Twilio's glossary lists the + as part of the format, and its API expects it on To and From phone numbers.",
  },
  {
    q: "How long can an E.164 number be?",
    a: "Up to 15 digits, counting the country code but not the plus sign. Country codes are one to three digits long, and many numbers are shorter than the maximum.",
  },
  {
    q: "How do I add an extension to an E.164 number?",
    a: "You can't. E.164 only contains digits after the plus, and there's no place for an extension. Store the extension separately. On a Twilio call, you'd press those digits after the call connects.",
  },
  {
    q: "Can a regex confirm a number is valid?",
    a: "Only its shape. Twilio's docs warn that a regular expression can't guarantee a valid number. Use it to catch typos, then use the free Basic Lookup to check the number itself.",
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
        lede="E.164 writes a phone number as a plus sign, the country code, then the rest of the number, with no spaces or punctuation. So the US number (202) 555-0142 becomes +12025550142, and this is the form Twilio expects."
      />
      <Container>
        <div className="toc-layout">
          <TocSidebar items={toc} />
          <Prose>
            <h2 id="format">What E.164 looks like</h2>
            <p>
              E.164 is the international numbering plan from the ITU, the UN body for telecoms. It gives every public phone number one unambiguous written form, which is why
              software uses it. Per{" "}
              <a href={E164} rel="noopener">
                Twilio&apos;s E.164 glossary page
              </a>
              , a number must:
            </p>
            <ul>
              <li>start with <code>+</code></li>
              <li>use only digits after that, with no spaces, dashes, dots or brackets</li>
              <li>have 15 digits at most, including the country code</li>
              <li>never have <code>0</code> as the first digit, because no country code starts with 0</li>
            </ul>
            <p>Reading left to right, +12025550142 breaks down like this:</p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Parts of the E.164 number +12025550142">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Part</th>
                    <th scope="col">In this number</th>
                    <th scope="col">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Plus sign</td>
                    <td><code>+</code></td>
                    <td>Marks the number as international</td>
                  </tr>
                  <tr>
                    <td>Country code</td>
                    <td><code>1</code></td>
                    <td>One to three digits</td>
                  </tr>
                  <tr>
                    <td>Area or national code</td>
                    <td><code>202</code></td>
                    <td>Length varies by country</td>
                  </tr>
                  <tr>
                    <td>Subscriber number</td>
                    <td><code>5550142</code></td>
                    <td>The rest of the digits</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 id="us">E.164 format for US phone numbers</h2>
            <p>
              A US number is always <code>+1</code> followed by 10 digits, 12 characters in all. Every common way of writing the same number converts to one result. Canada
              shares country code 1, so it works the same way. The numbers below are in the 555-01xx range set aside for fiction.
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="US phone numbers converted to E.164">
              <table>
                <thead>
                  <tr>
                    <th scope="col">How it was written</th>
                    <th scope="col">What was wrong</th>
                    <th scope="col">E.164</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>(202) 555-0142</code></td>
                    <td>Brackets, space, dash, no country code</td>
                    <td><code>+12025550142</code></td>
                  </tr>
                  <tr>
                    <td><code>202-555-0142</code></td>
                    <td>Dashes, no country code</td>
                    <td><code>+12025550142</code></td>
                  </tr>
                  <tr>
                    <td><code>202.555.0142</code></td>
                    <td>Dots, no country code</td>
                    <td><code>+12025550142</code></td>
                  </tr>
                  <tr>
                    <td><code>1 (202) 555-0142</code></td>
                    <td>Punctuation, no plus</td>
                    <td><code>+12025550142</code></td>
                  </tr>
                  <tr>
                    <td><code>12025550142</code></td>
                    <td>No plus</td>
                    <td><code>+12025550142</code></td>
                  </tr>
                  <tr>
                    <td><code>+1 202 555 0142</code></td>
                    <td>Spaces</td>
                    <td><code>+12025550142</code></td>
                  </tr>
                  <tr>
                    <td><code>1-800-555-0199</code></td>
                    <td>Dashes, no plus (toll-free works the same)</td>
                    <td><code>+18005550199</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              For a list of numbers, the <Link href="/tools/e164-phone-number-formatter">E.164 phone number formatter</Link> does this in your browser.
            </p>

            <h2 id="international">E.164 examples for international numbers</h2>
            <p>
              Outside North America, there&apos;s one more step. Many countries write a leading 0 for calls inside the country, and that 0 isn&apos;t part of the international
              number.{" "}
              <a href="https://support.twilio.com/hc/en-us/articles/223179888-How-do-I-dial-international-numbers-with-Twilio" rel="noopener">
                Twilio gives the UK as its example
              </a>
              : remove the 0, then add the plus and country code. The examples below come from ranges that{" "}
              <a href="https://www.ofcom.org.uk/phones-and-broadband/phone-numbers/numbers-for-drama" rel="noopener">
                Ofcom
              </a>{" "}
              and{" "}
              <a href="https://www.acma.gov.au/phone-numbers-use-tv-shows-films-and-creative-works" rel="noopener">
                ACMA
              </a>{" "}
              reserve for fiction.
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="International phone numbers converted to E.164">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Country</th>
                    <th scope="col">Local form</th>
                    <th scope="col">Code</th>
                    <th scope="col">E.164</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>UK mobile</td>
                    <td><code>07700 900123</code></td>
                    <td>44</td>
                    <td><code>+447700900123</code></td>
                  </tr>
                  <tr>
                    <td>UK, Cardiff</td>
                    <td><code>029 2018 0123</code></td>
                    <td>44</td>
                    <td><code>+442920180123</code></td>
                  </tr>
                  <tr>
                    <td>Australia mobile</td>
                    <td><code>0491 570 156</code></td>
                    <td>61</td>
                    <td><code>+61491570156</code></td>
                  </tr>
                  <tr>
                    <td>Australia, New South Wales</td>
                    <td><code>(02) 5550 0123</code></td>
                    <td>61</td>
                    <td><code>+61255500123</code></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 id="rules">How to convert any number to E.164</h2>
            <ol>
              <li>
                <strong>Find the country.</strong> You can&apos;t convert a number without knowing it. <code>029 2018 0123</code> means nothing to Twilio on its own.
              </li>
              <li>
                <strong>Strip everything except digits.</strong> Remove spaces, dashes, dots and brackets. Set any extension aside.
              </li>
              <li>
                <strong>Remove any international dialing prefix.</strong> Someone may have written 011 from the US or 00 from elsewhere. Those are instructions to a phone, not part
                of the number.
              </li>
              <li>
                <strong>Deal with the leading 0.</strong> If the number uses a national 0, as in the UK and Australia, drop it. If you aren&apos;t sure about a country&apos;s rule, let
                Lookup decide (see below) rather than guessing.
              </li>
              <li>
                <strong>Add the plus and country code.</strong> Don&apos;t add the code twice, which is easy to do when a number already starts with it.
              </li>
              <li>
                <strong>Count the digits.</strong> A US number has 11 after the plus. Anything over 15 can&apos;t be right.
              </li>
            </ol>
            <p>Once a number is cleaned up, a quick shape check catches most typos. It doesn&apos;t tell you the number exists:</p>
            <CodeBlock title="Shape check only" code={"^\\+[1-9]\\d{1,14}$"} />

            <h2 id="mistakes">Which mistakes cause Twilio errors?</h2>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Phone number mistakes and the Twilio errors they cause">
              <table>
                <thead>
                  <tr>
                    <th scope="col">What you see</th>
                    <th scope="col">Likely cause</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><Link href="/twilio-errors/21211">Error 21211</Link>, invalid To number</td>
                    <td>Missing plus or country code, punctuation, or a digit too many or too few. It also appears if <code>To</code> and <code>From</code> are the same Twilio number</td>
                  </tr>
                  <tr>
                    <td><Link href="/twilio-errors/21212">Error 21212</Link>, invalid From number</td>
                    <td>The sender isn&apos;t written correctly. Check it for the same formatting problems</td>
                  </tr>
                  <tr>
                    <td><Link href="/twilio-errors/21614">Error 21614</Link>, not a mobile number</td>
                    <td>The format can be fine, but the number may be a landline that can&apos;t get texts</td>
                  </tr>
                  <tr>
                    <td><Link href="/twilio-errors/13224">Error 13224</Link> in a Dial</td>
                    <td>A missing plus or country code in TwiML, or a destination Twilio can&apos;t route</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>Three quieter traps are worth checking when numbers come from somewhere else:</p>
            <ul>
              <li>
                <strong>Spreadsheets.</strong> A spreadsheet can treat <code>+12025550142</code> as a number or a formula, dropping the plus or showing it in scientific notation. Format the column as text before you paste.
              </li>
              <li>
                <strong>Hidden characters.</strong> Numbers copied from a web page or contact card can carry invisible formatting characters. If a number looks right but fails, retype it.
              </li>
              <li>
                <strong>URL encoding.</strong> In form data, a raw <code>+</code> can be read as a space, so your number arrives without it. Encode it as <code>%2B</code> or let your tool do it:
              </li>
            </ul>
            <CodeBlock title="Sending the plus safely with curl" code={encodedRight} />

            <h2 id="validate">How to check that a number is really valid</h2>
            <p>
              Format is only half the job, as <code>+12025550142</code> has the right shape whether or not anyone holds that number. Twilio&apos;s{" "}
              <a href={LOOKUP} rel="noopener">
                Lookup API
              </a>{" "}
              has a free Basic Lookup that checks validity and returns the E.164 form. Give it a national number and a country code:
            </p>
            <CodeBlock title="Basic Lookup with a national number" code={lookupRequest} />
            <p>A successful answer has this shape. It&apos;s shown here with our fictional number, which may well come back as invalid if you try it, so test with a real one:</p>
            <CodeBlock title="Shape of a successful response (shortened)" code={lookupResponse} />
            <p>
              Read <code>valid</code> first, then store <code>phone_number</code>. Lookup defaults the country to US if you leave it out, so pass <code>CountryCode</code> for any
              non-US number written in local form. Line type checks, which tell you if a number is a landline, are a separate paid feature, so see{" "}
              <a href={LOOKUP} rel="noopener">
                the Lookup docs
              </a>{" "}
              for those.
            </p>
            <Callout type="tip" title="Store one format">
              <p>
                Save numbers in E.164 and format them only for display. Comparing or de-duplicating contacts gets much easier, and it means the numbers you hand to{" "}
                <Link href="/guides/how-does-twilio-sms-work">Twilio&apos;s SMS API</Link> are already in the right form.
              </p>
            </Callout>

            <h2 id="faq">Questions</h2>
            <Faq items={faq} />
          </Prose>
        </div>
      </Container>
      <RelatedLinks path={path} />
      <CtaBand
        title="Stop formatting numbers by hand"
        text="Dialbubble is a free iPhone app for calling and texting from your own Twilio account, with a built-in number lookup and plain-English errors. Try it in Demo Mode with no Twilio account."
      />
    </>
  );
}

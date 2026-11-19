import Link from "next/link";
import { ToolShell } from "@/components/ToolShell";
import { metaFor } from "@/lib/registry";
import { JsonLd, howToLd } from "@/lib/seo";
import { ToolCta } from "../_components/ToolCta";
import { Formatter } from "./Formatter";

const path = "/tools/e164-phone-number-formatter";
export const metadata = metaFor(path);

const faq = [
  {
    q: "What is E.164 format?",
    a: "E.164 is the international phone number format: a plus sign, the country code, then the national number, with no spaces or punctuation. It has 15 digits at most, and the first digit after the plus is never 0. A US number looks like +14155550100.",
  },
  {
    q: "What's the US phone number format for Twilio?",
    a: "+1 followed by the 10-digit number, with no spaces, dashes or brackets. So (415) 555-0100 becomes +14155550100. Twilio's APIs expect this form in the To and From fields.",
  },
  {
    q: "Should I keep the leading 0 of a UK number?",
    a: "No. The 0 is a national prefix used only when dialing inside the UK, so 020 7946 0958 becomes +442079460958. Italy is the main exception people run into: there the 0 is part of the number and stays, as in +390669821234.",
  },
  {
    q: "Are my phone numbers uploaded anywhere?",
    a: "No. The formatting happens in your browser using code that's already on this page. The site's security policy also blocks connections to other servers, and numbers are never saved or added to the URL. Only your default country is kept in the URL.",
  },
  {
    q: "Does a valid result mean the number works?",
    a: "No. This tool checks the format and whether the digit count fits the country's numbering plan. It can't tell whether a number is in service, or whether it's a mobile. A lookup service, such as Twilio Lookup, can tell you more.",
  },
  {
    q: "Why does Excel remove the plus sign from my CSV?",
    a: "Spreadsheets treat +14155550100 as a number and may drop the plus or show it in scientific notation. Import the file with the e164 column set to Text instead of opening it directly. The CSV from this tool has the correct value, so check it in a text editor if in doubt.",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={howToLd({
          name: "Format phone numbers as E.164",
          description: "Convert a list of phone numbers in any local format to E.164, in your browser.",
          path,
          steps: [
            { name: "Paste your numbers", text: "Paste one number per line, or a column from a spreadsheet." },
            { name: "Choose a default country", text: "Pick the country to use for numbers that have no country code." },
            { name: "Review the checks", text: "Read the notes for any number marked Check or Invalid." },
            { name: "Copy or download", text: "Copy the E.164 numbers, or download a CSV with every row." },
          ],
        })}
      />
      <ToolShell
        path={path}
        title="E.164 phone number formatter"
        intro="Paste a list of phone numbers in any format and get clean E.164 back, with length checks for about 240 countries and territories. Your numbers stay in your browser and are never uploaded."
        faq={faq}
        seo={
          <>
            <h2 id="what-the-tool-does">What does this E.164 formatter do?</h2>
            <p>
              It turns numbers like <code>(415) 555-0100</code>, <code>020 7946 0958</code> and <code>011 61 491 570 156</code> into the single format Twilio and most other phone APIs expect: a plus sign, a country code and the national number, with nothing else. Our guide to the <Link href="/guides/e164-phone-number-format">E.164 phone number format</Link> covers the standard itself. This page does the conversion for you, in bulk.
            </p>
            <p>
              Sending a number in the wrong format is a common cause of failed calls and texts. If you&apos;ve hit <Link href="/twilio-errors">a Twilio error</Link> saying a To number is invalid, the format is the first thing to check.
            </p>

            <h2 id="how-it-works">How it reads each number</h2>
            <p>Phone numbers are ambiguous, so the formatter works through these steps in order and tells you in the notes column what it decided.</p>
            <ol>
              <li>
                <strong>Clean up.</strong> It removes spaces, dashes, dots and brackets. A bracketed zero, as in +44 (0)20, is dropped, since it&apos;s never dialed from abroad. Extensions such as x23 or ext. 23 are removed and noted, because E.164 has no place for them.
              </li>
              <li>
                <strong>Look for a plus.</strong> A number with a plus already has its country code, so the default country is ignored.
              </li>
              <li>
                <strong>Look for an international prefix.</strong> It checks for the default country&apos;s exit code, such as 011 in the US and 00 in most of Europe, and for 00 and 011 in general, since lists often mix them.
              </li>
              <li>
                <strong>Try it as a national number.</strong> It removes the country&apos;s national prefix if there is one, such as the 0 in the UK or the 8 in Russia, and checks the digit count. Italy has no national prefix in this sense, so its leading 0 stays.
              </li>
              <li>
                <strong>Check for a forgotten plus.</strong> If the number starts with the default country code and the rest has the right length, as in 442079460958 with the UK selected, it&apos;s read as already international.
              </li>
            </ol>
            <p>
              Order matters. In Japan, for example, 011 is the area code for Sapporo rather than an exit code, so with Japan selected, 011-123-4567 is read as a national number. The same digits would mean something else in the US.
            </p>

            <h2 id="worked-example">Worked example: a messy contact list</h2>
            <p>With the United States as the default country, this is what the sample list above becomes:</p>
            <table>
              <thead>
                <tr>
                  <th scope="col">You paste</th>
                  <th scope="col">E.164</th>
                  <th scope="col">Why</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>(415) 555-0100</td>
                  <td>+14155550100</td>
                  <td>National number, +1 added</td>
                </tr>
                <tr>
                  <td>1-415-555-0123</td>
                  <td>+14155550123</td>
                  <td>Leading 1 read as the national prefix</td>
                </tr>
                <tr>
                  <td>00 44 20 7946 0958</td>
                  <td>+442079460958</td>
                  <td>00 read as an international prefix</td>
                </tr>
                <tr>
                  <td>011 61 491 570 156</td>
                  <td>+61491570156</td>
                  <td>011 is the US exit code</td>
                </tr>
                <tr>
                  <td>+44 (0)20 7946 0123</td>
                  <td>+442079460123</td>
                  <td>Plus kept, bracketed zero removed</td>
                </tr>
                <tr>
                  <td>415 555</td>
                  <td>None</td>
                  <td>Too short: +1 numbers have 10 digits</td>
                </tr>
              </tbody>
            </table>

            <h2 id="validity">How far can you trust the validity hints?</h2>
            <p>
              They&apos;re length checks, and that&apos;s all. &ldquo;Length fits&rdquo; means the digit count matches a landline or mobile length in that country. &ldquo;Check&rdquo; means the length exists only for special numbers such as toll-free or premium lines, so it may be a typo. &ldquo;Invalid&rdquo; means no number in that country has that length, or the number breaks a basic rule, such as a +1 area code starting with 0 or 1.
            </p>
            <p>
              The country list and length ranges come from Google&apos;s open-source <a href="https://github.com/google/libphonenumber" rel="noopener">libphonenumber</a> metadata, fetched in November 2026. Numbering plans change, and some countries, Germany among them, allow a wide range of lengths, so a pass there says little. Argentina is a known tricky case: its mobile numbers need a 9 after +54 in E.164, which you can&apos;t work out from length alone.
            </p>
            <p>
              Once your list is clean, the next step depends on what you&apos;re doing. To send to it, check your message with the <Link href="/tools/sms-segment-calculator">SMS segment calculator</Link> and your costs with the <Link href="/tools/twilio-pricing-calculator">Twilio pricing calculator</Link>. To place calls, <Link href="/guides/how-to-use-a-twilio-phone-number">how to use a Twilio phone number</Link> walks through the setup.
            </p>
          </>
        }
      >
        <Formatter />
        <ToolCta
          title="Check a number's details from your iPhone"
          text="A correct format can't tell you who or what is on the line. Dialbubble's number lookup asks Twilio about a number through your own account. Try the app in Demo Mode, with no Twilio account."
          linkHref="/features"
          linkText="See number lookup and other features"
        />
      </ToolShell>
    </>
  );
}

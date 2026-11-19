import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { Faq } from "@/components/Faq";
import { PageHero } from "@/components/PageHero";
import { Prose } from "@/components/Prose";
import { RelatedLinks } from "@/components/RelatedLinks";
import { getEntry, metaFor } from "@/lib/registry";
import { articleLd, JsonLd } from "@/lib/seo";
import { AREA_LABELS, stripMarkup, twilioErrors, type ErrorArea } from "./_data";
import { ErrorSearch, type ErrorGroup } from "./ErrorSearch";

const path = "/twilio-errors";
export const metadata = metaFor(path);

const areas: ErrorArea[] = ["sms", "voice", "auth", "webhooks"];

/** First sentence of the answer, for the list. */
function summaryOf(answer: string) {
  const plain = stripMarkup(answer);
  const end = plain.indexOf(". ");
  return end === -1 ? plain : plain.slice(0, end + 1);
}

const groups: ErrorGroup[] = areas.map((area) => ({
  area,
  label: AREA_LABELS[area],
  items: twilioErrors
    .filter((error) => error.area === area)
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((error) => ({
      code: error.code,
      name: error.name,
      short: error.short,
      severity: error.severity,
      summary: summaryOf(error.answer),
    })),
}));

const faq = [
  {
    q: "Where do I find the error code for a failed text or call?",
    a: "In the Twilio Console under Monitor, Logs, Error logs. A failed message also carries an ErrorCode in its logs and status callbacks, and API errors return the code in the response.",
  },
  {
    q: "Am I charged when Twilio shows an error?",
    a: "Sometimes. As of November 2026, messages that end as Failed can carry a $0.001 fee, and messages that end as Undelivered can still bill in full because delivery was attempted. Calls that end as busy, no-answer, canceled or failed aren't charged. Each code's page gives the details.",
  },
  {
    q: "What's the difference between a Twilio error and a warning?",
    a: "Twilio's dictionary marks each entry as one or the other. An error means something failed. A warning such as 12200 means Twilio noticed a problem, but the call or request may have carried on.",
  },
  {
    q: "What does \"an application error has occurred\" mean on a Twilio call?",
    a: "It's what callers hear when Twilio can't get usable instructions from your webhook or TwiML. Look in your error logs for 11200 or 12100.",
  },
  {
    q: "Is this an official Twilio list?",
    a: "No. Dialbubble isn't affiliated with Twilio. These are plain-English explanations checked against Twilio's error dictionary in November 2026, and each page links to Twilio's official entry.",
  },
];

export default function TwilioErrorsHub() {
  const entry = getEntry(path)!;
  return (
    <>
      <JsonLd data={articleLd({ title: entry.title, description: entry.description, path, published: "2026-11-04" })} />
      <Breadcrumbs path={path} />
      <PageHero
        title="Twilio error codes, explained"
        lede="Find your code to see what it means in plain English, what's likely causing it, how to fix it, and whether it costs you anything."
      />
      <Container as="section">
        <ErrorSearch groups={groups} />
      </Container>

      <Container className="mt-20">
        <Prose>
          <h2 id="read">How to read a Twilio error code</h2>
          <p>
            The first digits give you a hint about where to look. These groupings describe the codes on this page. They&apos;re a rule of thumb, not an official Twilio scheme.
          </p>
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="What Twilio error code ranges tend to mean">
            <table>
              <thead>
                <tr>
                  <th scope="col">Starts with</th>
                  <th scope="col">Usually about</th>
                  <th scope="col">Example</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>11, 12</td>
                  <td>Your webhook or TwiML</td>
                  <td><Link href="/twilio-errors/11200">11200, HTTP retrieval failure</Link></td>
                </tr>
                <tr>
                  <td>13</td>
                  <td>The TwiML Dial verb</td>
                  <td><Link href="/twilio-errors/13227">13227, Geo Permissions</Link></td>
                </tr>
                <tr>
                  <td>20</td>
                  <td>The API and your account</td>
                  <td><Link href="/twilio-errors/20003">20003, Permission denied</Link></td>
                </tr>
                <tr>
                  <td>21</td>
                  <td>The request you sent</td>
                  <td><Link href="/twilio-errors/21211">21211, Invalid To number</Link></td>
                </tr>
                <tr>
                  <td>30</td>
                  <td>Message delivery</td>
                  <td><Link href="/twilio-errors/30007">30007, Message filtered</Link></td>
                </tr>
                <tr>
                  <td>31, 32</td>
                  <td>Voice SDKs and SIP</td>
                  <td><Link href="/twilio-errors/32011">32011, SIP infrastructure</Link></td>
                </tr>
              </tbody>
            </table>
          </div>
          <h2 id="where">Why did Twilio accept my message and then fail it?</h2>
          <p>
            Some errors come back straight away, because the request itself was wrong. Others appear later as a delivery status, after Twilio has already accepted the message. So a successful API response doesn&apos;t mean a text arrived. Our guide to <Link href="/guides/how-does-twilio-sms-work">how Twilio SMS works</Link> follows a message through each stage.
          </p>
          <p>
            Two errors have longer walkthroughs: <Link href="/guides/fix-twilio-error-30007">fixing filtered messages (30007)</Link> and <Link href="/guides/fix-twilio-error-21610">fixing unsubscribed recipients (21610)</Link>. If your code isn&apos;t listed here, Twilio&apos;s{" "}
            <a href="https://www.twilio.com/docs/api/errors" rel="noopener">full error dictionary</a> has it.
          </p>
        </Prose>
      </Container>

      <Container as="section" className="mt-14">
        <h2 className="display-2 mb-6 text-[1.75rem] sm:text-[2rem]">Questions about Twilio errors</h2>
        <Faq items={faq} />
      </Container>

      <RelatedLinks path={path} title="Guides that help with these errors" />
      <CtaBand
        title="Twilio errors in plain English, on your iPhone"
        text="Dialbubble explains Twilio errors as they happen and suggests what to do next. It's free, and Demo Mode needs no Twilio account."
      />
    </>
  );
}

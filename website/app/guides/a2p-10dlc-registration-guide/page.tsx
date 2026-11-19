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

const path = "/guides/a2p-10dlc-registration-guide";
export const metadata = metaFor(path, { type: "article" });

const BRAND_DOC = "https://www.twilio.com/docs/trust-hub/registrations/a2p-10dlc-brand";
const FEES = "https://help.twilio.com/articles/1260803965530";
const OVERVIEW = "https://www.twilio.com/docs/messaging/compliance/a2p-10dlc";
const SOLE = "https://www.twilio.com/docs/messaging/compliance/a2p-10dlc/direct-sole-proprietor-registration-overview";
const STANDARD = "https://www.twilio.com/docs/messaging/compliance/a2p-10dlc/direct-standard-onboarding";
const APPROVAL = "https://help.twilio.com/articles/11847054539547-A2P-10DLC-Campaign-Approval-Best-Practices";
const VETTING = "https://support.twilio.com/hc/en-us/articles/11587910480155-A2P-10DLC-Campaign-Vetting-FAQ";

const steps = [
  { name: "Choose your brand type", text: "Pick Sole Proprietor if you have no Tax ID, or Low-Volume Standard or Standard if you have one. Base the choice on daily volume." },
  { name: "Create your Trust Hub profile", text: "Enter your details in the Twilio Console. A Primary Customer Profile can take 72 hours or more to approve." },
  { name: "Register your brand", text: "Submit the brand and pay the brand fee. Sole Proprietors must also answer a one-time passcode on their mobile within 24 hours." },
  { name: "Set up a Messaging Service", text: "Create a Messaging Service and add the number you plan to send from to its sender pool." },
  { name: "Register a campaign", text: "Describe who sends what to whom, how people opt in, and give sample messages. Reviews take up to 5 business days for standard use cases." },
  { name: "Send a test once approved", text: "When the campaign is approved and the number is linked, send a test text and read its status." },
];

const toc = [
  { id: "who", title: "Do you need to register?" },
  { id: "brand", title: "Which brand type fits?" },
  { id: "cost", title: "What it costs" },
  { id: "steps", title: "How to register, step by step" },
  { id: "campaign", title: "A campaign that passes review" },
  { id: "rejections", title: "Common rejections" },
  { id: "after", title: "After you submit" },
  { id: "faq", title: "Questions" },
];

const sample = `Campaign description
Harbor Bike Shop in Portland, Oregon texts customers who booked a
repair through our website. Texts confirm bookings and say when a
bike is ready for pickup. We send about 40 texts a week.

Message flow
Customers tick an unchecked box on harborbikes.example/book that says:
"Text me about my repair. Message frequency varies. Message and data
rates may apply. Reply STOP to opt out, HELP for help." Ticking it is
optional and isn't needed to book. Privacy policy:
harborbikes.example/privacy. We don't share opt-in data with anyone.

Sample message 1
Harbor Bike Shop: your bike is ready for pickup. We're open until
6 PM today. Reply STOP to opt out.

Sample message 2
Reminder from Harbor Bike Shop: your tune-up is tomorrow at 10 AM.
Reply STOP to opt out.`;

const faq = [
  {
    q: "Do I have to register if I only send a few texts?",
    a: "Yes, if you send them from a US local number through Twilio. Twilio says carriers treat all its SMS traffic as application-to-person, and that this includes individuals and hobbyists. There's no minimum volume.",
  },
  {
    q: "Can I avoid A2P 10DLC?",
    a: "You can use a different sender. Toll-free numbers and short codes aren't part of A2P 10DLC, but toll-free numbers need their own verification and short codes cost far more. If you only send login codes, Twilio suggests looking at Verify.",
  },
  {
    q: "Can I register as a Sole Proprietor if my business has an EIN?",
    a: "No. Twilio says that if you have a US EIN or Canadian Business Number, you aren't eligible for a Sole Proprietor brand and must register as Standard or Low-Volume Standard.",
  },
  {
    q: "Is the $15 campaign fee refunded if I'm rejected?",
    a: "No. Twilio's vetting FAQ says it's non-refundable. It also advises editing and resubmitting a failed campaign rather than creating a new one, since the fee is charged per campaign.",
  },
  {
    q: "Is this guide legal advice?",
    a: "No. It explains Twilio's registration process in plain words. For questions about what the law requires of your business, such as consent rules, talk to a qualified lawyer.",
  },
];

export default function Page() {
  const entry = getEntry(path)!;
  return (
    <>
      <JsonLd data={howToLd({ name: "How to complete A2P 10DLC registration with Twilio", description: entry.description, path, steps })} />
      <Breadcrumbs path={path} />
      <PageHero
        eyebrow="Guide"
        title={entry.title}
        lede={
          <>
            A2P 10DLC registration tells US carriers who you are and what you text, and it&apos;s required for anyone sending SMS from a Twilio local number to the US. As of November
            2026,{" "}
            <a className="link" href={FEES} rel="noopener">
              a Sole Proprietor registration costs
            </a>{" "}
            $19.50 up front plus $2 a month, and campaign review takes up to 5 business days for standard use cases.
          </>
        }
      />
      <Container>
        <div className="toc-layout">
          <TocSidebar items={toc} />
          <Prose>
            <Callout type="info" title="Not legal advice">
              <p>
                This guide explains Twilio&apos;s process in plain words. It isn&apos;t legal advice. Fees and rules can change, so check the linked Twilio pages before you
                pay, and ask a lawyer about consent rules for your business.
              </p>
            </Callout>

            <h2 id="who">Do you need to register?</h2>
            <p>
              <a href={OVERVIEW} rel="noopener">
                Twilio&apos;s A2P 10DLC docs
              </a>{" "}
              are direct about this: anyone using a local number with Twilio to send SMS to the US needs to register, including individuals and hobbyists. Carriers treat
              every text sent through Twilio as application-to-person, even one you typed by hand. Without registration, your texts are blocked with{" "}
              <Link href="/twilio-errors/30034">error 30034</Link>.
            </p>
            <p>You can skip it if one of these fits:</p>
            <ul>
              <li>
                <strong>You send from a toll-free number.</strong> It has its own{" "}
                <a href="https://www.twilio.com/docs/messaging/compliance/toll-free/console-onboarding" rel="noopener">
                  toll-free verification
                </a>
                , and US and Canadian traffic is blocked until it&apos;s approved.
              </li>
              <li>
                <strong>You send from a short code.</strong> As of November 2026 these start at{" "}
                <a href="https://www.twilio.com/en-us/sms/pricing/us" rel="noopener">
                  $1,000 a month
                </a>
                , so few small senders choose them.
              </li>
              <li>
                <strong>You only send login codes.</strong> Twilio suggests{" "}
                <a href="https://www.twilio.com/docs/verify" rel="noopener">
                  Verify
                </a>{" "}
                for that.
              </li>
            </ul>

            <h2 id="brand">Which A2P brand type fits you?</h2>
            <p>
              A brand is the legal person or business doing the sending. The two questions that decide your type are whether you have a Tax ID and how much you send. Volumes
              below come from{" "}
              <a href={BRAND_DOC} rel="noopener">
                Twilio&apos;s brand docs
              </a>
              .
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="A2P 10DLC brand types compared">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Brand</th>
                    <th scope="col">Who it&apos;s for</th>
                    <th scope="col">Daily limit on T-Mobile</th>
                    <th scope="col">Campaigns</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Sole Proprietor</th>
                    <td>US or Canada, no Tax ID</td>
                    <td>1,000 segments and MMS (about 3,000 across US carriers)</td>
                    <td>1, with one 10DLC number</td>
                  </tr>
                  <tr>
                    <th scope="row">Low-Volume Standard</th>
                    <td>Has a Tax ID, sends little</td>
                    <td>Up to 2,000 (about 6,000 across US carriers)</td>
                    <td>Up to 5</td>
                  </tr>
                  <tr>
                    <th scope="row">Standard</th>
                    <td>Has a Tax ID, sends more</td>
                    <td>From 2,000 up, depending on Trust Score</td>
                    <td>Up to 5</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              <strong>Software companies registering their customers</strong> follow a separate{" "}
              <a href="https://www.twilio.com/docs/messaging/compliance/a2p-10dlc/onboarding-isv" rel="noopener">
                ISV path
              </a>{" "}
              that this guide doesn&apos;t cover.
            </p>

            <h2 id="cost">What does A2P 10DLC cost?</h2>
            <p>
              All prices are as of November 2026, from{" "}
              <a href={BRAND_DOC} rel="noopener">
                Twilio&apos;s brand fee table
              </a>{" "}
              and its{" "}
              <a href={FEES} rel="noopener">
                A2P 10DLC fee article
              </a>
              .
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="A2P 10DLC fees as of November 2026">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Fee</th>
                    <th scope="col">Amount</th>
                    <th scope="col">When</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Brand registration</td>
                    <td>$4.50</td>
                    <td>Once</td>
                  </tr>
                  <tr>
                    <td>Standard Brand vetting</td>
                    <td>$41.50</td>
                    <td>Once, charged automatically for Standard</td>
                  </tr>
                  <tr>
                    <td>Campaign verification</td>
                    <td>$15</td>
                    <td>Per campaign, not refunded</td>
                  </tr>
                  <tr>
                    <td>Sole Proprietor campaign</td>
                    <td>$2</td>
                    <td>Monthly</td>
                  </tr>
                  <tr>
                    <td>Low-Volume Standard and Standard campaigns</td>
                    <td>$1.50 to $10, by use case</td>
                    <td>Monthly</td>
                  </tr>
                  <tr>
                    <td>Brand appeal</td>
                    <td>$11</td>
                    <td>Per request, Standard vetting rejections only</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>Here is what one campaign adds up to over the first year, before you pay for the number or the texts:</p>
            <ul>
              <li>
                <strong>Sole Proprietor:</strong> $4.50 + $15 + (12 x $2) = <strong>$43.50</strong>
              </li>
              <li>
                <strong>Low-Volume Standard at $1.50 a month:</strong> $4.50 + $15 + (12 x $1.50) = <strong>$37.50</strong>
              </li>
              <li>
                <strong>Standard at $10 a month:</strong> $4.50 + $41.50 + $15 + (12 x $10) = <strong>$181</strong>
              </li>
            </ul>
            <p>
              These fees are on top of per-message and number charges. The <Link href="/tools/a2p-10dlc-cost-calculator">A2P 10DLC cost calculator</Link> runs the same sums
              for your setup, and <Link href="/guides/how-does-twilio-pricing-work">how Twilio pricing works</Link> covers the rest of the bill.
            </p>

            <h2 id="steps">How to register, step by step</h2>
            <p>
              Start from the A2P onboarding or Trust Hub section of the Twilio Console. The exact menu depends on which version of the Console you&apos;re using. Twilio has
              full walkthroughs for{" "}
              <a href={SOLE} rel="noopener">
                Sole Proprietors
              </a>{" "}
              and{" "}
              <a href={STANDARD} rel="noopener">
                Standard brands
              </a>
              .
            </p>
            <ol>
              <li>
                <strong>Choose your brand type.</strong> Use the table above. Don&apos;t pick Sole Proprietor to save money if you have a Tax ID, because you aren&apos;t eligible.
              </li>
              <li>
                <strong>Create your Trust Hub profile.</strong> Enter your details exactly as they appear on your tax records. A Primary Customer Profile can take 72 hours or
                more to approve, but you can move on while it&apos;s pending.
              </li>
              <li>
                <strong>Register your brand.</strong> Most reviews finish within minutes, while manual ones can take seven business days or more. Sole Proprietors get a
                one-time passcode by text and must respond within 24 hours. That mobile must be a real US or Canadian one, not a Twilio number, and it can be used for at
                most three Sole Proprietor brands.
              </li>
              <li>
                <strong>Set up a Messaging Service.</strong> Add the number you want to send from to its sender pool. On a Sole Proprietor campaign, keep exactly one number in
                it, because extra numbers stay unregistered.
              </li>
              <li>
                <strong>Register a campaign.</strong> Choose the use case and fill in the details described next. Reviews take up to 5 business days for standard use cases, and
                some special ones need an extra carrier review.
              </li>
              <li>
                <strong>Send a test once approved.</strong> If you see <Link href="/twilio-errors/30035">error 30035</Link>, the number is still registering. That can take up to
                24 hours, and you shouldn&apos;t remove and re-add it in the meantime.
              </li>
            </ol>

            <h2 id="campaign">What a campaign that passes review looks like</h2>
            <p>
              <a href={APPROVAL} rel="noopener">
                Twilio&apos;s campaign guide
              </a>{" "}
              calls the message flow the heart of your registration. Reviewers want to see who is texting, who receives it, why, and exactly how a person agreed. Here is a made-up
              example for a small shop. Don&apos;t copy the wording unless it&apos;s true of your business.
            </p>
            <CodeBlock title="Example campaign details (fictional business)" code={sample} />
            <p>Three details in that example do a lot of the work:</p>
            <ul>
              <li>The opt-in box is unchecked and optional. Twilio says consent can&apos;t be a condition of buying something or creating an account.</li>
              <li>The consent wording gives the message type, frequency, &quot;Message and data rates may apply&quot; and how to opt out.</li>
              <li>The samples match the use case and include the business name, so they agree with the description.</li>
            </ul>

            <h2 id="rejections">Common reasons campaigns get rejected</h2>
            <ul>
              <li>
                <strong>A vague description.</strong> &quot;This campaign sends messages to customers&quot; tells a reviewer nothing.
              </li>
              <li>
                <strong>A message flow reviewers can&apos;t check.</strong> Describe each opt-in method separately, and make sure any website URL you give is live and public.
              </li>
              <li>
                <strong>Mismatched details.</strong> The brand name, website, email domain and samples should all point to the same business.
              </li>
              <li>
                <strong>Sharing opt-in data.</strong> Your privacy policy should say you don&apos;t sell or share it with third parties or lead generators.
              </li>
              <li>
                <strong>Generic short links.</strong> Twilio warns that services such as bit.ly lead to rejection. Use a branded domain.
              </li>
              <li>
                <strong>Forbidden content.</strong> Some categories are barred however you word them. Twilio&apos;s{" "}
                <a href="https://support.twilio.com/hc/en-us/articles/360045004974-Forbidden-message-categories-for-SMS-and-MMS-in-the-US-and-Canada" rel="noopener">
                  forbidden message categories
                </a>{" "}
                include gambling, cannabis, debt relief and third-party lending.
              </li>
            </ul>
            <p>
              If a campaign fails, edit and resubmit it instead of creating a new one. Twilio&apos;s{" "}
              <a href={VETTING} rel="noopener">
                vetting FAQ
              </a>{" "}
              and{" "}
              <a href="https://www.twilio.com/docs/messaging/compliance/a2p-10dlc/troubleshooting-a2p-brands/troubleshooting-and-rectifying-a2p-campaigns" rel="noopener">
                campaign troubleshooting guide
              </a>{" "}
              cover the details. Campaigns rejected for disallowed content generally can&apos;t be resubmitted.
            </p>

            <h2 id="after">What happens after you submit?</h2>
            <p>
              You can only send compliant A2P traffic once the campaign is fully approved. If it&apos;s still in review after 10 days, Twilio says to contact Support. After
              approval, watch for these:
            </p>
            <ul>
              <li>
                <strong>Rate limits.</strong> <Link href="/twilio-errors/30022">Error 30022</Link> means you hit the campaign&apos;s rate limit. Error 30023 means the daily brand
                cap, which resets at 00:00 Pacific.
              </li>
              <li>
                <strong>Filtering.</strong> Registration lowers filtering but doesn&apos;t end it. If you still get blocked, work through{" "}
                <Link href="/guides/fix-twilio-error-30007">how to fix error 30007</Link>.
              </li>
              <li>
                <strong>Opt-outs.</strong> Honor every STOP. Texting a person after they opt out produces <Link href="/guides/fix-twilio-error-21610">error 21610</Link>.
              </li>
            </ul>

            <h2 id="faq">Questions</h2>
            <Faq items={faq} />
          </Prose>
        </div>
      </Container>
      <RelatedLinks path={path} />
      <CtaBand
        title="Registered? Text from your iPhone"
        text="Dialbubble is a free iPhone app that sends through your own Twilio account, with no markup and no server. It can't register you, since that happens at Twilio, but it does tell you plainly when a number isn't registered yet."
      />
    </>
  );
}

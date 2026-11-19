import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Callout } from "@/components/Callout";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { Faq } from "@/components/Faq";
import { PageHero } from "@/components/PageHero";
import { Prose } from "@/components/Prose";
import { RelatedLinks } from "@/components/RelatedLinks";
import { TocSidebar } from "@/components/TocSidebar";
import { getEntry, metaFor } from "@/lib/registry";
import { articleLd, JsonLd } from "@/lib/seo";

const path = "/guides/how-much-does-a-twilio-phone-number-cost";
export const metadata = metaFor(path, { type: "article" });

const US = "https://www.twilio.com/en-us/voice/pricing/us";
const SMS = "https://www.twilio.com/en-us/sms/pricing/us";
const CA = "https://www.twilio.com/en-us/voice/pricing/ca";
const GB = "https://www.twilio.com/en-us/voice/pricing/gb";
const DE = "https://www.twilio.com/en-us/voice/pricing/de";

const toc = [
  { id: "us", title: "US number prices" },
  { id: "other", title: "Prices in other countries" },
  { id: "year", title: "A first-year budget" },
  { id: "extras", title: "Other charges" },
  { id: "billing", title: "When you're billed" },
  { id: "choose", title: "Which number to buy" },
  { id: "faq", title: "Questions" },
];

const faq = [
  {
    q: "Does a Twilio number cost money if I don't use it?",
    a: "Yes. You pay the monthly fee as long as the number is on your account, even with no calls or texts. There's no way to pause it. Release the number to stop the charge.",
  },
  {
    q: "Is the first month of a Twilio number free?",
    a: "When you upgrade from a trial, the first month of a purchased US local or US and Canada toll-free number is free. Trial numbers themselves are shared by Twilio and you can't keep them.",
  },
  {
    q: "Can I get a Twilio number for free?",
    a: "Not one of your own. The trial lets you use a shared Twilio number for 30 days, but a dedicated number has a monthly fee after that first free month.",
  },
  {
    q: "Can I use my existing number instead of buying one?",
    a: "Sometimes. You can check whether your number can be ported to Twilio in the Console. For outbound calls only, you can verify your own phone and use it as your caller ID without buying anything.",
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
        lede="A US local Twilio number costs $1.15 a month and a toll-free number costs $2.15 a month, as of November 2026. Calls and texts are charged separately, so the number fee is only the starting point."
      />
      <Container>
        <div className="toc-layout">
          <TocSidebar items={toc} />
          <Prose>
            <h2 id="us">How much is a Twilio phone number per month in the US?</h2>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="US Twilio number prices">
              <table>
                <caption>
                  US monthly prices, as of November 2026 (<a href={US} rel="noopener">voice pricing</a>, <a href={SMS} rel="noopener">SMS pricing</a>)
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Number type</th>
                    <th scope="col">Per month</th>
                    <th scope="col">Good for</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Local</td><td>$1.15</td><td>A number with a real area code</td></tr>
                  <tr><td>Toll-free</td><td>$2.15</td><td>A national presence; callers don&apos;t pay</td></tr>
                  <tr><td>Short code</td><td>$1,000 or more, billed quarterly, plus setup</td><td>High-volume texting programs</td></tr>
                  <tr><td>Bring your own number</td><td>$0.50</td><td>A number you already have elsewhere</td></tr>
                </tbody>
              </table>
            </div>
            <p>
              Most people reading this want a local number. It&apos;s the cheapest, and it has an area code your customers will recognize. Toll-free costs $1 more a month and has a higher rate for incoming calls, as you&apos;ll see below.
            </p>

            <h2 id="other">What do Twilio numbers cost in other countries?</h2>
            <p>Prices vary a lot, and a mobile number isn&apos;t always the cheap choice. A few examples, as of November 2026:</p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Twilio number prices by country">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Country</th>
                    <th scope="col">Local</th>
                    <th scope="col">Mobile</th>
                    <th scope="col">Toll-free</th>
                    <th scope="col">Source</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Canada</td><td>$1.15</td><td>Not listed</td><td>$2.15</td><td><a href={CA} rel="noopener">Canada pricing</a></td></tr>
                  <tr><td>United Kingdom</td><td>$3.50</td><td>$2.50</td><td>$2.70</td><td><a href={GB} rel="noopener">UK pricing</a></td></tr>
                  <tr><td>Germany</td><td>$1.35</td><td>$30.00</td><td>Not listed</td><td><a href={DE} rel="noopener">Germany pricing</a></td></tr>
                </tbody>
              </table>
            </div>
            <p>
              For other countries, swap the country code at the end of the pricing page address. Outside the US and Canada, price isn&apos;t the only hurdle. Many countries require ID or address proof before you can buy, so read about <Link href="/guides/twilio-regulatory-bundle-guide">Twilio regulatory bundles</Link> first. Germany, for example, offers its local and mobile numbers only to businesses.
            </p>

            <h2 id="year">What will a number really cost in the first year?</h2>
            <p>
              The sticker price doesn&apos;t include what you need in order to use the number. Here are two realistic first years for one US local number, as of November 2026, assuming you upgraded from a trial and got the first month free (<a href="https://www.twilio.com/docs/usage/trials" rel="noopener">Twilio trial docs</a>). These cover fixed costs only, not your calls and texts.
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="First year fixed costs for a US local number">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Item</th>
                    <th scope="col">Calls only</th>
                    <th scope="col">Calls and US texts</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Number: 11 paid months x $1.15</td><td>$12.65</td><td>$12.65</td></tr>
                  <tr><td>A2P brand fee, once</td><td>None</td><td>$4.50</td></tr>
                  <tr><td>A2P campaign verification, once</td><td>None</td><td>$15.00</td></tr>
                  <tr><td>Sole Proprietor campaign: 12 x $2.00</td><td>None</td><td>$24.00</td></tr>
                  <tr><th scope="row">First-year fixed cost</th><td><strong>$12.65</strong></td><td><strong>$56.15</strong></td></tr>
                </tbody>
              </table>
            </div>
            <p>
              So texting from a local US number costs more to set up than the number does. That registration is <Link href="/guides/a2p-10dlc-registration-guide">A2P 10DLC</Link>, and other campaign types cost $1.50 to $10 a month by use case, as of November 2026 (<a href="https://www.twilio.com/docs/messaging/compliance/a2p-10dlc" rel="noopener">Twilio A2P 10DLC docs</a>). If you only call, you can skip all of it. To add your own call and text volumes, use the <Link href="/tools/twilio-pricing-calculator">Twilio pricing calculator</Link>.
            </p>

            <h2 id="extras">What other charges come with a Twilio number?</h2>
            <p>All of these are US rates, as of November 2026.</p>
            <ul>
              <li>
                <strong>Incoming calls:</strong> $0.0085 a minute on local and $0.0220 a minute on toll-free (<a href={US} rel="noopener">voice pricing</a>). A 100-minute month costs $0.85 on local and $2.20 on toll-free.
              </li>
              <li>
                <strong>Outgoing calls:</strong> $0.0140 a minute (<a href={US} rel="noopener">voice pricing</a>).
              </li>
              <li>
                <strong>Texts:</strong> $0.0083 per segment each way, plus carrier fees (<a href={SMS} rel="noopener">SMS pricing</a>).
              </li>
              <li>
                <strong>Emergency calling:</strong> $0.75 a month per number if you enable it (<a href={US} rel="noopener">voice pricing</a>). Remove any emergency address before you release a number.
              </li>
              <li>
                <strong>Toll-free texting:</strong> needs <a href="https://help.twilio.com/articles/5377174717595-Toll-Free-Message-Verification-for-US-Canada" rel="noopener">toll-free verification</a> rather than A2P 10DLC.
              </li>
            </ul>
            <p>
              For the whole picture, including call legs and a sample bill, read <Link href="/guides/how-does-twilio-pricing-work">how Twilio pricing works</Link>.
            </p>

            <h2 id="billing">When does Twilio bill for a number?</h2>
            <p>
              Twilio <a href="https://support.twilio.com/hc/en-us/articles/223182908-How-Much-Does-a-Phone-Number-Cost" rel="noopener">charges the full monthly price up front</a> when you buy a number, then again on that same day each month. A few things follow from that:
            </p>
            <ul>
              <li><strong>Unused numbers still bill.</strong> Having no calls or texts doesn&apos;t reduce the fee.</li>
              <li>
                <strong>Releasing stops it.</strong> <a href="https://www.twilio.com/docs/usage/manage-unused-resources" rel="noopener">Releasing a number</a> ends the recurring charge immediately. Twilio&apos;s guide doesn&apos;t mention a refund for the month you&apos;ve already paid, so release close to your renewal date.
              </li>
              <li>
                <strong>You have a short way back.</strong> Twilio <a href="https://support.twilio.com/hc/en-us/articles/223183108-Restoring-a-previously-released-phone-number" rel="noopener">reserves a released number</a> for your account for 10 days. Restoring it means paying the monthly fee again.
              </li>
              <li>
                <strong>Suspension doesn&apos;t pause it.</strong> Number fees <a href="https://support.twilio.com/hc/en-us/articles/223183088-Do-I-Still-Get-Charged-for-Phone-Numbers-When-My-Account-is-Suspended" rel="noopener">keep billing while an account is suspended</a>.
              </li>
              <li>
                <strong>Idle numbers can go away.</strong> Twilio can <a href="https://www.twilio.com/docs/phone-numbers/best-practices" rel="noopener">reclaim inactive numbers</a> to comply with telecom rules, so give any number you care about some regular use.
              </li>
            </ul>

            <h2 id="choose">Which Twilio number should you buy?</h2>
            <ul>
              <li><strong>A local number</strong> suits most small businesses and anyone who mainly wants a second line. It costs least to hold and to receive calls on.</li>
              <li><strong>A toll-free number</strong> suits you if you want to look national or expect plenty of callers paying long-distance rates. You pay more per minute to receive them.</li>
              <li><strong>No purchase at all</strong> can work if you only need outbound calls showing a number you own. See <Link href="/guides/how-to-add-a-verified-caller-id-in-twilio">how to add a verified caller ID</Link>.</li>
            </ul>
            <Callout type="tip" title="Check the features before you pay">
              <p>Numbers differ in what they support. On the buying screen, look for voice, SMS and MMS on the number you pick, because a number without SMS can&apos;t send texts.</p>
            </Callout>
            <p>
              Bought one, and wondering what comes next? A Twilio number doesn&apos;t behave like a SIM card, so read <Link href="/guides/how-to-use-a-twilio-phone-number">how to use a Twilio phone number</Link>.
            </p>

            <h2 id="faq">Questions about Twilio number costs</h2>
            <Faq items={faq} />
          </Prose>
        </div>
      </Container>
      <RelatedLinks path={path} />
      <CtaBand
        title="Your Twilio number, on your iPhone"
        text="Dialbubble is free and adds nothing to your Twilio number fee or usage. It lets you call and text from numbers you own at Twilio. Try Demo Mode without buying a number at all."
      />
    </>
  );
}

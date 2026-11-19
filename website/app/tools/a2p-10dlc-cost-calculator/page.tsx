import Link from "next/link";
import { Callout } from "@/components/Callout";
import { ToolShell } from "@/components/ToolShell";
import { metaFor } from "@/lib/registry";
import { JsonLd, howToLd } from "@/lib/seo";
import { ToolCta } from "../_components/ToolCta";
import { Calculator } from "./Calculator";

const path = "/tools/a2p-10dlc-cost-calculator";
export const metadata = metaFor(path);

const faq = [
  {
    q: "How much does A2P 10DLC registration cost?",
    a: "At least $19.50 to start: a $4.50 brand fee and a $15 campaign vetting fee. A Standard brand adds $41.50 of vetting, which makes the one-time total $61. After that you pay a monthly campaign fee of $1.50 to $10, depending on the use case, plus carrier fees on each message. These are the fees as of November 2026.",
  },
  {
    q: "Do I have to register for A2P 10DLC?",
    a: "If you send SMS or MMS to the US from an application over a 10-digit local number, yes. Twilio says that includes individuals and hobbyists, because carriers treat all Twilio messages as application traffic. Toll-free numbers and short codes aren't part of the system, and they have their own onboarding.",
  },
  {
    q: "What happens if I don't register?",
    a: "Twilio's docs say senders who don't register pay additional carrier fees for unregistered traffic, and that registration brings lower message filtering. Unregistered messages are more likely to be filtered, and our guide to Twilio error 30007 covers what that looks like.",
  },
  {
    q: "Is the vetting fee refunded if my campaign is rejected?",
    a: "No. Twilio's FAQ describes the $15 campaign vetting fee as non-refundable, so check your campaign details and sample messages carefully before you submit.",
  },
  {
    q: "Can a Sole Proprietor brand have more than one number?",
    a: "No. Twilio limits a Sole Proprietor brand to one campaign, and that campaign to one phone number, with a throughput limit of 1 message per second. If you need more, you'll need a tax ID and a Low-Volume Standard or Standard brand.",
  },
  {
    q: "Which brand type is cheapest?",
    a: "Low-Volume Standard with a Low-Volume Mixed campaign has the lowest monthly fee, at $1.50, while Sole Proprietor is $2. Their one-time fees are the same, at $19.50. Which you can use depends on whether you have a tax ID, rather than on price.",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={howToLd({
          name: "Estimate your A2P 10DLC costs",
          description: "Work out brand, vetting, campaign and carrier fees for A2P 10DLC on Twilio.",
          path,
          steps: [
            { name: "Choose a brand type", text: "Pick Sole Proprietor, Low-Volume Standard or Standard." },
            { name: "Choose a use case", text: "Pick your campaign's use case and the number of campaigns." },
            { name: "Enter your volume", text: "Type your monthly message segments and your mix of carriers." },
            { name: "Read the estimate", text: "See one-time fees, monthly fees and the first-year total." },
          ],
        })}
      />
      <ToolShell
        path={path}
        title="A2P 10DLC cost calculator"
        intro="Estimate brand registration, campaign vetting, monthly campaign fees and per-message carrier fees for texting US numbers on Twilio. Fees are as of November 2026, and you can edit every one."
        faq={faq}
        seo={
          <>
            <h2 id="what-you-pay">What do you pay for A2P 10DLC?</h2>
            <p>
              A2P 10DLC is the US carriers&apos; registration system for business texting over regular 10-digit numbers. There are four layers of cost, and the calculator lists each one separately. For the registration steps themselves, see our <Link href="/guides/a2p-10dlc-registration-guide">A2P 10DLC registration guide</Link>.
            </p>
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
                  <td>Once per brand</td>
                </tr>
                <tr>
                  <td>Standard brand vetting</td>
                  <td>$41.50</td>
                  <td>Once, Standard brands only</td>
                </tr>
                <tr>
                  <td>Campaign vetting</td>
                  <td>$15</td>
                  <td>Once per campaign</td>
                </tr>
                <tr>
                  <td>Sole Proprietor campaign</td>
                  <td>$2</td>
                  <td>Monthly</td>
                </tr>
                <tr>
                  <td>Low-Volume Mixed campaign</td>
                  <td>$1.50</td>
                  <td>Monthly</td>
                </tr>
                <tr>
                  <td>Standard use case campaign</td>
                  <td>$10</td>
                  <td>Monthly</td>
                </tr>
                <tr>
                  <td>Charity or 501(c)(3) nonprofit campaign</td>
                  <td>$3</td>
                  <td>Monthly</td>
                </tr>
                <tr>
                  <td>Emergency services campaign</td>
                  <td>$5</td>
                  <td>Monthly</td>
                </tr>
                <tr>
                  <td>Carrier fee, outbound SMS</td>
                  <td>$0.0035 to $0.005</td>
                  <td>Per message, by carrier</td>
                </tr>
              </tbody>
            </table>
            <p>
              Twilio&apos;s own SMS price, $0.0083 per segment on a US long code, comes on top of all this. The calculator includes it by default so that your total reflects the full cost of sending, and you can switch it off to see the registration costs alone. There can also be two less common fees: $11 to appeal a rejected Standard brand vetting, and $12.50 for the Authentication+ step on public, for-profit brands.
            </p>

            <h2 id="brand-types">Sole Proprietor, Low-Volume Standard or Standard?</h2>
            <p>The three brand types differ mainly in who qualifies and how much you can send.</p>
            <ul>
              <li>
                <strong>Sole Proprietor</strong> is for people with no tax ID, such as hobbyists, students and individuals trying messaging, in the US or Canada. You get one campaign, one phone number and up to 1,000 SMS segments and MMS a day to T-Mobile, which Twilio puts at about 3,000 across US carriers.
              </li>
              <li>
                <strong>Low-Volume Standard</strong> needs a tax ID, such as a US EIN or a Canadian Business Number. It skips the $41.50 vetting and allows up to 2,000 segments a day to T-Mobile, or about 6,000 across carriers, with up to five campaigns unless you have a valid reason for more. Throughput is lower than Standard.
              </li>
              <li>
                <strong>Standard</strong> also needs a tax ID. It adds secondary vetting, which produces a Trust Score that sets your limit, from 2,000 a day to T-Mobile up to unlimited. It allows up to five campaigns as well. Choose this if you expect to outgrow 6,000 segments a day.
              </li>
            </ul>
            <p>
              The calculator warns you when your volume at the T-Mobile share you entered goes over the brand type&apos;s documented limit. You don&apos;t need to overbuy: if you have a tax ID and low volume, Low-Volume Standard is the natural start, and you pay for vetting only when you need the extra capacity.
            </p>

            <h2 id="worked-example">Worked example: a small business sending 5,000 segments a month</h2>
            <p>
              These are the calculator&apos;s starting values: a Low-Volume Standard brand with one Low-Volume Mixed campaign, sending 5,000 segments a month, split evenly among AT&amp;T, T-Mobile, Verizon and other carriers.
            </p>
            <ul>
              <li>One-time: $4.50 brand fee plus $15 vetting comes to $19.50.</li>
              <li>Campaign fee: $1.50 a month.</li>
              <li>Carrier fees: the even split averages $0.0043 a segment, so 5,000 segments cost $21.50.</li>
              <li>Twilio&apos;s SMS price: 5,000 x $0.0083 is $41.50.</li>
            </ul>
            <p>
              That makes <strong>$64.50 a month</strong>, $84.00 for the first month and <strong>$793.50 for the first year</strong>. Notice where the money goes: registration is a small part of it, and per-segment fees dominate. So the best way to cut this bill is to send fewer segments. A single curly apostrophe can triple a message&apos;s segments, and the <Link href="/tools/sms-segment-calculator">SMS segment calculator</Link> will find it. For the rest of your Twilio costs, enter the campaign fee in the <Link href="/tools/twilio-pricing-calculator">Twilio pricing calculator</Link>.
            </p>

            <h2 id="alternatives">Can you avoid A2P 10DLC?</h2>
            <p>
              Sometimes. Twilio says toll-free numbers and short codes aren&apos;t part of the 10DLC system, though toll-free has its own onboarding and a number fee of its own. If you only send verification codes, Twilio&apos;s docs say you can use Twilio Verify rather than registering. Messages to numbers outside the US aren&apos;t covered by this system either. Learn more in <Link href="/guides/how-does-twilio-sms-work">how Twilio SMS works</Link>.
            </p>
            <Callout type="warning" title="Where these numbers come from">
              <p>
                Brand and vetting fees are from{" "}
                <a href="https://www.twilio.com/docs/trust-hub/registrations/a2p-10dlc-brand" rel="noopener">
                  Twilio&apos;s brand registration docs
                </a>
                , last updated in September 2026. Some older Twilio pages still show $4 and $44, and we used the newer figures. Monthly campaign fees are from Twilio&apos;s{" "}
                <a href="https://support.twilio.com/hc/en-us/articles/1260803965530-Pricing-and-Fees-for-A2P-10DLC-Service" rel="noopener">
                  A2P pricing and fees article
                </a>
                . Carrier fees are from its{" "}
                <a href="https://www.twilio.com/en-us/sms/pricing/us" rel="noopener">
                  US SMS pricing page
                </a>
                , which describes them per message. We apply them per segment as the cautious assumption. Check your Console before you commit. Dialbubble isn&apos;t affiliated with Twilio.
              </p>
            </Callout>
          </>
        }
      >
        <Calculator />
        <ToolCta
          title="Registered and ready to text?"
          text="Dialbubble lets you send and read texts from your registered Twilio number on your iPhone, with templates and a segment counter, and adds no fees of its own. See it in Demo Mode first."
          linkHref="/guides/how-to-send-sms-from-iphone-with-twilio"
          linkText="How to send SMS from an iPhone with Twilio"
        />
      </ToolShell>
    </>
  );
}

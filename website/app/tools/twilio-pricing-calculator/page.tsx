import Link from "next/link";
import { Callout } from "@/components/Callout";
import { ToolShell } from "@/components/ToolShell";
import { metaFor } from "@/lib/registry";
import { JsonLd, howToLd } from "@/lib/seo";
import { ToolCta } from "../_components/ToolCta";
import { Calculator } from "./Calculator";

const path = "/tools/twilio-pricing-calculator";
export const metadata = metaFor(path);

const faq = [
  {
    q: "How much does a Twilio call cost per minute?",
    a: "As of November 2026, Twilio lists US outbound calls at $0.014 a minute and inbound calls to a US local number at $0.0085 a minute. Other countries differ a lot: a call to a mobile in Australia is $0.075 a minute, and a call from a US number to a mobile in Germany is $0.3763 a minute.",
  },
  {
    q: "How much does a Twilio phone number cost?",
    a: "A US or Canadian local number is $1.15 a month and a toll-free number is $2.15 a month. A UK mobile number is $2.50, an Australian mobile number is $8.25 and a German mobile number is $30. These are Twilio's list prices as of November 2026.",
  },
  {
    q: "How much does a Twilio SMS cost in the US?",
    a: "$0.0083 per segment each way, plus a carrier fee. Outbound carrier fees range from $0.0035 on AT&T to $0.005 on Verizon. A US text sent through Twilio therefore costs about 1.2 to 1.3 cents per segment, before any A2P 10DLC registration fees.",
  },
  {
    q: "Does Twilio charge for failed messages?",
    a: "Twilio lists a failed message processing fee of $0.001 per message, applied to messages that end in a Failed status. This calculator leaves it out, because most messages don't fail. Add it under other monthly fees if your failure rate is high.",
  },
  {
    q: "Why is my real Twilio bill different from this estimate?",
    a: "Rates vary by exact destination prefix and by carrier, per-minute billing rounds up on every leg, and Twilio can change prices without notice. This calculator uses representative rates, so treat the total as a planning figure and your Twilio usage page as the truth.",
  },
  {
    q: "Is there a Twilio number for India?",
    a: "Twilio's number price list has no India entry as of November 2026, so people calling India usually use a number from another country, such as the US. Outbound calls and texts to India are listed at $0.0496 a minute to a mobile and $0.0832 per SMS segment.",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={howToLd({
          name: "Estimate a monthly Twilio bill",
          description: "Work out what a month of Twilio calls, texts and phone numbers will cost in your country.",
          path,
          steps: [
            { name: "Pick the countries", text: "Choose the country you call and text, and the type of Twilio number you'll use." },
            { name: "Enter your usage", text: "Type your monthly call minutes, texts, numbers and recording minutes." },
            { name: "Check the rates", text: "Compare the rates with Twilio's pricing page and edit any that differ for your destination." },
            { name: "Read the total", text: "See the monthly total and the cost of each line, then copy a link to the estimate." },
          ],
        })}
      />
      <ToolShell
        path={path}
        title="Twilio pricing calculator"
        intro="Estimate your monthly Twilio bill for calls, texts and phone numbers in the US, Canada, the UK, India, Australia or Germany. Every rate is editable, and nothing you type leaves this page."
        faq={faq}
        seo={
          <>
            <h2 id="how-pricing-works">How does Twilio pricing work?</h2>
            <p>
              Twilio charges pay-as-you-go for each thing you use: a monthly fee for each phone number, a per-minute price for calls and a per-segment price for texts. There&apos;s no plan to buy and no minimum. The price depends on where the call or text is going, what kind of number it&apos;s going to, and sometimes which carrier delivers it. Our guide to{" "}
              <Link href="/guides/how-does-twilio-pricing-work">how Twilio pricing works</Link> covers this in more depth.
            </p>
            <p>This calculator multiplies your usage by a representative rate for each line and adds up the month. Three details cause most of the surprises on a first bill, so they get their own controls.</p>
            <ul>
              <li>
                <strong>Mobile and landline rates can differ a lot.</strong> In Australia a call to a landline is $0.0252 a minute and a call to a mobile is $0.075, so the &ldquo;They answer on a&rdquo; switch can triple a line.
              </li>
              <li>
                <strong>Texts bill by segment.</strong> One curly apostrophe can turn a one-segment message into three. If you aren&apos;t sure of your number, run a typical message through the <Link href="/tools/sms-segment-calculator">SMS segment calculator</Link> and enter the result.
              </li>
              <li>
                <strong>Carrier fees come on top in the US and Canada.</strong> They&apos;re added per message on Twilio&apos;s price, and they vary by carrier. We apply them per segment, which is the cautious assumption, because Twilio&apos;s page describes them only as per message.
              </li>
            </ul>

            <h2 id="talk-calls">Why does a Dialbubble Talk call bill two legs?</h2>
            <p>
              A Talk call isn&apos;t internet calling from the app. Twilio first rings your regular phone, you press a key, and only then does Twilio dial the other person and join you together. Each of those two calls is a separate leg, and Twilio bills both by the minute. Turn on the Talk switch and the calculator shows both legs, along with what the first leg adds. You can read the details in <Link href="/how-it-works#talk">how two-way calls work</Link>.
            </p>
            <p>The same applies to any two-legged setup on Twilio, including apps that bridge calls with a server. Dialbubble adds no markup, and it isn&apos;t part of the calculation at all: you pay Twilio directly.</p>

            <h2 id="worked-example">Worked example: a small US business number</h2>
            <p>
              Say you use one US local number. Each month you make 300 minutes of outbound calls, take 100 minutes of inbound calls, send 500 one-segment texts and receive 200. Most of your contacts are on AT&amp;T. These are the calculator&apos;s starting values with AT&amp;T selected, so you can follow along above.
            </p>
            <table>
              <thead>
                <tr>
                  <th scope="col">Line</th>
                  <th scope="col">Sum</th>
                  <th scope="col">Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Outbound calls</td>
                  <td>300 x $0.014</td>
                  <td>$4.20</td>
                </tr>
                <tr>
                  <td>Inbound calls</td>
                  <td>100 x $0.0085</td>
                  <td>$0.85</td>
                </tr>
                <tr>
                  <td>Texts sent</td>
                  <td>500 x $0.0083</td>
                  <td>$4.15</td>
                </tr>
                <tr>
                  <td>Carrier fee on texts sent</td>
                  <td>500 x $0.0035</td>
                  <td>$1.75</td>
                </tr>
                <tr>
                  <td>Texts received</td>
                  <td>200 x $0.0083</td>
                  <td>$1.66</td>
                </tr>
                <tr>
                  <td>Carrier fee on texts received</td>
                  <td>200 x $0.0035</td>
                  <td>$0.70</td>
                </tr>
                <tr>
                  <td>Phone number</td>
                  <td>1 x $1.15</td>
                  <td>$1.15</td>
                </tr>
                <tr>
                  <th scope="row">Total</th>
                  <td></td>
                  <th scope="row">$14.46</th>
                </tr>
              </tbody>
            </table>
            <p>
              If those 300 outbound minutes were Talk calls, Twilio would also bill 300 minutes of calls to your own US phone at $0.014, which adds $4.20 and brings the month to $18.66. Sending texts to US numbers from a local number also needs <Link href="/guides/a2p-10dlc-registration-guide">A2P 10DLC registration</Link>, and the <Link href="/tools/a2p-10dlc-cost-calculator">A2P 10DLC cost calculator</Link> gives you a number to enter under other monthly fees.
            </p>

            <h2 id="rounding">Are Twilio calls rounded up to the minute?</h2>
            <p>
              Yes, on standard pay-as-you-go. Twilio&apos;s{" "}
              <a href="https://support.twilio.com/hc/en-us/articles/223132307-How-are-Twilio-voice-and-calling-product-minutes-rounded-for-billing" rel="noopener">
                billing article
              </a>{" "}
              says partial minutes round up to the next full minute, per call leg, so a call of 1 minute 20 seconds bills as 2 minutes. If you make many short calls, your billed minutes will be higher than your talk time. Enter billed minutes in the calculator, or add a margin to your estimate.
            </p>

            <h2 id="what-it-leaves-out">What this estimate leaves out</h2>
            <p>
              The rates here are representative rather than complete. Twilio&apos;s price sheet has hundreds of prefixes, and some cost far more: Alaska, Yukon, special-service numbers and a few UK mobile ranges all differ from the main rate. Picture messages, answering machine detection, transcription, Lookup add-ons, regulatory fees and taxes aren&apos;t included. Volume discounts aren&apos;t either. Numbers in some countries also need paperwork first, which the <Link href="/guides/twilio-regulatory-bundle-guide">regulatory bundle guide</Link> explains, and our guide to <Link href="/guides/how-much-does-a-twilio-phone-number-cost">what a Twilio phone number costs</Link> goes through number fees.
            </p>
            <Callout type="cost" title="Check before you commit">
              <p>
                Rates are from{" "}
                <a href="https://www.twilio.com/en-us/pricing" rel="noopener">
                  Twilio&apos;s pricing pages
                </a>{" "}
                and the CSV files they link to, read in November 2026. Twilio says prices can change without notice. Where one of its pages disagreed with its CSV, as with the UK local number and with Australian mobile and toll-free numbers, we used the CSV. Dialbubble isn&apos;t affiliated with Twilio.
              </p>
            </Callout>
          </>
        }
      >
        <Calculator />
        <ToolCta
          title="Watch your real spend from your phone"
          text="Dialbubble shows your Twilio balance and monthly usage by category, right from your own account, with no markup. Try the whole app in Demo Mode first, with no Twilio account."
          linkHref="/pricing"
          linkText="See why Dialbubble itself is free"
        />
      </ToolShell>
    </>
  );
}

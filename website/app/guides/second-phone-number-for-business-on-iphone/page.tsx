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

const path = "/guides/second-phone-number-for-business-on-iphone";
export const metadata = metaFor(path, { type: "article" });

const VOICE_PRICING = "https://www.twilio.com/en-us/voice/pricing/us";
const SMS_PRICING = "https://www.twilio.com/en-us/sms/pricing/us";

export default function Page() {
  const entry = getEntry(path)!;
  return (
    <>
      <JsonLd data={articleLd({ title: entry.title, description: entry.description, path, published: entry.published! })} />
      <Breadcrumbs path={path} />
      <PageHero
        eyebrow="Guide"
        title={entry.title}
        lede="You can add a second business number to your iPhone with a second carrier line on eSIM, a hosted business phone app, or your own Twilio account. An eSIM or hosted app is the easier fit for most people, while Twilio suits low or irregular use if you don't mind a more technical setup."
      />
      <Container>
        <div className="toc-layout">
          <TocSidebar
            items={[
              { id: "compare", title: "The options compared" },
              { id: "esim", title: "A second line on eSIM" },
              { id: "apps", title: "Hosted phone apps" },
              { id: "twilio", title: "Your own Twilio number" },
              { id: "math", title: "A monthly cost example" },
              { id: "choose", title: "How to choose" },
              { id: "faq", title: "Questions" },
            ]}
          />
          <Prose>
            <h2 id="compare">What are the ways to get a second number on iPhone?</h2>
            <p>
              Prices below are <strong>as of November 2026</strong>, taken from each company&apos;s own page. They change, so follow the links before you decide.
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Second business number options for iPhone">
              <table>
                <thead>
                  <tr>
                    <th>Option</th>
                    <th>Starting cost</th>
                    <th>Better at</th>
                    <th>Weaker at</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Second carrier line (eSIM)</td>
                    <td>Your carrier&apos;s plan price</td>
                    <td>Native calling and texting in the iPhone apps</td>
                    <td>Paying for a whole plan, with limited team features</td>
                  </tr>
                  <tr>
                    <td><a href="https://workspace.google.com/products/voice/" rel="noopener">Google Voice</a></td>
                    <td>Basic plan at no cost, or from $10 per user per month</td>
                    <td>Very low cost, and a real app for calls and texts</td>
                    <td>Availability depends on your country and plan</td>
                  </tr>
                  <tr>
                    <td><a href="https://www.quo.com/pricing" rel="noopener">Quo</a></td>
                    <td>$15 per user per month billed yearly, $19 monthly</td>
                    <td>Shared team inbox, in-app calling, unlimited US and Canada use under fair use</td>
                    <td>A monthly fee even in quiet months</td>
                  </tr>
                  <tr>
                    <td><a href="https://grasshopper.com/pricing/" rel="noopener">Grasshopper</a></td>
                    <td>From $14 a month</td>
                    <td>A simple, dedicated business line</td>
                    <td>Available only in the US and Canada</td>
                  </tr>
                  <tr>
                    <td><a href={VOICE_PRICING} rel="noopener">Twilio</a>, your own account</td>
                    <td>$1.15 a month for a US local number, plus usage</td>
                    <td>Pay per use, multiple numbers, full control through the API</td>
                    <td>Setup effort, text registration, no phone app of its own</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 id="esim">Can you add a second number with eSIM?</h2>
            <p>
              Yes, and it&apos;s the most natural option on iPhone. Per <a href="https://support.apple.com/en-us/109317" rel="noopener">Apple&apos;s Dual SIM guide</a>, you need an iPhone XS, XR or later and a carrier that supports eSIM. If the two plans come from different carriers, your iPhone must be unlocked. iPhone 13 and later can run two eSIMs at once.
            </p>
            <ol>
              <li>Ask your carrier, or another carrier, for a second plan with an eSIM.</li>
              <li>Activate it from the iPhone&apos;s cellular settings.</li>
              <li>Label the plans, such as Business and Personal. You&apos;ll use those labels to pick a number for calls and messages.</li>
              <li>Assign the right number to each contact, so calling them back uses the right line.</li>
            </ol>
            <p>
              Both numbers can make and receive calls and send iMessage, SMS or MMS, with only one using cellular data at a time. It&apos;s very simple day to day, and calls come in the normal way with your normal voicemail. Its limits only show up if you want to share the line with a colleague or manage it from a computer.
            </p>

            <h2 id="apps">Is a hosted business phone app better?</h2>
            <p>
              For many small businesses, it is. A hosted service gives you the number and its calling and texting tools ready to go, with extras that depend on the plan. You don&apos;t need to set up anything technical.
            </p>
            <ul>
              <li>
                <strong>Google Voice</strong> has <a href="https://workspace.google.com/products/voice/" rel="noopener">paid plans at $10, $20 and $30 per user per month</a>, and a basic no-cost plan. Calls to the US and Canada <a href="https://support.google.com/voice/answer/141923?hl=en" rel="noopener">are generally free when you call from the US</a>. The paid one-user Starter plan is US only. See our <Link href="/compare/dialbubble-vs-google-voice">Dialbubble and Google Voice comparison</Link>.
              </li>
              <li>
                <strong>Quo</strong>, formerly OpenPhone, <a href="https://www.quo.com/pricing" rel="noopener">charges $15, $23 or $35 per user per month billed yearly</a>, or $19, $33 or $47 monthly, with a 7-day trial. Extra numbers are $5 a month. Texting needs carrier registration, with a $19.50 one-time fee and $1.50 to $3 a month. See <Link href="/compare/dialbubble-vs-quo">Dialbubble and Quo side by side</Link>.
              </li>
              <li>
                <strong>Grasshopper</strong> <a href="https://grasshopper.com/pricing/" rel="noopener">starts at $14 a month</a> and serves only the US and Canada. See <Link href="/compare/dialbubble-vs-grasshopper">how Grasshopper compares</Link>.
              </li>
            </ul>
            <p>Hosted apps beat a Twilio setup on convenience. The trade-off is a monthly fee that stays the same even if you make few calls.</p>

            <h2 id="twilio">How does your own Twilio number work on iPhone?</h2>
            <p>
              You rent a number directly from Twilio and pay per minute and per text. Twilio has no iPhone calling app of its own, so you decide how each direction works:
            </p>
            <ul>
              <li><strong>Incoming calls.</strong> <Link href="/guides/twilio-call-forwarding">Forward them to your iPhone</Link> using a TwiML Bin. They ring as ordinary calls on your regular number.</li>
              <li><strong>Outgoing calls.</strong> Use the API, or an app such as Dialbubble. Twilio rings your regular phone, then dials the other person, who sees your Twilio number. Dialbubble has no in-app calling, so two-way calls bill two legs.</li>
              <li><strong>Texts.</strong> US long-code numbers need <Link href="/guides/a2p-10dlc-registration-guide">A2P 10DLC registration</Link>. You read and send them through an app or the API. Dialbubble checks for new texts while it&apos;s open and has no push notifications, so urgent texts could wait.</li>
            </ul>

            <p>
              If you already have a business line, you may not need to buy anything. You can <Link href="/guides/how-to-add-a-verified-caller-id-in-twilio">verify that line as a caller ID at Twilio</Link> and show it on outgoing calls. It works for calls only, so you can&apos;t text from it through Twilio.
            </p>

            <h2 id="math">How much does a Twilio second number cost per month?</h2>
            <p>
              Take a solo contractor who makes 200 minutes of outgoing calls, takes 100 forwarded minutes and sends 200 texts each month. <a href={VOICE_PRICING} rel="noopener">Voice</a> and <a href={SMS_PRICING} rel="noopener">SMS</a> rates below are Twilio&apos;s US prices as of November 2026. The text line uses the T-Mobile carrier fee of $0.0045, and other carriers differ slightly.
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Worked monthly cost for a Twilio second number">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Sum</th>
                    <th>Busy month</th>
                    <th>Quiet month</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>US local number</td>
                    <td>Flat</td>
                    <td>$1.15</td>
                    <td>$1.15</td>
                  </tr>
                  <tr>
                    <td>Outgoing, two legs at $0.0140</td>
                    <td>200 min, or 50 min when quiet</td>
                    <td>$5.60</td>
                    <td>$1.40</td>
                  </tr>
                  <tr>
                    <td>Forwarded, $0.0085 in + $0.0140 out</td>
                    <td>100 min, or 20 min when quiet</td>
                    <td>$2.25</td>
                    <td>$0.45</td>
                  </tr>
                  <tr>
                    <td>Texts out, $0.0083 + $0.0045</td>
                    <td>200, or 30 when quiet</td>
                    <td>$2.56</td>
                    <td>$0.38</td>
                  </tr>
                  <tr>
                    <td>Sole Proprietor campaign</td>
                    <td>Monthly</td>
                    <td>$2.00</td>
                    <td>$2.00</td>
                  </tr>
                  <tr>
                    <td><strong>Total</strong></td>
                    <td></td>
                    <td><strong>$13.56</strong></td>
                    <td><strong>$5.38</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Callout type="cost" title="What this means">
              <p>
                In a busy month, Twilio comes close to Quo&apos;s $15 Starter price, which also has a $1.50 to $3 messaging fee. Replies cost extra on Twilio ($0.0083 each plus any carrier fee), and registration adds a one-time $4.50 brand fee and $15 campaign fee. So at this level, the savings are small and a hosted app may be worth the difference. Twilio wins in quiet months, or if you skip texting: without the last two rows, the busy month falls to $9.00. Estimate your own with the <Link href="/tools/twilio-pricing-calculator">Twilio pricing calculator</Link>.
              </p>
            </Callout>

            <h2 id="choose">Which second number should you choose?</h2>
            <ul>
              <li><strong>Choose an eSIM</strong> if you want it to feel like a normal phone line and are happy to pay for a plan.</li>
              <li><strong>Choose a hosted app</strong> if you want to answer calls in an app, share a line with a team, or never think about setup. Dialbubble isn&apos;t the right choice if you need any of that.</li>
              <li><strong>Choose Google Voice</strong> if you&apos;re in the US, on a tight budget and your needs are simple.</li>
              <li><strong>Choose your own Twilio number</strong> if your use is low or uneven, you want several numbers, or you already use Twilio. There&apos;s more on <Link href="/guides/how-to-use-a-twilio-phone-number">how to use a Twilio phone number</Link>, and on showing an existing number in <Link href="/guides/how-to-make-calls-from-a-different-number">how to call from a different number</Link>.</li>
            </ul>

            <h2 id="faq">Questions people ask</h2>
            <Faq
              items={[
                {
                  q: "Can I have two phone numbers on one iPhone?",
                  a: "Yes. With Dual SIM, an iPhone XS, XR or later can have two active numbers using a physical SIM and an eSIM, or two eSIMs on iPhone 13 and later. Your carrier needs to support eSIM. Apps can also add numbers without a second plan.",
                },
                {
                  q: "What's the cheapest second phone number for a business?",
                  a: "Google Voice's basic plan has no cost where it's available. Among paid routes, a $1.15 a month Twilio number is cheap at low volume, though usage and text registration add to it. Compare your actual minutes and texts rather than the headline price.",
                },
                {
                  q: "Do I need a separate app to use a Twilio number on my iPhone?",
                  a: "To call out and text from your iPhone without using the API or the Twilio Console, yes. For incoming calls, no: forward them to your regular number at Twilio and they ring like any other call.",
                },
                {
                  q: "Will people see my personal number?",
                  a: "Not on calls placed through the business number. With a forwarded incoming call, the caller only sees the number they dialed. Calls you make directly from your personal line still show your personal number.",
                },
              ]}
            />
          </Prose>
        </div>
      </Container>
      <RelatedLinks path={path} />
      <CtaBand title="Already have a Twilio number for your business?" text="Dialbubble puts its calls and texts on your iPhone with no subscription or markup. If you need in-app calling, a hosted app above is the better fit." />
    </>
  );
}

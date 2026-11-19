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

const path = "/guides/international-calling-on-iphone-with-your-own-number";
export const metadata = metaFor(path, { type: "article" });

const VOICE_PRICING = "https://www.twilio.com/en-us/voice/pricing/us";
const MX = "https://www.twilio.com/en-us/voice/pricing/mx";
const GB = "https://www.twilio.com/en-us/voice/pricing/gb";
const IN = "https://www.twilio.com/en-us/voice/pricing/in";

export default function Page() {
  const entry = getEntry(path)!;
  return (
    <>
      <JsonLd data={articleLd({ title: entry.title, description: entry.description, path, published: entry.published! })} />
      <Breadcrumbs path={path} />
      <PageHero
        eyebrow="Guide"
        title={entry.title}
        lede="Yes, you can call abroad from your iPhone with your own number: press and hold 0 for a plus sign, then dial the country code and number, and your carrier bills you under its international rates. To keep the cost down, compare your carrier's plan with internet calling apps, Google Voice, or your own Twilio number."
      />
      <Container>
        <div className="toc-layout">
          <TocSidebar
            items={[
              { id: "dial", title: "How to dial" },
              { id: "options", title: "Your options compared" },
              { id: "twilio", title: "Calling abroad through Twilio" },
              { id: "geo", title: "Turn on Geo Permissions" },
              { id: "cost", title: "What a call costs" },
              { id: "callerid", title: "Will they see your number?" },
              { id: "faq", title: "Questions" },
            ]}
          />
          <Prose>
            <h2 id="dial">How do you make an international call on an iPhone?</h2>
            <ol>
              <li>Open the Phone app and go to the keypad.</li>
              <li>Touch and hold 0 until a plus sign appears.</li>
              <li>Enter the country code, then the number. Drop a leading 0 from the local number if the country uses one, as the UK and many others do. For example, a London number written 020 7946 0123 becomes +44 20 7946 0123.</li>
              <li>Tap Call.</li>
            </ol>
            <p>
              That&apos;s the international <Link href="/guides/e164-phone-number-format">E.164 number format</Link>. Save contacts this way and they&apos;ll work from any country. Before you dial, check that your plan allows international calls, because some carriers restrict them or charge high rates by default.
            </p>

            <h2 id="options">What&apos;s the best way to call abroad from an iPhone?</h2>
            <p>It depends on who you&apos;re calling and how often. Each option has a case where it&apos;s the right one.</p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="International calling options for iPhone">
              <table>
                <thead>
                  <tr>
                    <th>Option</th>
                    <th>What they see</th>
                    <th>Cost</th>
                    <th>Better when</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Your carrier</td>
                    <td>Your mobile number, where it&apos;s passed through</td>
                    <td>Varies by plan, so check yours</td>
                    <td>You call rarely, or your plan includes the country</td>
                  </tr>
                  <tr>
                    <td>FaceTime Audio, WhatsApp and similar</td>
                    <td>Your account in that app</td>
                    <td>Data only</td>
                    <td>The other person has the same app. Usually the cheapest</td>
                  </tr>
                  <tr>
                    <td><a href="https://support.google.com/voice/answer/141923?hl=en" rel="noopener">Google Voice</a></td>
                    <td>Your Google Voice number</td>
                    <td>Prepaid per-minute credit, at <a href="https://voice.google.com/rates" rel="noopener">Google&apos;s listed rates</a></td>
                    <td>You already use it. Calling happens inside the app</td>
                  </tr>
                  <tr>
                    <td>Your Twilio account</td>
                    <td>Your Twilio or verified number, where it&apos;s passed through</td>
                    <td>Per-minute legs, shown below</td>
                    <td>You want a business number and clear per-minute rates</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              For a friend or relative who has WhatsApp, an internet call is hard to beat. Twilio makes the most sense when you need to reach ordinary phone numbers, such as a supplier&apos;s landline, and want them to see a specific number you own.
            </p>

            <h2 id="twilio">How do you call abroad with Twilio?</h2>
            <p>
              Twilio connects your phone and the other person&apos;s phone, showing the caller ID you chose from your own numbers. The setup is short: <Link href="/guides/how-to-use-a-twilio-phone-number">get a Twilio number</Link> or <Link href="/guides/how-to-add-a-verified-caller-id-in-twilio">verify the number you already have</Link>, turn on the destination country, and start the call. Using the API or Dialbubble, Twilio rings your regular phone first, then dials abroad.
            </p>
            <p>
              You&apos;ll need to upgrade first, because Twilio <Link href="/guides/is-twilio-free-trial-limits">trial accounts</Link> can only call within your sign-up country, and only verified numbers. Dialbubble has no in-app calling, so it doesn&apos;t use your data connection for the call, and the two-leg cost below applies. Want a local number in another country instead? Many countries require proof of identity and address first, explained in our <Link href="/guides/twilio-regulatory-bundle-guide">Twilio regulatory bundle guide</Link>.
            </p>

            <h2 id="geo">How do you turn on Twilio Geo Permissions?</h2>
            <p>
              Twilio blocks calls to many countries until you allow them, to limit toll fraud. If you skip this step, the call fails with <Link href="/twilio-errors/13227">error 13227 from a Dial</Link> or <Link href="/twilio-errors/21215">error 21215 from the API</Link>. <a href="https://www.twilio.com/docs/sip-trunking/voice-dialing-geographic-permissions" rel="noopener">Twilio&apos;s Geo Permissions docs</a> give these steps:
            </p>
            <ol>
              <li>In the Twilio Console, go to Voice, then Settings, then Geo permissions.</li>
              <li>Select the country from the list.</li>
              <li>Enable Low-Risk number ranges first. Only turn on High-Risk ranges if a specific number needs them.</li>
              <li>Select Save. Only Owner and Administrator roles can change this.</li>
              <li>Use the Phone Number Permission Check on that page to test a specific number.</li>
            </ol>
            <Callout type="warning" title="Enable only what you need">
              <p>
                Geo Permissions protect you from a large bill if your credentials ever leak. Allow only the countries you actually call, and be especially careful with High-Risk ranges, which Twilio classes as having the highest risk of telecom fraud.
              </p>
            </Callout>

            <h2 id="cost">How much does an international call cost with Twilio?</h2>
            <p>
              A two-way call has two legs: one from Twilio to your phone, and one from Twilio to the person abroad. Here are the costs for a 10-minute call when you&apos;re in the US, with your leg at <a href={VOICE_PRICING} rel="noopener">$0.0140 a minute</a>. All rates are from Twilio&apos;s pricing pages, as of November 2026.
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Worked cost of a 10-minute international call through Twilio">
              <table>
                <thead>
                  <tr>
                    <th>Calling</th>
                    <th>Rate per minute</th>
                    <th>Their leg</th>
                    <th>Your leg</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Mexico, landline</td>
                    <td><a href={MX} rel="noopener">$0.0160</a></td>
                    <td>$0.16</td>
                    <td>$0.14</td>
                    <td>$0.30</td>
                  </tr>
                  <tr>
                    <td>Mexico, mobile</td>
                    <td><a href={MX} rel="noopener">$0.0473</a></td>
                    <td>$0.473</td>
                    <td>$0.14</td>
                    <td>$0.61</td>
                  </tr>
                  <tr>
                    <td>UK, landline</td>
                    <td><a href={GB} rel="noopener">$0.0158</a></td>
                    <td>$0.158</td>
                    <td>$0.14</td>
                    <td>$0.30</td>
                  </tr>
                  <tr>
                    <td>UK, mobile</td>
                    <td><a href={GB} rel="noopener">$0.0305</a></td>
                    <td>$0.305</td>
                    <td>$0.14</td>
                    <td>$0.45</td>
                  </tr>
                  <tr>
                    <td>India, landline</td>
                    <td><a href={IN} rel="noopener">$0.0699</a></td>
                    <td>$0.699</td>
                    <td>$0.14</td>
                    <td>$0.84</td>
                  </tr>
                  <tr>
                    <td>India, mobile</td>
                    <td><a href={IN} rel="noopener">$0.0496</a></td>
                    <td>$0.496</td>
                    <td>$0.14</td>
                    <td>$0.64</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              A worked line: UK mobile is (10 × $0.0305) + (10 × $0.0140) = $0.305 + $0.14 = $0.445. Add the monthly number fee if you bought one, $1.15 for US local. For a one-way voice message, you pay only their leg, because Twilio doesn&apos;t ring you. For other volumes, use the <Link href="/tools/twilio-pricing-calculator">Twilio pricing calculator</Link>.
            </p>
            <p>
              Over a month, it works out like this. Say you spend 100 minutes on calls to UK mobiles from the US. That&apos;s 100 × ($0.0305 + $0.0140) = $4.45 in call legs, plus $1.15 for a US local number, or $5.60 in total. Compare that with what your carrier charges for the same 100 minutes to see whether the extra step of connecting through Twilio is worth it for you. If your plan already includes the country, it probably isn&apos;t.
            </p>
            <p>Three things can change these numbers:</p>
            <ul>
              <li><strong>Where you are.</strong> If you&apos;re traveling, your leg is itself an international call to wherever your phone is now, at that country&apos;s rate. Your carrier may also charge for roaming.</li>
              <li><strong>The number type.</strong> Twilio lists much higher prices for premium and special numbers. The <a href={GB} rel="noopener">UK page</a> shows $1.0479 a minute for premium service numbers, for example.</li>
              <li><strong>Your caller ID&apos;s country.</strong> Twilio charges <a href="https://help.twilio.com/articles/4403990577435-Understanding-Surcharge-Pricing-for-Calls-to-UK-Destinations" rel="noopener">surcharged rates on UK calls from some origins</a>, though it says calls from the US, UK, EU and Canada aren&apos;t affected. See <Link href="/guides/how-does-twilio-pricing-work">how Twilio pricing works</Link> for the wider picture.</li>
            </ul>

            <h2 id="callerid">Will they see your number when you call abroad?</h2>
            <p>
              Usually, but it&apos;s not guaranteed. Twilio <a href="https://support.twilio.com/hc/en-us/articles/223180108-Are-there-any-issues-with-caller-IDs-from-or-to-countries-outside-the-US" rel="noopener">says caller ID preservation can&apos;t be guaranteed everywhere</a>, because local rules and carrier agreements vary. Some countries change it to ensure delivery. Twilio&apos;s help article on <a href="https://support.twilio.com/hc/en-us/articles/223132227-Local-Caller-ID-CLI-international-compatibility" rel="noopener">local caller ID</a> and its <a href="https://www.twilio.com/en-us/guidelines/gb/voice" rel="noopener">country voice guidelines</a> have the detail for each destination.
            </p>
            <p>
              Two tips: send caller IDs in E.164 format, and test with someone in the country before you rely on it. And only show a number you own or have verified, since <Link href="/guides/how-to-make-calls-from-a-different-number">showing someone else&apos;s number to mislead them is spoofing</Link>.
            </p>

            <h2 id="faq">Questions people ask</h2>
            <Faq
              items={[
                {
                  q: "Can I make an international call on my iPhone for free?",
                  a: "Yes, if the other person uses the same internet calling app, such as FaceTime Audio or WhatsApp, and you have Wi-Fi or data. Calling a regular phone number abroad generally costs money, unless your carrier plan includes that country.",
                },
                {
                  q: "Why does my Twilio international call fail?",
                  a: "The most common cause is that the country isn't enabled in Voice Geo Permissions, which shows up as error 13227 or 21215. Enable the country's Low-Risk ranges and try again. If the number is in a High-Risk range, the Phone Number Permission Check on the same page will tell you.",
                },
                {
                  q: "Do I need a number in the other country?",
                  a: "No. A US Twilio number can call abroad. A local number can make your calls more familiar to the people you call and lets them call you at local rates, but many countries require a regulatory bundle before Twilio will give you one.",
                },
                {
                  q: "Can I keep showing my own mobile number when I call through Twilio?",
                  a: "Yes, if you verify it as a caller ID on your Twilio account. It works for calls only, not for texts. Caller ID abroad isn't guaranteed, so test it in the destination country first.",
                },
              ]}
            />
          </Prose>
        </div>
      </Container>
      <RelatedLinks path={path} />
      <CtaBand title="Call abroad at Twilio's per-minute rates" text="Dialbubble starts international calls from your iPhone through your own Twilio account, with no markup on the two legs. Enable the country in Geo Permissions first." />
    </>
  );
}

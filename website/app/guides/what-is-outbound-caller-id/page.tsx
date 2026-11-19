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

const path = "/guides/what-is-outbound-caller-id";
export const metadata = metaFor(path, { type: "article" });

const callerIdTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="+14155550199">
    <Number>+14155550123</Number>
  </Dial>
</Response>`;

const apiCall = `curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Calls.json" \\
  --data-urlencode "To=+14155550123" \\
  --data-urlencode "From=+14155550199" \\
  --data-urlencode "Twiml=<Response><Say>Your order is ready for pickup.</Say></Response>" \\
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"`;

export default function Page() {
  const entry = getEntry(path)!;
  return (
    <>
      <JsonLd data={articleLd({ title: entry.title, description: entry.description, path, published: entry.published! })} />
      <Breadcrumbs path={path} />
      <PageHero
        eyebrow="Guide"
        title={entry.title}
        lede="Outbound caller ID is the phone number, and sometimes the name, that people see when you call them. It's sent with your call by your phone company or calling service, so on Twilio you choose it from numbers you bought or verified."
      />
      <Container>
        <div className="toc-layout">
          <TocSidebar
            items={[
              { id: "how", title: "How it works" },
              { id: "twilio", title: "Setting it on Twilio" },
              { id: "scenario", title: "Three calls, three results" },
              { id: "name", title: "Showing a business name" },
              { id: "spam", title: "Why calls show as spam" },
              { id: "rules", title: "The legal limit" },
              { id: "faq", title: "Questions" },
            ]}
          />
          <Prose>
            <h2 id="how">How does outbound caller ID work?</h2>
            <p>
              &quot;Outbound&quot; only means the calls you make, as opposed to the calls you receive. Your caller ID has up to three separate parts, and each one is controlled by someone different.
            </p>
            <ul>
              <li><strong>The number.</strong> Set by your carrier, or by you when you use a service such as Twilio.</li>
              <li><strong>The name.</strong> Usually looked up by the receiving side from a database, known as CNAM in the US. If you don&apos;t register a name, it may be blank or not what you expect.</li>
              <li><strong>Any warning label.</strong> Such as &quot;spam likely&quot;. This comes from carriers and the analytics companies they work with, not from you.</li>
            </ul>
            <p>That split explains why you can have the number exactly right and still be labeled as spam.</p>
            <p>
              Caller ID also belongs to the service that places the call. A call from your iPhone&apos;s Phone app carries your carrier number, or the line you picked with Dual SIM. A call placed by Twilio carries whatever Twilio is told to send, within its rules. Setting something in one has no effect on the other, which is why your Twilio number won&apos;t appear when you dial from the keypad as usual.
            </p>

            <h2 id="twilio">How do you set a caller ID on Twilio?</h2>
            <p>
              There&apos;s no account-wide caller ID setting to think about. You set it per call, in one of two places, and Twilio limits what you can put there.
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Where Twilio caller ID is set">
              <table>
                <thead>
                  <tr>
                    <th>How the call starts</th>
                    <th>Where it&apos;s set</th>
                    <th>What&apos;s allowed</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>API request</td>
                    <td><code>From</code> parameter</td>
                    <td>A Twilio number or verified outgoing caller ID on your account</td>
                  </tr>
                  <tr>
                    <td>TwiML <code>&lt;Dial&gt;</code></td>
                    <td><code>callerId</code> attribute</td>
                    <td>A number you bought from Twilio, a number you verified, or the <code>To</code> or <code>From</code> number of the current call</td>
                  </tr>
                  <tr>
                    <td>TwiML <code>&lt;Dial&gt;</code> with no <code>callerId</code></td>
                    <td>Nothing to set</td>
                    <td>On a forwarded incoming call, the person you dial sees the original caller&apos;s number</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Those rules come from Twilio&apos;s <a href="https://www.twilio.com/docs/voice/api/call-resource" rel="noopener">Call resource</a> and <a href="https://www.twilio.com/docs/voice/twiml/dial" rel="noopener">Dial</a> docs. Try anything else in <code>From</code> and you&apos;ll get <Link href="/twilio-errors/21210">error 21210, the &quot;not verified&quot; refusal</Link>. To add a number you already own, follow <Link href="/guides/how-to-add-a-verified-caller-id-in-twilio">how to add a verified caller ID in Twilio</Link>.
            </p>

            <h2 id="scenario">What does the other person actually see?</h2>
            <p>
              Say you run a plumbing business. Your Twilio number is +1 415 555 0199, your customer is +1 415 555 0123, and you make three kinds of call on the same day.
            </p>
            <p>
              <strong>Call one: an automated reminder.</strong> You send an API request with the Twilio number as <code>From</code>. The customer sees +1 415 555 0199.
            </p>
            <CodeBlock title="Reminder call (curl)" code={apiCall} />
            <p>
              <strong>Call two: a customer calls you, and it forwards to your mobile.</strong> With a plain <code>&lt;Dial&gt;</code>, your mobile shows the customer&apos;s number, so you know who it is. The <Link href="/guides/twilio-call-forwarding">Twilio call forwarding guide</Link> covers this in full.
            </p>
            <p>
              <strong>Call three: same forward, but you want to know it&apos;s a business call.</strong> Add <code>callerId</code> and your mobile shows the Twilio number instead. You&apos;ll recognize it as work, but you lose the customer&apos;s number on screen.
            </p>
            <CodeBlock title="Forward that shows your Twilio number" code={callerIdTwiml} />
            <Callout type="info" title="When it's not guaranteed">
              <p>
                Twilio <a href="https://support.twilio.com/hc/en-us/articles/223180108-Are-there-any-issues-with-caller-IDs-from-or-to-countries-outside-the-US" rel="noopener">says caller ID can&apos;t be guaranteed to all destinations</a>. Some countries change or add digits to it. If you call abroad, read about <Link href="/guides/international-calling-on-iphone-with-your-own-number">international calling from your own number</Link> and test with someone in that country.
              </p>
            </Callout>

            <h2 id="name">Can you show a business name instead of a number?</h2>
            <p>
              In the US, you can register a name alongside your number. Twilio&apos;s <a href="https://www.twilio.com/docs/voice/brand-your-calls-using-cnam" rel="noopener">CNAM guide</a>, a public beta as of November 2026, says it&apos;s available only for US numbers, and your Business Profile needs an EIN or DUNS number. Names are limited to 15 characters, so &quot;Bay Area Plumbing&quot; at 17 characters would need shortening to something like &quot;BayAreaPlumbing&quot;, and the change can take 48 to 72 hours to reach every US carrier.
            </p>
            <p>
              Even then, the display depends on the other person&apos;s carrier and phone. Twilio also offers <a href="https://www.twilio.com/docs/voice/branded-calling" rel="noopener">Branded Calling</a>, which can add a business name, call reason and logo, with its own registration. Check Twilio&apos;s current terms for those, since it&apos;s a separate product with its own eligibility.
            </p>

            <h2 id="spam">Why does my outbound caller ID show as spam?</h2>
            <p>
              A correct number can still get labeled, for two main reasons. Analytics engines judge calling patterns, and US carriers check a digital signature on the call.
            </p>
            <p>
              That signature system is called SHAKEN/STIR. Twilio&apos;s <a href="https://www.twilio.com/docs/voice/trusted-calling-with-shakenstir/shakenstir-onboarding" rel="noopener">onboarding docs</a> set out three levels, and which one you get depends on your account and number.
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="SHAKEN/STIR attestation levels on Twilio">
              <table>
                <thead>
                  <tr>
                    <th>Level</th>
                    <th>What it says</th>
                    <th>How you get it on Twilio</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>A</td>
                    <td>The caller is known and has the right to use this number</td>
                    <td>Approved Business Profile and SHAKEN/STIR Trust Product, with the number assigned to both</td>
                  </tr>
                  <tr>
                    <td>B</td>
                    <td>The caller is known, but their right to this number is unknown</td>
                    <td>Approved profile and Trust Product. This is also the highest level for non-Twilio numbers, such as a verified caller ID</td>
                  </tr>
                  <tr>
                    <td>C</td>
                    <td>The lowest level, with no approved profile behind it</td>
                    <td>No approved profile and Trust Product, or rejected ones</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>Things worth trying if your calls get flagged, roughly in order of effort:</p>
            <ol>
              <li>Call people who expect to hear from you, and don&apos;t place many short calls in a burst. Those habits are the ones you control directly.</li>
              <li>Use a number people recognize, and answer call-backs on it. Forward it to a phone if needed.</li>
              <li>Register your business in Twilio&apos;s Trust Hub and work toward level A.</li>
              <li>
                Look at <a href="https://www.twilio.com/docs/voice/spam-monitoring-with-voiceintegrity" rel="noopener">Twilio Voice Integrity</a>, which registers your business and numbers with major US analytics vendors to reduce spam labels.
              </li>
            </ol>
            <p>None of these guarantees a clean label, since the decision belongs to the carriers and analytics companies. Be wary of anyone who promises one.</p>

            <h2 id="rules">What are you not allowed to do with caller ID?</h2>
            <p>
              Don&apos;t show a number you don&apos;t have the right to use. In the US, <a href="https://www.law.cornell.edu/uscode/text/47/227" rel="noopener">47 U.S.C. § 227(e)</a> bars knowingly sending misleading or inaccurate caller ID with intent to defraud, cause harm or wrongfully obtain anything of value. The FCC explains this in its <a href="https://www.fcc.gov/consumers/guides/spoofing" rel="noopener">guide to caller ID spoofing</a>. Other countries have their own rules, and this is general information rather than legal advice. If you need a second number legitimately, here are the <Link href="/guides/how-to-make-calls-from-a-different-number">legal ways to call from a different number</Link>.
            </p>

            <h2 id="faq">Questions people ask</h2>
            <Faq
              items={[
                {
                  q: "Is outbound caller ID the same as CNAM?",
                  a: "Not quite. Outbound caller ID usually means the number shown when you call. CNAM is the name database used in the US to look up a name for that number. You can set the number on each Twilio call, but the name has to be registered separately.",
                },
                {
                  q: "Does Twilio have a caller ID policy?",
                  a: "In practice, yes. The number on an outgoing call must be a Twilio number or a number you've verified on your account. A Dial can also reuse the To or From number of the current call. Twilio's Acceptable Use Policy also bars misleading others about who you are.",
                },
                {
                  q: "Can I use a verified caller ID for texts?",
                  a: "No. Twilio says verified numbers are for outbound calls only, and outgoing SMS and MMS aren't supported from them. To text, you need a Twilio number that can send SMS.",
                },
                {
                  q: "Why does a forwarded call show the original caller's number?",
                  a: "That's the default for Dial on an incoming call, so you can see who's calling. Add a callerId attribute with your Twilio number if you'd rather see that instead.",
                },
              ]}
            />
          </Prose>
        </div>
      </Container>
      <RelatedLinks path={path} />
      <CtaBand title="See which number you're calling from, every time" text="Dialbubble lets you pick from your Twilio numbers before each call, using your own account. Look around in Demo Mode, no Twilio account needed." />
    </>
  );
}

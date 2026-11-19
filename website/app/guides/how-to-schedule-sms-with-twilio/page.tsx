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

const path = "/guides/how-to-schedule-sms-with-twilio";
export const metadata = metaFor(path, { type: "article" });

const SCHEDULING = "https://www.twilio.com/docs/messaging/features/message-scheduling";
const SERVICES = "https://www.twilio.com/docs/messaging/tutorials/send-messages-with-messaging-services";

const createService = `curl -X POST "https://messaging.twilio.com/v1/Services" \\
  --data-urlencode "FriendlyName=Appointment reminders" \\
  -u "$TWILIO_API_KEY:$TWILIO_API_SECRET"`;

const addNumber = `curl -X POST "https://messaging.twilio.com/v1/Services/MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/PhoneNumbers" \\
  --data-urlencode "PhoneNumberSid=PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \\
  -u "$TWILIO_API_KEY:$TWILIO_API_SECRET"`;

const scheduleRequest = `curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \\
  --data-urlencode "To=+12025550123" \\
  --data-urlencode "MessagingServiceSid=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \\
  --data-urlencode "Body=Reminder from Harbor Bike Shop: your tune-up is tomorrow at 10 AM. Reply STOP to opt out." \\
  --data-urlencode "ScheduleType=fixed" \\
  --data-urlencode "SendAt=2026-11-09T17:00:00Z" \\
  -u "$TWILIO_API_KEY:$TWILIO_API_SECRET"`;

const scheduleResponse = `{
  "sid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "status": "scheduled",
  "from": null,
  "to": "+12025550123",
  "messaging_service_sid": "MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "num_segments": "0",
  "price": null,
  "date_sent": null
}`;

const cancelRequest = `curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages/SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.json" \\
  --data-urlencode "Status=canceled" \\
  -u "$TWILIO_API_KEY:$TWILIO_API_SECRET"`;

const steps = [
  { name: "Create a Messaging Service", text: "Make one in the Twilio Console or with the Services API. Note its SID, which starts with MG." },
  { name: "Add your number to the sender pool", text: "Add a number that can reach your recipient. For US traffic, make sure it is registered or verified." },
  { name: "Convert your send time to UTC", text: "Work out the UTC time using the offset for the date you are sending on, and write it as an ISO-8601 timestamp." },
  { name: "Create the message", text: "POST to the Messages resource with To, MessagingServiceSid, Body, ScheduleType=fixed and SendAt." },
  { name: "Save the SID and check the status", text: "The response should say status scheduled. Keep the SID in case you need to cancel." },
];

const toc = [
  { id: "needs", title: "What you need first" },
  { id: "steps", title: "How to schedule a text, step by step" },
  { id: "time", title: "Getting the time right" },
  { id: "cancel", title: "How to cancel a scheduled text" },
  { id: "errors", title: "Scheduling errors and fixes" },
  { id: "limits", title: "What scheduling doesn't do" },
  { id: "no-code", title: "Scheduling without code" },
  { id: "faq", title: "Questions" },
];

const faq = [
  {
    q: "Does Twilio charge extra to schedule a message?",
    a: "No. Twilio's docs say scheduling comes at no cost and you only pay for the messages sent. A canceled message is not sent.",
  },
  {
    q: "Can I schedule a text without a Messaging Service?",
    a: "No. Without MessagingServiceSid, Twilio treats the request as a normal message and sends it, or returns error 35118 if it spots the scheduling parameters. Passing only From isn't enough.",
  },
  {
    q: "How far ahead can I schedule an SMS on Twilio?",
    a: "Twilio's scheduling docs set the window at 15 minutes to 35 days between your request and the send time.",
  },
  {
    q: "Can I edit a scheduled message?",
    a: "The documented option is cancellation, by setting its status to canceled. To change the wording or time, cancel it and create a new one, then save the new SID.",
  },
  {
    q: "What happens if the person opts out after I schedule?",
    a: "The scheduled message stays in place and fails at its send time. Twilio suggests canceling any remaining scheduled messages to that person.",
  },
];

export default function Page() {
  const entry = getEntry(path)!;
  return (
    <>
      <JsonLd data={howToLd({ name: entry.title, description: entry.description, path, steps })} />
      <Breadcrumbs path={path} />
      <PageHero
        eyebrow="Guide"
        title={entry.title}
        lede="To schedule an SMS with Twilio, create a message through a Messaging Service and add ScheduleType=fixed and a SendAt time in UTC. Twilio holds the text and sends it at that time, as long as it's between 15 minutes and 35 days away."
      />
      <Container>
        <div className="toc-layout">
          <TocSidebar items={toc} />
          <Prose>
            <h2 id="needs">What do you need before you schedule?</h2>
            <p>
              <a href={SCHEDULING} rel="noopener">
                Twilio&apos;s Message Scheduling
              </a>{" "}
              is built into the Messaging API, and the docs say it comes at no extra cost. You only pay for messages that are sent. Before you start, check these three things:
            </p>
            <ul>
              <li>
                <strong>A paid account.</strong> On a trial, you can only send predefined templates to verified numbers. Our page on{" "}
                <Link href="/guides/is-twilio-free-trial-limits">Twilio trial limits</Link> explains what&apos;s blocked.
              </li>
              <li>
                <strong>A Messaging Service.</strong> This is a Twilio settings group that holds your senders. Scheduling doesn&apos;t work from a bare number.
              </li>
              <li>
                <strong>A number allowed to send.</strong> For US texts from a local number, you need{" "}
                <Link href="/guides/a2p-10dlc-registration-guide">A2P 10DLC registration</Link>, so do that first. Twilio accepting a scheduled text doesn&apos;t prove it will go out, because some
                failures only appear at the send time.
              </li>
            </ul>

            <h2 id="steps">How to schedule a text, step by step</h2>
            <p>The commands use API key credentials stored in environment variables, and fictional numbers.</p>
            <ol>
              <li>
                <strong>Create a Messaging Service.</strong> Use the Messaging section of the Console, or{" "}
                <a href={SERVICES} rel="noopener">
                  the Services API
                </a>
                . Note the SID in the response, which starts with <code>MG</code>.
                <CodeBlock title="Create the service" code={createService} />
              </li>
              <li>
                <strong>Add your number to the sender pool.</strong> You&apos;ll need your number&apos;s SID, which starts with <code>PN</code>. Skip this and you risk{" "}
                <Link href="/twilio-errors/21703">error 21703</Link>, meaning no sender is available.
                <CodeBlock title="Add a number to the service" code={addNumber} />
              </li>
              <li>
                <strong>Convert your send time to UTC.</strong> Say you want Monday, November 9, 2026, at 9:00 AM in Los Angeles. Pacific Time is UTC-8 on that date, so the value is{" "}
                <code>2026-11-09T17:00:00Z</code>.
              </li>
              <li>
                <strong>Create the message.</strong> It&apos;s a normal send with two extra parameters. Note that there&apos;s no <code>From</code> here, as the service picks the
                sender.
                <CodeBlock title="Schedule the text" code={scheduleRequest} />
              </li>
              <li>
                <strong>Save the SID and check the status.</strong> You should see <code>scheduled</code>. An empty <code>from</code>, <code>0</code> segments and no price are all normal
                at this stage, since nothing has been sent.
                <CodeBlock title="Response (shortened)" code={scheduleResponse} />
              </li>
            </ol>
            <p>
              At the send time, the status moves to <code>queued</code>, and from there it follows the same path as any other text. Our guide to{" "}
              <Link href="/guides/how-does-twilio-sms-work">how Twilio SMS works</Link> explains each status after that. If you&apos;ve set a status callback URL, Twilio posts each change,
              but not the first <code>scheduled</code> status, so read that one from the response.
            </p>

            <h2 id="time">How do you get the send time right?</h2>
            <p>
              Most scheduling mistakes are time mistakes. <code>SendAt</code> should be a UTC timestamp in the form <code>YYYY-MM-DDTHH:MM:SSZ</code>. The final <code>Z</code> means UTC.
              The offset you need is the one on the day the text goes out, not the one today.
            </p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Local send times converted to UTC">
              <table>
                <thead>
                  <tr>
                    <th scope="col">You want</th>
                    <th scope="col">Offset that day</th>
                    <th scope="col">SendAt</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Nov 9, 2026, 9:00 AM Los Angeles</td>
                    <td>UTC-8 (PST)</td>
                    <td><code>2026-11-09T17:00:00Z</code></td>
                  </tr>
                  <tr>
                    <td>Nov 9, 2026, 9:00 AM New York</td>
                    <td>UTC-5 (EST)</td>
                    <td><code>2026-11-09T14:00:00Z</code></td>
                  </tr>
                  <tr>
                    <td>Nov 9, 2026, 9:00 AM London</td>
                    <td>UTC+0 (GMT)</td>
                    <td><code>2026-11-09T09:00:00Z</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Callout type="warning" title="The daylight saving trap">
              <p>
                Clocks in the US go back on November 1, 2026. If you schedule on October 30 for 9:00 AM Pacific on November 2 and use October&apos;s UTC-7 offset, you get 16:00Z, and the text
                goes out at 8:00 AM. Use the offset for the send date, ideally with a date library rather than by hand.
              </p>
            </Callout>
            <p>
              Think about the recipient&apos;s time too. A 9:00 AM New York text reaches Los Angeles at 6:00 AM. If you have a list across time zones, create separate messages for each zone.
            </p>
            <p>
              If you&apos;re generating timestamps in code, leave some margin. A send time set exactly 15 minutes ahead can drop out of the window while the request is on its way.
            </p>

            <h2 id="cancel">How do you cancel a scheduled text?</h2>
            <p>
              Update the message with the SID you saved, and set its status to <code>canceled</code>. Do it before the send time.
            </p>
            <CodeBlock title="Cancel a scheduled text" code={cancelRequest} />
            <p>
              The response should show <code>canceled</code>. To change the wording or time, cancel the message, create a new one, and keep the new SID. If you lost the SID, you can list
              messages in the Console logs or with the API, then look for the ones in <code>scheduled</code> status.
            </p>

            <h2 id="errors">Scheduling errors and how to fix them</h2>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scheduling errors and fixes">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Error</th>
                    <th scope="col">What it means</th>
                    <th scope="col">Fix</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <a href="https://www.twilio.com/docs/api/errors/35111" rel="noopener">35111</a>
                    </td>
                    <td>You set <code>ScheduleType</code> but no <code>SendAt</code></td>
                    <td>Send both</td>
                  </tr>
                  <tr>
                    <td>
                      <a href="https://www.twilio.com/docs/api/errors/35114" rel="noopener">35114</a>
                    </td>
                    <td><code>SendAt</code> is outside the window or badly formatted</td>
                    <td>Use a UTC timestamp 15 minutes to 35 days away</td>
                  </tr>
                  <tr>
                    <td>
                      <a href="https://www.twilio.com/docs/api/errors/35118" rel="noopener">35118</a>
                    </td>
                    <td>No valid <code>MessagingServiceSid</code></td>
                    <td>Add one that starts with <code>MG</code>. <code>From</code> alone won&apos;t do</td>
                  </tr>
                  <tr>
                    <td><Link href="/twilio-errors/21703">21703</Link></td>
                    <td>The service has no sender that can reach this recipient</td>
                    <td>Add a suitable, registered number to the sender pool</td>
                  </tr>
                  <tr>
                    <td><Link href="/twilio-errors/21610">21610</Link></td>
                    <td>The recipient has opted out</td>
                    <td>Cancel the rest of their queue and <Link href="/guides/fix-twilio-error-21610">follow the 21610 fix</Link></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Callout type="warning" title="Sent immediately by accident?">
              <p>
                Twilio&apos;s docs warn that without <code>MessagingServiceSid</code>, a message can be treated as non-scheduled and sent right away. Test with your own phone first.
              </p>
            </Callout>

            <h2 id="limits">What doesn&apos;t Twilio scheduling do?</h2>
            <ul>
              <li>
                <strong>Recurring sends.</strong> The only schedule type is <code>fixed</code>, a single time. For a weekly text, create each one separately or run your own job.
              </li>
              <li>
                <strong>Promise delivery.</strong> A scheduled text can be accepted now and{" "}
                <a href={SCHEDULING} rel="noopener">
                  still fail at the send time
                </a>
                , such as when the recipient has opted out.
              </li>
              <li>
                <strong>Long-range planning.</strong> For anything further than 35 days away, store it yourself and create the scheduled message once it&apos;s inside the window.
              </li>
            </ul>

            <h2 id="no-code">Can you schedule a text without code?</h2>
            <p>
              Scheduling is an API feature, so you need something to make the request. curl works, as above, and so does any tool that can post to a URL. On an iPhone, you can do the same with
              a Shortcut or an app, as covered in <Link href="/guides/how-to-send-sms-from-iphone-with-twilio">sending SMS from an iPhone with Twilio</Link>. Whichever you use, the rules are the
              same: a Messaging Service, and a time 15 minutes to 35 days away.
            </p>

            <h2 id="faq">Questions</h2>
            <Faq items={faq} />
          </Prose>
        </div>
      </Container>
      <RelatedLinks path={path} />
      <CtaBand
        title="Schedule texts without curl"
        text="Dialbubble is a free iPhone app that schedules texts through your own Twilio account. It still needs a Messaging Service, because Twilio does. See how it looks in Demo Mode, with no account needed."
      />
    </>
  );
}

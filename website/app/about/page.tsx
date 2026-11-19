import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { PageHero } from "@/components/PageHero";
import { Prose } from "@/components/Prose";
import { RelatedLinks } from "@/components/RelatedLinks";
import { site } from "@/content/site";
import { metaFor } from "@/lib/registry";

export const metadata = metaFor("/about");

export default function AboutPage() {
  return (
    <>
      <Breadcrumbs path="/about" />
      <PageHero
        title="A phone for your Twilio account"
        lede="Dialbubble is an independent iPhone app. It exists so you can use the Twilio account you already pay for without a laptop, a backend or another monthly bill."
      />
      <Container className="mt-4">
        <Prose>
          <h2>Why it exists</h2>
          <p>
            Twilio is a great way to get a phone number and pay only for what you use. It&apos;s built for developers, though, so doing something simple like answering a text from your phone usually means opening the Console or paying for a service that resells the same thing with a subscription on top.
          </p>
          <p>Dialbubble takes the shorter route. It&apos;s a native iPhone app that connects directly to your Twilio account and gets out of the way.</p>

          <h2>How we think about it</h2>
          <ul>
            <li>
              <strong>Your account stays yours.</strong> Your numbers, messages and bill live at Twilio. If you stop using Dialbubble, you lose nothing.
            </li>
            <li>
              <strong>No server means nothing to collect.</strong> We don&apos;t run a backend or analytics, so your data doesn&apos;t pass through us.
            </li>
            <li>
              <strong>Say the limits out loud.</strong> Talk calls bill two legs, texts don&apos;t arrive by push, and there&apos;s no Android version. It&apos;s better to know this before you install. The <Link href="/how-it-works#limits">full list of limits</Link> is on the how-it-works page.
            </li>
            <li>
              <strong>Explain things in plain English.</strong> Twilio&apos;s errors and rules can be hard to follow, so the app translates them and tells you what to do next.
            </li>
          </ul>

          <h2>What we&apos;re not</h2>
          <p>{site.disclaimer} You need your own Twilio account for real calls and texts, and Twilio&apos;s terms and prices apply to it.</p>

          <h2>Get in touch</h2>
          <p>
            Dialbubble is open source. Questions, bugs and ideas are all welcome on <a href={site.issues} rel="noopener">GitHub</a>, and so are pull requests.
          </p>
        </Prose>
      </Container>
      <RelatedLinks path="/about" />
      <CtaBand />
    </>
  );
}

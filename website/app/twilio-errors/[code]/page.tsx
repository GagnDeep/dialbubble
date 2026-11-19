import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
import { articleLd, howToLd, JsonLd } from "@/lib/seo";
import { AREA_LABELS, errorPath, errorTitle, getTwilioError, stripMarkup, twilioErrors, type TwilioError } from "../_data";
import { Rich } from "../_Rich";

export const dynamicParams = false;

export function generateStaticParams() {
  return twilioErrors.map((error) => ({ code: error.code }));
}

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return metaFor(errorPath(code), { type: "article" });
}

function ctaFor(error: TwilioError) {
  if (error.area === "webhooks") {
    return {
      title: "Run calls without hosting a webhook",
      text: "Dialbubble calls and texts straight from your iPhone through your own Twilio account, with no server to keep online. Try it first in Demo Mode, with no account needed.",
    };
  }
  if (error.code === "31005" || error.code === "32011") {
    return {
      title: "Calling without SDKs or SIP servers",
      text: "Dialbubble rings your regular phone through your own Twilio account, so there's no SDK or SIP system to maintain. It has no in-app VoIP. Try it in Demo Mode.",
    };
  }
  return {
    title: `See errors like ${error.code} in plain English`,
    text: "Dialbubble is a free iPhone app for your own Twilio account. It explains Twilio errors as they happen and suggests what to do next. Try it in Demo Mode, with no account needed.",
  };
}

export default async function TwilioErrorPage({ params }: Props) {
  const { code } = await params;
  const error = getTwilioError(code);
  if (!error) notFound();
  const path = errorPath(error.code);
  const entry = getEntry(path)!;
  const noun = error.severity === "Warning" ? "warning" : "error";
  const official = `https://www.twilio.com/docs/api/errors/${error.code}`;
  const cta = ctaFor(error);
  return (
    <>
      <JsonLd data={articleLd({ title: entry.title, description: entry.description, path, published: entry.published! })} />
      <JsonLd
        data={howToLd({
          name: `How to fix Twilio ${noun} ${error.code}`,
          description: stripMarkup(error.answer),
          path,
          steps: error.fix.map((step, index) => ({ name: `Step ${index + 1}`, text: stripMarkup(step) })),
        })}
      />
      <Breadcrumbs path={path} />
      <PageHero
        eyebrow={`${error.severity} in ${AREA_LABELS[error.area].toLowerCase()}`}
        title={errorTitle(error)}
        lede={<Rich text={error.answer} />}
      />
      <Container>
        <div className="toc-layout">
          <TocSidebar
            items={[
              { id: "meaning", title: `What ${error.code} means` },
              { id: "causes", title: "Most likely causes" },
              { id: "fix", title: "How to fix it" },
              { id: "prevent", title: "How to prevent it" },
              { id: "billing", title: "Are you billed?" },
              { id: "related-codes", title: "Related error codes" },
              { id: "questions", title: "Questions" },
            ]}
          />
          <Prose>
            <h2 id="meaning">What does Twilio {noun} {error.code} mean?</h2>
            <p>
              Twilio&apos;s name for it is <strong>{error.name}</strong>.
            </p>
            {error.plain.map((paragraph) => (
              <p key={paragraph}>
                <Rich text={paragraph} />
              </p>
            ))}
            {error.inApp ? <p>{error.inApp}</p> : null}

            <h2 id="causes">Most likely causes, in the order to check them</h2>
            <ol>
              {error.causes.map((cause) => (
                <li key={cause}>
                  <Rich text={cause} />
                </li>
              ))}
            </ol>

            <h2 id="fix">How to fix Twilio {noun} {error.code}</h2>
            <ol>
              {error.fix.map((step) => (
                <li key={step}>
                  <Rich text={step} />
                </li>
              ))}
            </ol>

            <h2 id="prevent">How to prevent it</h2>
            <ul>
              {error.prevent.map((item) => (
                <li key={item}>
                  <Rich text={item} />
                </li>
              ))}
            </ul>

            <h2 id="billing">Are you billed for {noun} {error.code}?</h2>
            <Callout type="cost" title="Billing">
              <p>
                <Rich text={error.billing} />
              </p>
            </Callout>

            <h2 id="related-codes">Related error codes</h2>
            <ul>
              {error.related.map((relatedCode) => {
                const related = getTwilioError(relatedCode)!;
                return (
                  <li key={relatedCode}>
                    <Link href={errorPath(relatedCode)}>
                      {relatedCode}: {related.short}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p>
              Read <a href={official} rel="noopener">Twilio&apos;s official page for {error.code}</a>, or go back to <Link href="/twilio-errors">all Twilio error codes</Link>. Dialbubble isn&apos;t affiliated with Twilio, and this page was checked against Twilio&apos;s dictionary in November 2026.
            </p>
          </Prose>
        </div>
      </Container>

      <Container as="section" className="mt-14">
        <h2 id="questions" className="display-2 mb-6 scroll-mt-24 text-[1.75rem] sm:text-[2rem]">
          Questions about {error.code}
        </h2>
        <Faq items={error.faq} />
      </Container>

      <RelatedLinks path={path} />
      <CtaBand title={cta.title} text={cta.text} />
    </>
  );
}

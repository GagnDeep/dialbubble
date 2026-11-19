import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { Faq, type FaqItem } from "@/components/Faq";
import { PageHero } from "@/components/PageHero";
import { Prose } from "@/components/Prose";
import { RelatedLinks } from "@/components/RelatedLinks";

/**
 * Page wrapper for an interactive tool. The shell is a server component so that the page
 * stays static: pass your "use client" widget as children and SEO text through `seo`.
 */
export function ToolShell({
  path,
  title,
  intro,
  seo,
  faq,
  children,
}: {
  /** The tool's registry path. Drives breadcrumbs and related links. */
  path: string;
  title: string;
  intro: ReactNode;
  /** Explanatory text below the tool. Rendered in Prose, so start at h2. */
  seo?: ReactNode;
  faq?: FaqItem[];
  children: ReactNode;
}) {
  return (
    <>
      <Breadcrumbs path={path} />
      <PageHero title={title} lede={intro} />
      <Container as="section" aria-label={title}>
        <div className="rounded-lg border border-line bg-surface p-4 sm:p-8">{children}</div>
      </Container>
      {seo ? (
        <Container className="mt-14">
          <Prose>{seo}</Prose>
        </Container>
      ) : null}
      {faq ? (
        <Container as="section" className="mt-14">
          <h2 className="display-2 mb-6 text-[1.75rem] sm:text-[2rem]">Questions</h2>
          <Faq items={faq} />
        </Container>
      ) : null}
      <RelatedLinks path={path} />
      <CtaBand />
    </>
  );
}

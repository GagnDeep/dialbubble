import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { LinkCard } from "@/components/LinkCard";
import { PageHero } from "@/components/PageHero";
import { sectionHubs, sectionPages, getEntry, type Section } from "@/lib/registry";

/** Index page for a section. Fills itself from the registry, so section authors never edit it. */
export function SectionHub({ section, lede, empty }: { section: Section; lede: ReactNode; empty: string }) {
  const hubPath = sectionHubs[section]!;
  const entry = getEntry(hubPath)!;
  const pages = sectionPages(section).filter((page) => !page.noindex);
  return (
    <>
      <Breadcrumbs path={hubPath} />
      <PageHero title={entry.title} lede={lede} />
      <Container as="section">
        {pages.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => (
              <LinkCard key={page.path} href={page.path} title={page.label ?? page.title} description={page.description} />
            ))}
          </div>
        ) : (
          <p className="max-w-[42rem] rounded-md bg-sunken p-5">{empty}</p>
        )}
      </Container>
      <CtaBand />
    </>
  );
}

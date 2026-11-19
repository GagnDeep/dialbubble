import Link from "next/link";
import { site } from "@/content/site";
import { Container } from "@/components/Container";
import { Logo } from "@/components/Logo";
import { getEntry, sectionHubs, sectionPages } from "@/lib/registry";

export function Footer() {
  const columns = site.footer
    .map((column) => {
      const hubPath = sectionHubs[column.section];
      const hub = hubPath ? getEntry(hubPath) : undefined;
      const pages = sectionPages(column.section).filter((page) => !page.noindex);
      // A section with nothing but its hub has nothing to list yet.
      if (pages.length === 0 && column.section !== "tools" && column.section !== "guides") return null;
      return { ...column, links: [...pages.slice(0, column.limit), ...(hub ? [hub] : [])] };
    })
    .filter((column) => column !== null);

  return (
    <footer className="mt-28 border-t border-line pb-24 pt-14 lg:pb-14">
      <Container>
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
          <div>
            <Logo />
            <p className="mt-3 max-w-[24ch] text-ink-soft">{site.tagline}.</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-1 gap-x-8 gap-y-10 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {columns.map((column) => (
              <div key={column.title}>
                <h2 className="display-3 text-base">{column.title}</h2>
                <ul className="mt-2">
                  {column.links.map((page) => (
                    <li key={page.path}>
                      <Link href={page.path} className="inline-flex min-h-10 items-center text-ink-soft no-underline hover:text-ink hover:underline">
                        {page.label ?? page.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-12 border-t border-line pt-6 text-[0.9375rem] text-ink-soft">
          <p className="max-w-[70ch]">{site.disclaimer}</p>
          <p className="mt-2">
            Open source under the MIT License.{" "}
            <a className="link" href={site.repo} rel="noopener">
              View the code on GitHub
            </a>{" "}
            or{" "}
            <a className="link" href={site.issues} rel="noopener">
              ask a question
            </a>
            . © 2026 {site.developer}.
          </p>
        </div>
      </Container>
    </footer>
  );
}

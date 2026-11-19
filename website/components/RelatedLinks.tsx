import { Container } from "@/components/Container";
import { LinkCard } from "@/components/LinkCard";
import { relatedFor } from "@/lib/registry";

/** 3 to 6 internal links: the page's `related` list, then its section, then core pages. */
export function RelatedLinks({ path, title = "Keep reading", max = 6 }: { path: string; title?: string; max?: number }) {
  const pages = relatedFor(path, max);
  if (pages.length === 0) return null;
  return (
    <Container as="section" className="mt-20">
      <h2 className="display-2 text-[1.75rem] sm:text-[2rem]">{title}</h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map((page) => (
          <LinkCard key={page.path} href={page.path} title={page.label ?? page.title} description={page.description} />
        ))}
      </div>
    </Container>
  );
}

import Link from "next/link";
import { LinkCard } from "@/components/LinkCard";
import { sectionHubs, sectionPages, type Section } from "@/lib/registry";

/** Shows the newest pages in a section, and a plain description until there are some. */
export function SectionTeaser({
  section,
  title,
  text,
  linkLabel,
  limit = 3,
}: {
  section: Section;
  title: string;
  text: string;
  linkLabel: string;
  limit?: number;
}) {
  const pages = sectionPages(section)
    .filter((page) => !page.noindex)
    .slice(0, limit);
  return (
    <div>
      <h2 className="display-2 text-[1.75rem] sm:text-[2.25rem]">{title}</h2>
      <p className="mt-3 max-w-[34rem] text-ink-soft">{text}</p>
      {pages.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {pages.map((page) => (
            <LinkCard key={page.path} href={page.path} title={page.label ?? page.title} description={page.description} />
          ))}
        </div>
      ) : null}
      <p className="mt-5">
        <Link href={sectionHubs[section] ?? "/"} className="link">
          {linkLabel}
        </Link>
      </p>
    </div>
  );
}

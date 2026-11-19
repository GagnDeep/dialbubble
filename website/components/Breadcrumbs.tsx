import Link from "next/link";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { getEntry, sectionHubs } from "@/lib/registry";
import { breadcrumbLd } from "@/lib/seo";

type Crumb = { name: string; href?: string };

function crumbsFromPath(path: string): Crumb[] {
  const parts = path.split("/").filter(Boolean);
  return parts.map((_, index) => {
    const href = `/${parts.slice(0, index + 1).join("/")}`;
    const entry = getEntry(href);
    // Hub labels read "All guides" in the footer, so crumbs use the full title for those.
    const isHub = Object.values(sectionHubs).includes(href);
    const name = (isHub ? entry?.title : entry?.label ?? entry?.title) ?? parts[index]!.replace(/-/g, " ");
    return index === parts.length - 1 ? { name } : { name, href };
  });
}

/** Pass `path` to build from the registry, or `items` for full control. Home is added for you. */
export function Breadcrumbs({ path, items }: { path?: string; items?: Crumb[] }) {
  const crumbs: Crumb[] = [{ name: "Home", href: "/" }, ...(items ?? (path ? crumbsFromPath(path) : []))];
  return (
    <Container className="pt-6">
      <JsonLd data={breadcrumbLd(crumbs)} />
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2 text-[0.9375rem] text-ink-soft">
          {crumbs.map((crumb, index) => (
            <li key={crumb.name} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {crumb.href ? (
                <Link href={crumb.href} className="inline-flex min-h-8 items-center underline-offset-2 hover:text-ink hover:underline">
                  {crumb.name}
                </Link>
              ) : (
                <span aria-current="page">
                  {crumb.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </Container>
  );
}

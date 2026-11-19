/**
 * Table of contents. Place it first inside a `toc-layout` div, before the Prose.
 * On wide screens it sticks to the right. On small screens it collapses above the text.
 */
export function TocSidebar({ items, title = "On this page" }: { items: { id: string; title: string }[]; title?: string }) {
  const links = (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.id}>
          <a href={`#${item.id}`} className="block py-1 text-[0.9375rem] leading-snug text-ink-soft no-underline hover:text-ink hover:underline">
            {item.title}
          </a>
        </li>
      ))}
    </ul>
  );
  return (
    <nav aria-label={title} className="toc">
      <details className="rounded-md bg-sunken px-4 lg:hidden">
        <summary className="flex min-h-12 items-center justify-between font-semibold">
          {title}
          <svg viewBox="0 0 24 24" className="chevron size-5 text-ink-soft" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <div className="pb-3">{links}</div>
      </details>
      <div className="hidden lg:block">
        <p className="mb-2 font-display font-semibold">{title}</p>
        {links}
      </div>
    </nav>
  );
}

import Link from "next/link";

export function LinkCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="group block rounded-md border border-line bg-surface p-5 no-underline transition-colors hover:border-mint-text">
      <span className="display-3 block group-hover:text-mint-text">{title}</span>
      <span className="mt-1.5 line-clamp-3 block text-[0.9375rem] leading-snug text-ink-soft">{description}</span>
    </Link>
  );
}

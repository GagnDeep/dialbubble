import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { faqLd } from "@/lib/seo";

export type FaqItem = { q: string; a: string } | { q: string; a: ReactNode; text: string };

function answerText(item: FaqItem): string {
  return "text" in item ? item.text : (item.a as string);
}

export function Faq({
  items,
  jsonLd = true,
  className = "",
}: {
  /** Use `a` as a string, or `a` as JSX plus `text` with the same answer in plain words for search engines. */
  items: FaqItem[];
  /** Turn off for a second Faq on one page. A page should carry only one FAQ schema. */
  jsonLd?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      {jsonLd ? <JsonLd data={faqLd(items.map((item) => ({ q: item.q, text: answerText(item) })))} /> : null}
      <div className="border-t border-line">
        {items.map((item) => (
          <details key={item.q} className="border-b border-line">
            <summary className="flex min-h-14 items-center justify-between gap-4 py-4 font-display text-lg font-semibold leading-snug">
              {item.q}
              <svg viewBox="0 0 24 24" className="chevron size-5 text-ink-soft" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <div className="max-w-[42rem] pb-5 text-ink-soft [&_a]:font-semibold [&_a]:text-mint-text [&_a]:underline">{item.a}</div>
          </details>
        ))}
      </div>
    </div>
  );
}

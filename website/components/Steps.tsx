import type { ReactNode } from "react";

/** A numbered sequence with keypad-key markers. Use only for steps that really happen in order. */
export function Steps({ items, className = "" }: { items: { title: string; text: ReactNode }[]; className?: string }) {
  return (
    <ol className={`space-y-6 ${className}`}>
      {items.map((item, index) => (
        <li key={item.title} className="flex gap-4">
          <span aria-hidden="true" className="key size-11 flex-none text-lg">
            {index + 1}
          </span>
          <div className="min-w-0 pt-1.5">
            <h3 className="display-3">{item.title}</h3>
            <div className="mt-1 text-ink-soft">{item.text}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

import type { ReactNode } from "react";

const STYLES = {
  info: { box: "bg-sunken", icon: "text-ink-soft", label: "Note", path: "M12 11v5m0-8.5v.5" },
  tip: { box: "bg-mint-tint", icon: "text-mint-text", label: "Tip", path: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" },
  warning: { box: "bg-warn-tint", icon: "text-warn", label: "Watch out", path: "M12 9v4.5m0 3v.5M10.3 4 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0Z" },
  cost: { box: "bg-mint-tint", icon: "text-mint-text", label: "Cost", path: "M12 3v18m4-14.5c-.8-1-2.2-1.5-4-1.5-2.5 0-4.5 1.2-4.5 3.2 0 4.6 9 2.4 9 7 0 2-2 3.3-4.5 3.3-1.9 0-3.5-.6-4.4-1.8" },
} as const;

export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: keyof typeof STYLES;
  /** Defaults to a one-word label for the type. */
  title?: string;
  children: ReactNode;
}) {
  const style = STYLES[type];
  return (
    <aside className={`flex gap-3 rounded-md p-4 sm:p-5 ${style.box}`}>
      <svg viewBox="0 0 24 24" className={`mt-0.5 size-6 flex-none ${style.icon}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={style.path} />
      </svg>
      <div className="min-w-0">
        <p className="font-bold">{title ?? style.label}</p>
        <div className="mt-1 [&>*+*]:mt-2">{children}</div>
      </div>
    </aside>
  );
}

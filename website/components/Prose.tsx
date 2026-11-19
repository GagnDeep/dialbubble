import type { ReactNode } from "react";

/** Typographic styling for long-form HTML. Headings inside should start at h2. */
export function Prose({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`prose ${className}`}>{children}</div>;
}

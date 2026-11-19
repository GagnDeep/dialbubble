"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * A native details element, so the menu still opens without JavaScript.
 * This wrapper adds closing on navigation, on Escape and on an outside tap.
 */
export function MobileMenu({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && ref.current?.open) {
        ref.current.open = false;
        ref.current.querySelector("summary")?.focus();
      }
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!ref.current?.open || !target) return;
      if (!ref.current.contains(target) || target.closest("a")) ref.current.open = false;
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <details ref={ref} className="group lg:hidden">
      <summary className="grid size-11 place-items-center rounded-full" aria-label="Menu">
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path className="group-open:hidden" d="M4 8h16M4 16h16" />
          <path className="hidden group-open:block" d="M6 6l12 12M18 6L6 18" />
        </svg>
      </summary>
      <div className="absolute inset-x-0 top-full border-b border-line bg-canvas px-4 pb-6 pt-2 shadow-lg sm:px-6">{children}</div>
    </details>
  );
}

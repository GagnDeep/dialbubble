import type { ElementType, ReactNode } from "react";

export function Container({
  "aria-label": ariaLabel,
  as: Tag = "div",
  width = "wide",
  className = "",
  children,
}: {
  "aria-label"?: string;
  as?: ElementType;
  /** wide: 76rem for marketing layouts. narrow: 48rem for long reading pages. */
  width?: "wide" | "narrow";
  className?: string;
  children: ReactNode;
}) {
  const max = width === "narrow" ? "max-w-3xl" : "max-w-[76rem]";
  return <Tag aria-label={ariaLabel} className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${max} ${className}`}>{children}</Tag>;
}

import type { ReactNode } from "react";
import { Container } from "@/components/Container";

export function PageHero({
  eyebrow,
  title,
  lede,
  cta,
  children,
}: {
  /** Sentence case, a few words. It is rendered as plain mint text, never all caps. */
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  cta?: ReactNode;
  /** Anything else that belongs in the hero, such as a date line. */
  children?: ReactNode;
}) {
  return (
    <Container as="section" className="pb-10 pt-10 sm:pt-16">
      {eyebrow ? <p className="mb-3 font-display text-lg font-semibold text-mint-text">{eyebrow}</p> : null}
      <h1 className="display-1 max-w-[18ch]">{title}</h1>
      {lede ? <p className="lede mt-5 text-ink-soft">{lede}</p> : null}
      {cta ? <div className="mt-7 flex flex-wrap items-center gap-3">{cta}</div> : null}
      {children}
    </Container>
  );
}

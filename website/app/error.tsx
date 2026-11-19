"use client";

import { Container } from "@/components/Container";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <Container as="section" className="pt-16">
      <h1 className="display-1 max-w-[16ch]">This page didn&apos;t load</h1>
      <p className="lede mt-4 text-ink-soft">Something went wrong on our side. Try loading it again.</p>
      <button type="button" onClick={reset} className="btn btn-mint mt-8 cursor-pointer">
        Try again
      </button>
    </Container>
  );
}

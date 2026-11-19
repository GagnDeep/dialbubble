import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <Container as="section" className="pt-12 sm:pt-20">
      <div className="bubble on-brand px-6 py-12 sm:px-12 sm:py-16">
        <p className="font-display text-lg font-semibold">Error 404</p>
        <h1 className="display-1 mt-2 max-w-[16ch]">This number isn&apos;t in service</h1>
        <p className="lede mt-4">The page you were looking for isn&apos;t here. It may have moved, or the link may be wrong.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn btn-white">
            Go to the home page
          </Link>
          <Link href="/support" className="btn btn-ghost-white">
            Get support
          </Link>
        </div>
      </div>
    </Container>
  );
}

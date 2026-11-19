import Link from "next/link";
import { Container } from "@/components/Container";
import { DownloadButton } from "@/components/DownloadButton";

/** The conversion band. Use it once, near the end of a page. Its headline and text can be overridden. */
export function CtaBand({
  title = "Your Twilio account, on your iPhone",
  text = "Dialbubble is free, with no account to create. Explore it in Demo Mode first, with no Twilio account needed.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <Container as="section" className="mt-20">
      <div className="bubble on-brand px-6 py-12 sm:px-12 sm:py-16">
        <h2 className="display-2 max-w-[20ch]">{title}</h2>
        <p className="lede mt-4">{text}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <DownloadButton tone="onBrand" />
          <Link href="/features" className="btn btn-ghost-white">
            See all features
          </Link>
        </div>
      </div>
    </Container>
  );
}

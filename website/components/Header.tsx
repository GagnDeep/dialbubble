import Link from "next/link";
import { site } from "@/content/site";
import { Container } from "@/components/Container";
import { DownloadButton } from "@/components/DownloadButton";
import { GithubGlyph } from "@/components/GithubButton";
import { Logo } from "@/components/Logo";
import { MobileMenu } from "@/components/MobileMenu";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-canvas/90 backdrop-blur-md">
      <Container className="relative flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {site.nav.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-full px-3 py-2 text-base font-medium text-ink no-underline hover:bg-sunken">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <a href={site.repo} rel="noopener" aria-label="Dialbubble on GitHub" className="inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-sunken">
            <GithubGlyph className="size-6" />
          </a>
          <DownloadButton size="sm" />
        </div>
        <MobileMenu>
          <nav aria-label="Mobile">
            <ul>
              {site.nav.map((item) => (
                <li key={item.href} className="border-b border-line last:border-0">
                  <Link href={item.href} className="flex min-h-13 items-center font-display text-xl font-semibold no-underline">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href={site.repo} rel="noopener" className="flex min-h-13 items-center gap-2 font-display text-xl font-semibold no-underline">
                  <GithubGlyph className="size-6" /> GitHub
                </a>
              </li>
            </ul>
          </nav>
        </MobileMenu>
      </Container>
    </header>
  );
}

/** Always within thumb reach on phones. The layout reserves room for it above the footer's end. */
export function StickyCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line/60 bg-canvas/90 px-4 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-md lg:hidden">
      <DownloadButton size="sm" className="w-full" />
    </div>
  );
}

import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header, StickyCta } from "@/components/Header";
import { site } from "@/content/site";
import { absoluteUrl } from "@/lib/seo";
import "./globals.css";

const parkinsans = localFont({
  src: "./fonts/parkinsans-latin-wght-normal.woff2",
  weight: "300 800",
  variable: "--font-parkinsans",
  display: "swap",
});

const body = localFont({
  src: "./fonts/atkinson-hyperlegible-next-latin-wght-normal.woff2",
  weight: "200 800",
  variable: "--font-body",
  display: "swap",
});

const code = localFont({
  src: "./fonts/atkinson-hyperlegible-mono-latin-wght-normal.woff2",
  weight: "200 800",
  variable: "--font-code",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}: ${site.tagline}`, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  alternates: { types: { "application/rss+xml": [{ url: absoluteUrl("/feed.xml"), title: `${site.name} guides` }] } },
  appleWebApp: { title: site.name },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F5F5" },
    { media: "(prefers-color-scheme: dark)", color: "#04100E" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${parkinsans.variable} ${body.variable} ${code.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only rounded-sm bg-surface px-4 py-3 font-semibold focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50"
        >
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <StickyCta />
      </body>
    </html>
  );
}

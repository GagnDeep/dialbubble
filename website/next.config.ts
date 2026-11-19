import type { NextConfig } from "next";

// The site is a fully static export, published to GitHub Pages by .github/workflows/pages.yml.
// It is served from https://gagndeep.github.io/dialbubble, so everything lives under the /dialbubble base path.
// For a custom domain later, build with NEXT_PUBLIC_BASE_PATH="" and NEXT_PUBLIC_SITE_URL="https://example.com".
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "/dialbubble").replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  // /privacy is written as privacy.html, which GitHub Pages serves at /privacy.
  trailingSlash: false,
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: { root: import.meta.dirname },
  // GitHub Pages has no image optimizer. Screens are pre-sized PNGs.
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;

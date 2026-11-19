import { BASE_PATH } from "@/lib/basePath";
import type { Section } from "@/lib/registry-types";

export const site = {
  name: "Dialbubble",
  /** Absolute site root, including the GitHub Pages base path. Override with NEXT_PUBLIC_SITE_URL for a custom domain. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? `https://gagndeep.github.io${BASE_PATH}`).replace(/\/$/, ""),
  tagline: "Call and text from your own Twilio numbers",
  description:
    "Dialbubble is a free iPhone app for calling and texting from your own Twilio account and numbers. No server, no Dialbubble account, no subscription and no markup. You pay Twilio its normal usage rates.",
  repo: "https://github.com/GagnDeep/dialbubble",
  issues: "https://github.com/GagnDeep/dialbubble/issues",
  newIssue: "https://github.com/GagnDeep/dialbubble/issues/new/choose",
  security: "https://github.com/GagnDeep/dialbubble/security/advisories/new",
  discussions: "https://github.com/GagnDeep/dialbubble/discussions",
  appStoreName: "Dialbubble: Twilio Calls & SMS",
  bundleId: "com.dialbubble.app",
  developer: "Gagandeep Singh",
  disclaimer: "Twilio is a trademark of Twilio Inc. Dialbubble is an independent app, not affiliated with or endorsed by Twilio.",
  nav: [
    { label: "Features", href: "/features" },
    { label: "How it works", href: "/how-it-works" },
    { label: "Pricing", href: "/pricing" },
    { label: "Security", href: "/security" },
    { label: "Guides", href: "/guides" },
    { label: "Tools", href: "/tools" },
    { label: "Support", href: "/support" },
  ],
  /** Each column lists its section from the registry. Empty columns hide themselves. */
  footer: [
    { title: "Dialbubble", section: "product", limit: 8 },
    { title: "Use cases", section: "solutions", limit: 6 },
    { title: "Tools", section: "tools", limit: 6 },
    { title: "Guides", section: "guides", limit: 6 },
    { title: "Compare", section: "compare", limit: 6 },
    { title: "Twilio errors", section: "errors", limit: 6 },
    { title: "Legal", section: "legal", limit: 4 },
  ] satisfies { title: string; section: Section; limit: number }[],
} as const;

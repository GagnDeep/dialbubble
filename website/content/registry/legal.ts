import type { RegistryEntry } from "@/lib/registry-types";

export const legalPages: RegistryEntry[] = [
  {
    path: "/privacy",
    title: "Privacy policy",
    description: "Dialbubble collects nothing on our servers and has no analytics. Read exactly how the app and this website handle your information.",
    section: "legal",
    keywords: ["dialbubble privacy policy"],
    published: "2026-11-04",
  },
  {
    path: "/terms",
    title: "Terms of use",
    description: "The terms for using the Dialbubble app and website, including your responsibility for your Twilio account, charges and compliance.",
    section: "legal",
    keywords: ["dialbubble terms of use"],
    published: "2026-11-04",
  },
];

import { site } from "@/content/site";
import { indexablePages, type Section } from "@/lib/registry";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-static";

const SECTION_TITLES: [Section, string][] = [
  ["product", "Product"],
  ["solutions", "Use cases"],
  ["tools", "Free tools"],
  ["guides", "Guides"],
  ["compare", "Comparisons"],
  ["errors", "Twilio error codes"],
  ["legal", "Legal"],
];

export function GET() {
  const pages = indexablePages();
  const sections = SECTION_TITLES.flatMap(([section, title]) => {
    const inSection = pages.filter((page) => page.section === section);
    if (inSection.length === 0) return [];
    return [`## ${title}`, "", ...inSection.map((page) => `- [${page.label ?? page.title}](${absoluteUrl(page.path)}): ${page.description}`), ""];
  });

  const body = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    "Key facts:",
    "",
    "- Free iPhone app. Requires iOS 26 or later. iPhone only, with no Android version.",
    "- Bundle ID com.dialbubble.app.",
    "- Connects directly to the user's own Twilio account. No server, no Dialbubble account, no subscription, no markup. Credentials stay in the iPhone Keychain.",
    "- Users pay Twilio's normal usage rates.",
    "- Talk calls ring the user's regular phone through a bridge. The user presses any key, then the other person is dialed and sees the Twilio number. There is no in-app VoIP, and a Talk call bills two Twilio legs.",
    "- No instant push notifications. The app checks every 20 seconds while open; optional alerts while closed use Background App Refresh, which iOS schedules.",
    "- Open source under the MIT License: https://github.com/GagnDeep/dialbubble",
    "- Requires a Twilio account for real use. Demo Mode works without one.",
    `- ${site.disclaimer}`,
    "",
    ...sections,
  ].join("\n");

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

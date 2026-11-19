import fs from "node:fs";
import path from "node:path";
import { withBase } from "@/lib/basePath";

export type Screen = "home" | "keypad" | "active-call" | "messages" | "conversation" | "recents" | "settings" | "onboarding" | "call-detail" | "voice-message";

const ALT: Record<Screen, string> = {
  home: "Dialbubble Home screen",
  keypad: "Dialbubble keypad screen",
  "active-call": "Dialbubble screen during a live call",
  messages: "Dialbubble Messages inbox",
  conversation: "A text conversation in Dialbubble",
  recents: "Dialbubble recent calls",
  settings: "Dialbubble Settings screen",
  onboarding: "Dialbubble guided setup",
  "call-detail": "Dialbubble call details",
  "voice-message": "Dialbubble voice message call composer",
};

const WIDTH = 1320;
const HEIGHT = 2868;

function screenSrc(screen: Screen, scheme: "dark" | "light"): string | null {
  const file = `/screens/${screen}-${scheme}.png`;
  return fs.existsSync(path.join(process.cwd(), "public", file)) ? file : null;
}

function Placeholder({ label }: { label: string }) {
  return (
    <div role="img" aria-label={label} className="flex h-full flex-col gap-[4cqw] bg-canvas p-[7cqw] pt-[22cqw]">
      <div className="h-[9cqw] w-3/5 rounded-full bg-sunken" />
      <div className="mt-[3cqw] h-[34cqw] rounded-[7cqw] bg-sunken" />
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="flex items-center gap-[4cqw]">
          <div className="size-[13cqw] flex-none rounded-full bg-sunken" />
          <div className="h-[5cqw] flex-1 rounded-full bg-sunken" />
        </div>
      ))}
    </div>
  );
}

/**
 * A phone drawn in CSS around a real app screenshot, picking the dark or light capture
 * to match the visitor's color scheme. Shows a neutral placeholder if the files are missing.
 * Size it with a width class. `sizes` should describe that width.
 */
export function PhoneFrame({
  screen,
  alt = ALT[screen],
  priority = false,
  sizes = "(max-width: 640px) 70vw, 320px",
  className = "",
}: {
  screen: Screen;
  alt?: string;
  /** Set on the first screenshot in view, usually only in a hero. */
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  const dark = screenSrc(screen, "dark");
  const light = screenSrc(screen, "light");
  const fallback = light ?? dark;

  let image = <Placeholder label={alt} />;
  if (fallback) {
    image = (
      <picture>
        {dark && dark !== fallback ? <source media="(prefers-color-scheme: dark)" srcSet={withBase(dark)} /> : null}
        <img
          src={withBase(fallback)}
          alt={alt}
          width={WIDTH}
          height={HEIGHT}
          sizes={sizes}
          decoding="async"
          className="block h-auto w-full"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
        />
      </picture>
    );
  }

  return (
    <div className={`@container relative ${className}`}>
      <div className="relative rounded-[15cqw] bg-[#16191b] p-[2.6cqw] shadow-[0_0_0_1px_rgb(255_255_255/0.14)_inset,0_30px_60px_-20px_rgb(0_20_20/0.5)]">
        <div className="overflow-hidden rounded-[12.6cqw] [aspect-ratio:1320/2868]">{image}</div>
      </div>
      {/* Side buttons */}
      <span aria-hidden="true" className="absolute -left-[0.7cqw] top-[20%] h-[6%] w-[0.9cqw] rounded-l-sm bg-[#2a2f32]" />
      <span aria-hidden="true" className="absolute -left-[0.7cqw] top-[29%] h-[6%] w-[0.9cqw] rounded-l-sm bg-[#2a2f32]" />
      <span aria-hidden="true" className="absolute -right-[0.7cqw] top-[25%] h-[10%] w-[0.9cqw] rounded-r-sm bg-[#2a2f32]" />
    </div>
  );
}

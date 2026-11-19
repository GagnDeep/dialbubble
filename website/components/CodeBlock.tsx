import { CopyButton } from "@/components/CopyButton";

/** Always dark, in both color schemes. Horizontal overflow scrolls inside the block, not the page. */
export function CodeBlock({ code, title, language }: { code: string; title?: string; language?: string }) {
  const trimmed = code.replace(/^\n+|\s+$/g, "");
  return (
    <figure className="overflow-hidden rounded-md bg-[#0e1416] text-[#eef3f3] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]">
      <figcaption className="flex min-h-11 items-center justify-between gap-3 border-b border-white/10 pl-4 pr-1 text-[0.9375rem] text-[#a5b3b7]">
        <span className="truncate">{title ?? language ?? "Code"}</span>
        <CopyButton text={trimmed} />
      </figcaption>
      <pre tabIndex={0} aria-label={title ?? "Code sample"} className="overflow-x-auto p-4 font-mono text-[0.875rem] leading-relaxed">
        <code>{trimmed}</code>
      </pre>
    </figure>
  );
}

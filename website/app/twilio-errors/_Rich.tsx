import Link from "next/link";
import { Fragment } from "react";

/** Renders the small markup used in _data.ts: [label](/path-or-url) and `code`. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|`[^`]+`)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, index) => {
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          const [, label, href] = link;
          return href!.startsWith("/") ? (
            <Link key={index} href={href!}>
              {label}
            </Link>
          ) : (
            <a key={index} href={href} rel="noopener">
              {label}
            </a>
          );
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return <code key={index}>{part.slice(1, -1)}</code>;
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}

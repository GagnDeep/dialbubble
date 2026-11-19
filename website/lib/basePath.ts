/**
 * The site is served from https://gagndeep.github.io/dialbubble, so every root-relative asset needs this prefix.
 * Next adds it to <Link> and router URLs itself; use withBase() for plain src/href strings to public files.
 * Set NEXT_PUBLIC_BASE_PATH="" when the site moves to its own domain.
 */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "/dialbubble").replace(/\/$/, "");

export function withBase(path: string): string {
  if (/^(https?:|data:|mailto:|#)/.test(path)) return path;
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}

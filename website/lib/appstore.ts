const LOOKUP_URL = "https://itunes.apple.com/lookup?bundleId=com.dialbubble.app";

/** Accepts only a real App Store link, so a bad response can never produce a bad button. */
export function parseAppStoreUrl(body: unknown): string | null {
  const results = (body as { results?: { trackViewUrl?: unknown }[] } | null)?.results;
  const url = Array.isArray(results) ? results[0]?.trackViewUrl : null;
  return typeof url === "string" && url.startsWith("https://apps.apple.com/") ? url.replace(/\?.*$/, "") : null;
}

let cached: Promise<string | null> | null = null;

/**
 * Returns the App Store URL once Apple lists the app, otherwise null. Never throws.
 * The site is a static export, so this runs once per build. The Pages workflow rebuilds daily,
 * which flips every "Coming soon" button to the real listing within a day of launch.
 */
export function getAppStoreUrl(): Promise<string | null> {
  cached ??= (async () => {
    try {
      const response = await fetch(LOOKUP_URL, { cache: "force-cache", signal: AbortSignal.timeout(8000) });
      if (!response.ok) return null;
      return parseAppStoreUrl(await response.json());
    } catch {
      return null;
    }
  })();
  return cached;
}

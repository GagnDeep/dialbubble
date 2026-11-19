import Link from "next/link";
import { getAppStoreUrl } from "@/lib/appstore";

function AppleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.37 12.74c-.02-2.13 1.74-3.15 1.82-3.2-1-1.45-2.54-1.65-3.08-1.67-1.31-.13-2.56.77-3.22.77-.67 0-1.69-.75-2.78-.73-1.43.02-2.75.83-3.48 2.11-1.49 2.58-.38 6.39 1.06 8.48.71 1.02 1.55 2.17 2.65 2.13 1.07-.04 1.47-.69 2.76-.69 1.28 0 1.65.69 2.78.67 1.15-.02 1.87-1.04 2.57-2.07.81-1.19 1.14-2.34 1.16-2.4-.03-.01-2.21-.85-2.24-3.4ZM14.26 6.5c.59-.71.98-1.7.87-2.69-.84.03-1.87.56-2.47 1.27-.54.63-1.02 1.63-.89 2.6.94.07 1.9-.48 2.49-1.18Z" />
    </svg>
  );
}

type Props = {
  size?: "lg" | "sm";
  /** Use "onBrand" on top of a bubble or other mint and blue background. */
  tone?: "default" | "onBrand";
  className?: string;
};

/**
 * Server component. Links to the App Store once Apple lists the app, and until then says
 * "Coming soon" and links to /how-it-works. The site is rebuilt daily, so it flips within a day of launch.
 * It can't be imported from a client component, so pass it in as children.
 */
export async function DownloadButton({ size = "lg", tone = "default", className = "" }: Props) {
  const url = await getAppStoreUrl();
  const small = size === "sm";

  if (url) {
    return (
      <a href={url} className={`btn btn-appstore ${small ? "btn-sm" : ""} ${className}`}>
        <AppleGlyph className={small ? "size-5" : "size-8"} />
        {small ? (
          <span>Download on the App Store</span>
        ) : (
          <span className="flex flex-col">
            <span className="text-[0.8125rem] font-medium leading-tight">Download on the</span>
            <span className="font-display text-[1.375rem] font-semibold leading-tight">App Store</span>
          </span>
        )}
      </a>
    );
  }

  const style = tone === "onBrand" ? "btn-glow" : "btn-mint";
  return (
    <Link href="/how-it-works" className={`btn ${style} ${small ? "btn-sm" : ""} ${className}`}>
      <AppleGlyph className={small ? "size-5" : "size-6"} />
      Coming soon to the App Store
    </Link>
  );
}

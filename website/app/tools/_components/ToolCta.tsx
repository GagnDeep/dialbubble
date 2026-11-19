import Link from "next/link";
import { DownloadButton } from "@/components/DownloadButton";

/** The call to action tied to what the tool just did. Server component, so it renders beside the client widget. */
export function ToolCta({ title, text, linkHref, linkText }: { title: string; text: string; linkHref: string; linkText: string }) {
  return (
    <div className="mt-8 flex flex-col gap-4 rounded-md bg-mint-tint p-5 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 max-w-[42rem]">
        <h2 className="display-3">{title}</h2>
        <p className="mt-1">{text}</p>
        <p className="mt-2">
          <Link href={linkHref} className="link">
            {linkText}
          </Link>
        </p>
      </div>
      <DownloadButton size="sm" className="flex-none" />
    </div>
  );
}

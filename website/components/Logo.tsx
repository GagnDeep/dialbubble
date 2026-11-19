import { withBase } from "@/lib/basePath";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="inline-flex min-h-11 items-center gap-2.5 rounded-sm font-display text-xl font-bold tracking-tight no-underline">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={withBase("/app-icon.png")} alt="" width={34} height={34} className="size-[34px] rounded-[9px]" />
      Dialbubble
    </Link>
  );
}

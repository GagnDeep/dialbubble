"use client";

import { Fragment, type ReactNode } from "react";
import { isGsmBasic, isGsmExtension, type Offender } from "../_lib/sms";

const INVISIBLE = /^[\s­​-‍⁠️﻿]$/u;

/** The glyph for a chip, with a stand-in for spaces and characters nobody can see. */
export function chipGlyph(char: string): string {
  return INVISIBLE.test(char) ? "␣" : char;
}

/** Text with GSM-7 characters left plain, extension characters underlined and everything else marked. */
export function MarkedChars({ chars }: { chars: readonly string[] }) {
  const parts: ReactNode[] = [];
  let run = "";
  const flush = () => {
    if (run) parts.push(run);
    run = "";
  };
  chars.forEach((char, index) => {
    if (char === "\n") {
      flush();
      parts.push(
        <Fragment key={index}>
          <span aria-hidden="true" className="text-ink-soft">
            {"↵"}
          </span>
          {"\n"}
        </Fragment>,
      );
    } else if (isGsmBasic(char)) {
      run += char;
    } else if (isGsmExtension(char)) {
      flush();
      parts.push(
        <span key={index} title="Counts as two characters in GSM-7" className="rounded-[3px] underline decoration-mint-text decoration-2 underline-offset-2">
          {char}
        </span>,
      );
    } else {
      flush();
      parts.push(
        <mark key={index} title="Not in GSM-7" className="rounded-[3px] bg-warn-tint px-px font-bold text-warn shadow-[inset_0_0_0_1px_var(--warn)]">
          {INVISIBLE.test(char) ? "␣" : char}
        </mark>,
      );
    }
  });
  flush();
  return <>{parts}</>;
}

export function OffenderList({ offenders, limit = 40 }: { offenders: readonly Offender[]; limit?: number }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-sm border border-line">
      {offenders.slice(0, limit).map((o) => (
        <li key={o.char} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
          <span className="grid size-9 flex-none place-items-center rounded-[8px] bg-warn-tint text-lg font-bold text-warn">{chipGlyph(o.char)}</span>
          <span className="min-w-0 flex-1 basis-40 leading-snug">
            <span className="font-semibold">{o.name}</span>
            <span className="block text-[0.875rem] text-ink-soft">
              {o.codePoint}, used {o.count === 1 ? "once" : `${o.count} times`}
            </span>
          </span>
          <span className="text-[0.9375rem] text-ink-soft">
            {o.replacement !== null ? (
              <>
                Replace with <code className="rounded-[6px] bg-sunken px-1.5 py-0.5 font-mono text-ink">{o.replacement === "" ? "nothing" : o.replacement === " " ? "a space" : o.replacement}</code>
              </>
            ) : o.isEmoji ? (
              "No GSM-7 version. Remove it if you can."
            ) : (
              "No direct GSM-7 version"
            )}
          </span>
        </li>
      ))}
      {offenders.length > limit ? <li className="px-3 py-2 text-ink-soft">And {offenders.length - limit} more different characters.</li> : null}
    </ul>
  );
}

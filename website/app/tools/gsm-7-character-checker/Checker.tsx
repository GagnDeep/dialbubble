"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { MarkedChars, OffenderList } from "../_components/sms-ui";
import { CopyButton, Field, Notice, SmallButton, textareaClass } from "../_components/ui";
import { GSM_BASIC, GSM_EXTENSION, analyzeSms, displayChar, findOffenders, replaceSmartPunctuation } from "../_lib/sms";

const SAMPLE = "We’re open today – see you at 10…";
const HEX = "0123456789ABCDEF";

export function Checker() {
  const [text, setText] = useState(SAMPLE);
  const deferred = useDeferredValue(text);
  const used = useMemo(() => new Set(Array.from(deferred)), [deferred]);
  const offenders = useMemo(() => findOffenders(deferred), [deferred]);
  const chars = useMemo(() => Array.from(deferred), [deferred]);
  const fixed = replaceSmartPunctuation(text);
  const canFix = fixed !== text;
  const before = useMemo(() => analyzeSms(deferred).segmentCount, [deferred]);
  const after = useMemo(() => analyzeSms(fixed).segmentCount, [fixed]);
  const extension = GSM_EXTENSION.filter((e) => used.has(e.char));

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Field label="Paste your text">
          <textarea rows={4} value={text} onChange={(event) => setText(event.target.value)} spellCheck={false} placeholder="Paste a message to check it" className={textareaClass} />
        </Field>

        <div aria-live="polite">
          {chars.length === 0 ? (
            <Notice>Paste a message to see which characters are outside GSM-7.</Notice>
          ) : offenders.length === 0 ? (
            <Notice tone="ok">
              <strong>All GSM-7.</strong> This message fits {before === 1 ? "one segment" : `${before} segments`} and every character is in the table below.
            </Notice>
          ) : (
            <Notice tone="warn">
              <strong>Not GSM-7.</strong> {offenders.length === 1 ? "One character" : `${offenders.length} different characters`} will send the whole message as UCS-2.
            </Notice>
          )}
        </div>

        {chars.length > 0 ? (
          <p className="whitespace-pre-wrap break-words rounded-sm bg-sunken p-3 leading-relaxed">
            <MarkedChars chars={chars} />
          </p>
        ) : null}

        {offenders.length > 0 ? <OffenderList offenders={offenders} /> : null}

        <div className="flex flex-wrap gap-2">
          <SmallButton onClick={() => setText(fixed)} disabled={!canFix} active={canFix}>
            Replace smart punctuation
          </SmallButton>
          <CopyButton label="Copy text" getText={() => text} disabled={text === ""} />
          <SmallButton onClick={() => setText("")} disabled={text === ""}>
            Clear
          </SmallButton>
        </div>
        {canFix ? (
          <p className="text-[0.9375rem] text-ink-soft">
            That takes this message from {before} to {after} {after === 1 ? "segment" : "segments"}.
          </p>
        ) : null}
      </div>

      <section aria-labelledby="gsm-basic-title">
        <h2 id="gsm-basic-title" className="display-3">
          The GSM 03.38 default alphabet
        </h2>
        <p className="mt-1 text-[0.9375rem] text-ink-soft">Each costs one character. Read a code from the column, then the row: A is 0x41. Characters from your text are highlighted.</p>
        <div className="mt-3 overflow-x-auto" tabIndex={0} role="region" aria-label="GSM 03.38 default alphabet table">
          <table className="w-full min-w-[15.5rem] table-fixed border-collapse text-center">
            <caption className="sr-only">128 characters of the GSM-7 default alphabet, by hexadecimal position</caption>
            <thead>
              <tr>
                <td className="w-7" />
                {Array.from({ length: 8 }, (_, column) => (
                  <th key={column} scope="col" className="pb-1 text-[0.8125rem] font-semibold text-ink-soft">
                    {column}x
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 16 }, (_, row) => (
                <tr key={row}>
                  <th scope="row" className="pr-1 text-[0.8125rem] font-semibold text-ink-soft">
                    x{HEX[row]}
                  </th>
                  {Array.from({ length: 8 }, (_, column) => {
                    const char = GSM_BASIC[column * 16 + row] ?? "";
                    const label = displayChar(char);
                    const isWord = label.length > 1;
                    return (
                      <td
                        key={column}
                        title={`0x${column}${HEX[row]}`}
                        className={`h-9 border border-line ${used.has(char) ? "bg-mint-tint font-bold" : ""} ${isWord ? "text-[0.6875rem] text-ink-soft" : ""}`}
                      >
                        {label}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="gsm-ext-title">
        <h2 id="gsm-ext-title" className="display-3">
          The extension table
        </h2>
        <p className="mt-1 text-[0.9375rem] text-ink-soft">
          Each costs two characters: the ESC code at 0x1B, then the code here.
          {extension.length > 0 ? ` Your text uses ${extension.length === 1 ? "one" : extension.length} of them.` : ""}
        </p>
        <ul className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
          {GSM_EXTENSION.map((entry) => (
            <li key={entry.code} className={`rounded-sm border border-line p-1.5 text-center ${used.has(entry.char) ? "bg-mint-tint font-bold" : ""}`}>
              <span className="block text-lg leading-tight">{displayChar(entry.char)}</span>
              <span className="block text-[0.8125rem] text-ink-soft">0x{entry.code.toString(16).toUpperCase().padStart(2, "0")}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

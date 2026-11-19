"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useQueryState } from "../_components/useQueryState";
import { CopyButton, Field, Notice, SmallButton, Toggle, inputClass, textareaClass } from "../_components/ui";
import { COUNTRIES, formatBatch, statusLabel, toCsv, type NumberStatus } from "../_lib/e164";

const SAMPLE = "(415) 555-0100\n1-415-555-0123\n00 44 20 7946 0958\n011 61 491 570 156\n+44 (0)20 7946 0123\n415 555";
const RENDER_LIMIT = 500;
const DEFAULTS: Record<string, string> = { cc: "US" };

const STATUS_STYLE: Record<NumberStatus, string> = {
  ok: "bg-mint-tint text-ink",
  check: "bg-warn-tint text-ink",
  invalid: "bg-warn-tint text-ink shadow-[inset_0_0_0_1px_var(--error)]",
};

export function Formatter() {
  const [text, setText] = useState(SAMPLE);
  const [dedupe, setDedupe] = useState(false);
  const { values, set } = useQueryState(DEFAULTS);
  const iso = values.cc ?? "US";
  const deferred = useDeferredValue(text);
  const batch = useMemo(() => formatBatch(deferred, iso), [deferred, iso]);
  const rows = useMemo(() => (dedupe ? batch.rows.filter((row) => !row.duplicate) : batch.rows), [batch, dedupe]);
  const good = rows.filter((row) => row.e164);

  function downloadCsv() {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "e164-numbers.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Field label="Phone numbers" hint="One per line, or separated by commas, semicolons or tabs. You can paste a spreadsheet column.">
          <textarea rows={7} value={text} onChange={(event) => setText(event.target.value)} spellCheck={false} autoComplete="off" className={`${textareaClass} font-mono text-[0.9375rem]`} />
        </Field>
        <div className="space-y-3">
          <Field label="Default country" hint="Used for numbers with no country code.">
            <select className={inputClass} value={iso} onChange={(event) => set({ cc: event.target.value })}>
              {COUNTRIES.map((country) => (
                <option key={country.iso} value={country.iso}>
                  {country.name} (+{country.code})
                </option>
              ))}
            </select>
          </Field>
          <Toggle checked={dedupe} onChange={setDedupe}>
            Remove duplicates
          </Toggle>
          <Notice tone="ok">
            <strong>Your numbers stay here.</strong> This page formats them in your browser and sends nothing anywhere. They aren&apos;t saved or put in the URL.
          </Notice>
        </div>
      </div>

      <p aria-live="polite" className="font-semibold">
        {batch.rows.length === 0 ? (
          "Paste some numbers to format them."
        ) : (
          <>
            {batch.ok} fit the length rules, {batch.check} to check, {batch.invalid} invalid
            {batch.duplicates > 0 ? `, ${batch.duplicates} duplicate${batch.duplicates === 1 ? "" : "s"}` : ""}.
          </>
        )}
      </p>

      <div className="flex flex-wrap gap-2">
        <CopyButton label={`Copy ${good.length} E.164 number${good.length === 1 ? "" : "s"}`} getText={() => good.map((row) => row.e164).join("\n")} disabled={good.length === 0} />
        <SmallButton onClick={downloadCsv} disabled={rows.length === 0}>
          Download CSV
        </SmallButton>
        <SmallButton onClick={() => setText("")} disabled={text === ""}>
          Clear
        </SmallButton>
      </div>

      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-sm border border-line" tabIndex={0} role="region" aria-label="Formatted numbers">
          <table className="w-full min-w-[34rem] border-collapse text-left text-[0.9375rem]">
            <thead className="bg-sunken">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">
                  You pasted
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  E.164
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Check
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.slice(0, RENDER_LIMIT).map((row, index) => (
                <tr key={index} className="align-top">
                  <td className="px-3 py-2 font-mono text-[0.875rem] text-ink-soft">{row.input}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono font-semibold">{row.e164 ?? "None"}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className={`inline-block rounded-[8px] px-2 py-0.5 text-[0.875rem] font-semibold ${STATUS_STYLE[row.status]}`}>{statusLabel(row.status)}</span>
                  </td>
                  <td className="min-w-[14rem] px-3 py-2 leading-snug text-ink-soft">
                    {row.country ? <span className="text-ink">{row.country}. </span> : null}
                    {row.note}
                    {row.duplicate ? " Duplicate of an earlier number." : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {rows.length > RENDER_LIMIT ? (
        <p className="text-[0.9375rem] text-ink-soft">
          Showing the first {RENDER_LIMIT} of {rows.length.toLocaleString("en-US")} rows. Copy and Download include all of them.
        </p>
      ) : null}
      <p className="text-[0.875rem] leading-snug text-ink-soft">
        &ldquo;Length fits&rdquo; means the digit count matches the national plan. It can&apos;t tell you whether the number is in service. Length data comes from Google&apos;s open-source libphonenumber.
      </p>
    </div>
  );
}

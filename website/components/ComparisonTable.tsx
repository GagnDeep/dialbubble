import type { ReactNode } from "react";

export type ComparisonValue = boolean | string | ReactNode;

function Cell({ value }: { value: ComparisonValue }) {
  if (value === true || value === false) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <svg viewBox="0 0 24 24" className={`size-5 flex-none ${value ? "text-mint-text" : "text-ink-soft"}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={value ? "m5 12.5 4.5 4.5L19 7.5" : "M7 7l10 10M17 7 7 17"} />
        </svg>
        <span>{value ? "Yes" : "No"}</span>
      </span>
    );
  }
  return <>{value}</>;
}

/**
 * Feature comparison. The table scrolls inside its own frame on small screens, so the page never does.
 * `highlight` is the index into `columns` of the column to tint, usually Dialbubble.
 */
export function ComparisonTable({
  caption,
  columns,
  rows,
  highlight,
}: {
  caption: string;
  columns: string[];
  rows: { label: string; values: ComparisonValue[] }[];
  highlight?: number;
}) {
  const tint = (index: number) => (index === highlight ? "bg-mint-tint" : "");
  return (
    <div role="region" aria-label={caption} tabIndex={0} className="overflow-x-auto rounded-md border border-line bg-surface">
      <table className="w-full min-w-[34rem] border-collapse text-left text-[0.9375rem] leading-snug">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line">
            <td className="sticky left-0 bg-surface p-3" />
            {columns.map((column, index) => (
              <th key={column} scope="col" className={`p-3 font-display font-semibold ${tint(index)}`}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-line last:border-0">
              <th scope="row" className="sticky left-0 max-w-[11rem] bg-surface p-3 font-semibold">
                {row.label}
              </th>
              {row.values.map((value, index) => (
                <td key={index} className={`p-3 align-top ${tint(index)}`}>
                  <Cell value={value} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

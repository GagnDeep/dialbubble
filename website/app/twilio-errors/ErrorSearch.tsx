"use client";

import Link from "next/link";
import { useId, useState } from "react";

export type ErrorListItem = { code: string; name: string; short: string; severity: string; summary: string };
export type ErrorGroup = { area: string; label: string; items: ErrorListItem[] };

function matches(item: ErrorListItem, query: string) {
  return `${item.code} ${item.name} ${item.short} ${item.summary}`.toLowerCase().includes(query);
}

/** The full list is in the server-rendered HTML, so it works without JavaScript. Typing only narrows it. */
export function ErrorSearch({ groups }: { groups: ErrorGroup[] }) {
  const [query, setQuery] = useState("");
  const inputId = useId();
  const needle = query.trim().toLowerCase().replace(/^(twilio\s+)?((error|warning)\s+)?(code\s+)?/, "");
  const visible = groups
    .map((group) => ({ ...group, items: group.items.filter((item) => matches(item, needle)) }))
    .filter((group) => group.items.length > 0);
  const count = visible.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <div>
      <form role="search" onSubmit={(event) => event.preventDefault()} className="max-w-[32rem]">
        <label htmlFor={inputId} className="font-display font-semibold">
          Search by code or words
        </label>
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="For example 30007 or landline"
          autoComplete="off"
          className="mt-2 block min-h-12 w-full rounded-sm border border-line bg-surface px-4 text-ink placeholder:text-ink-soft"
        />
        <p aria-live="polite" className="mt-2 text-[0.9375rem] text-ink-soft">
          {count === 1 ? "1 code" : `${count} codes`}
        </p>
        <noscript>
          <p className="mt-2 text-[0.9375rem] text-ink-soft">Search needs JavaScript. All the codes are listed below, or use your browser&apos;s find.</p>
        </noscript>
      </form>

      {count === 0 ? (
        <p className="mt-8 max-w-[42rem] rounded-md bg-sunken p-5">
          No match in these 40 codes. Try the number alone, or look it up in{" "}
          <a href="https://www.twilio.com/docs/api/errors" rel="noopener" className="link">
            Twilio&apos;s full error dictionary
          </a>
          .
        </p>
      ) : null}

      {visible.map((group) => (
        <section key={group.area} className="mt-10">
          <h2 className="display-3">{group.label}</h2>
          <ul className="mt-3 border-t border-line">
            {group.items.map((item) => (
              <li key={item.code} className="border-b border-line">
                <Link href={`/twilio-errors/${item.code}`} className="block min-h-11 py-3 hover:bg-sunken">
                  <span className="font-mono font-bold text-mint-text">{item.code}</span>{" "}
                  <span className="font-semibold">{item.short}</span>
                  {item.severity === "Warning" ? <span className="text-ink-soft"> (warning)</span> : null}
                  <span className="mt-0.5 block text-[0.9375rem] text-ink-soft">{item.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

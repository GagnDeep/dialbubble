"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";

const subscribeToHistory = (onChange: () => void) => {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
};
const getSearch = () => window.location.search;
const getHash = () => window.location.hash;
const getEmpty = () => "";

type Values = Record<string, string>;

function encodeValues(values: Values, defaults: Values): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== "" && value !== (defaults[key] ?? "")) params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

/**
 * Tool settings kept in the query string, so a copied link reopens the same estimate. The page stays
 * static: the first render uses the defaults, then React swaps in what the URL says. The URL is
 * written after a short pause, because Safari limits how often history can change.
 * Only pass values that are safe to appear in a URL. Never phone numbers, message text or credentials.
 */
export function useQueryState<T extends Values>(defaults: T) {
  const search = useSyncExternalStore(subscribeToHistory, getSearch, getEmpty);
  const [local, setLocal] = useState<Values | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fromUrl = useMemo(() => {
    const out: Values = {};
    new URLSearchParams(search).forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }, [search]);

  const values = useMemo(() => ({ ...defaults, ...(local ?? fromUrl) }) as T & Values, [defaults, local, fromUrl]);

  function write(next: Values) {
    const url = `${window.location.pathname}${encodeValues(next, defaults)}`;
    try {
      window.history.replaceState(window.history.state, "", url);
    } catch {
      // The browser refused this update. The next change writes the URL again.
    }
  }

  function set(patch: Values) {
    const next = { ...values, ...patch };
    setLocal(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => write(next), 250);
  }

  function reset() {
    setLocal({ ...defaults });
    if (timer.current) clearTimeout(timer.current);
    write(defaults);
  }

  /** The full URL for the current values. Read it from an event handler. */
  function shareUrl() {
    return `${window.location.origin}${window.location.pathname}${encodeValues(values, defaults)}`;
  }

  return { values, set, reset, shareUrl };
}

/**
 * Reads a value from the URL fragment. Browsers don't send the fragment to servers, so this is how a
 * shared link carries message text or TwiML without it reaching any server log.
 */
export function useHashValue(key: string): string | null {
  const hash = useSyncExternalStore(subscribeToHistory, getHash, getEmpty);
  return useMemo(() => {
    if (!hash) return null;
    return new URLSearchParams(hash.slice(1)).get(key);
  }, [hash, key]);
}

export function hashShareUrl(key: string, value: string): string {
  const params = new URLSearchParams();
  params.set(key, value);
  return `${window.location.origin}${window.location.pathname}#${params.toString()}`;
}

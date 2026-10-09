"use client";

import { useSyncExternalStore } from "react";
import type { SearchItem, SearchType } from "@/lib/domain/search";

// The last results the visitor opened, newest first, kept in localStorage
// like the app's SEARCH_RECENT. Shared outside React like the settings, and
// still works for the visit when storage is blocked.

const RECENT_KEY = "F1HUB_SEARCH_RECENT";
const RECENT_LIMIT = 6;

const TYPES: SearchType[] = ["driver", "team", "race", "circuit", "season"];
const EMPTY: SearchItem[] = [];

const isText = (value: unknown): value is string => typeof value === "string";

// Drops anything a stale or hand-edited entry could break the page with,
// including links that leave the site
const isItem = (value: unknown): value is SearchItem => {
  const item = value as Partial<SearchItem> | null;
  return (
    !!item &&
    isText(item.key) &&
    isText(item.title) &&
    isText(item.subtitle) &&
    TYPES.includes(item.type as SearchType) &&
    isText(item.href) &&
    item.href.startsWith("/") &&
    !item.href.startsWith("//")
  );
};

const parse = (raw: string | null): SearchItem[] => {
  if (!raw) return EMPTY;
  try {
    const list: unknown = JSON.parse(raw);
    return Array.isArray(list)
      ? list.filter(isItem).slice(0, RECENT_LIMIT)
      : EMPTY;
  } catch {
    return EMPTY;
  }
};

let current: SearchItem[] | undefined;
const listeners = new Set<() => void>();

const getSnapshot = () => {
  if (!current) {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(RECENT_KEY);
    } catch {}
    current = parse(raw);
  }
  return current;
};

const subscribe = (listener: () => void) => {
  // Another tab opened a result or cleared the list
  const onStorage = (event: StorageEvent) => {
    if (event.key !== RECENT_KEY && event.key !== null) return;
    current = parse(event.newValue);
    listener();
  };

  listeners.add(listener);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};

const save = (list: SearchItem[]) => {
  current = list;
  try {
    if (list.length) localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    else localStorage.removeItem(RECENT_KEY);
  } catch {}
  listeners.forEach((listener) => listener());
};

// The server and the first client render have no recents, then React
// re-renders with the saved ones
export const useRecentSearches = () =>
  useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

export const addRecentSearch = (item: SearchItem) =>
  save(
    [item, ...getSnapshot().filter((r) => r.key !== item.key)].slice(
      0,
      RECENT_LIMIT,
    ),
  );

export const clearRecentSearches = () => save(EMPTY);

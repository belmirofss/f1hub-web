"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Search as SearchIcon, X } from "lucide-react";
import { BackButton } from "@/components/layout/BackButton";
import { SEARCH_INPUT_ID } from "@/components/layout/SearchShortcut";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Label } from "@/components/ui/Label";
import { onRadioKeyDown } from "@/components/ui/radioKeys";
import { raceHref } from "@/lib/domain/routes";
import {
  search,
  seasonItem,
  type SearchItem,
  type SearchType,
} from "@/lib/domain/search";
import { formatShortDate, toDate } from "@/lib/domain/time";
import {
  addRecentSearch,
  clearRecentSearches,
  useRecentSearches,
} from "./recentSearches";
import { FilterChip, ResultRow, TopHit } from "./SearchRows";
import { useSearchIndex } from "./useSearchIndex";

// Ported from the app's src/screens/Search/Search.tsx. The query lives in
// the URL (/search?q=monaco+2024) so a search can be shared or reloaded.

type Filter = "all" | SearchType;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "driver", label: "DRIVERS" },
  { value: "team", label: "TEAMS" },
  { value: "race", label: "RACES" },
  { value: "circuit", label: "CIRCUITS" },
  { value: "season", label: "SEASONS" },
];

const GROUPS = FILTERS.filter(
  (f): f is { value: SearchType; label: string } => f.value !== "all",
);

// Rows per group before "N more" filters to that type
const GROUP_LIMIT = 4;
const RESULT_LIMIT = 50;

const PLACEHOLDER = "Drivers, teams, circuits, races, years";

// The search box. Without onChange it's the read-only stand-in shown before
// the page knows the URL.
export const SearchField = ({
  value,
  onChange,
}: {
  value: string;
  onChange?: (value: string) => void;
}) => (
  <div className="flex items-center gap-1 lg:pt-6">
    <BackButton fallbackHref="/" className="-ml-2.5 lg:hidden" />
    <label className="flex min-h-[46px] min-w-0 flex-1 items-center gap-2 border border-line bg-surface px-3 text-muted focus-within:border-text">
      <SearchIcon aria-hidden size={18} strokeWidth={2} className="shrink-0" />
      <span className="sr-only">
        Search drivers, teams, circuits, races and seasons
      </span>
      <input
        id={onChange ? SEARCH_INPUT_ID : undefined}
        type="search"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        readOnly={!onChange}
        autoFocus={!!onChange}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="search"
        placeholder={PLACEHOLDER}
        className="min-w-0 flex-1 bg-transparent py-2 text-base font-semibold text-text placeholder:font-normal placeholder:text-faint focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {!!value && onChange && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            document.getElementById(SEARCH_INPUT_ID)?.focus();
          }}
          aria-label="Clear search"
          className="-mr-2.5 flex size-11 shrink-0 cursor-pointer items-center justify-center hover:text-text"
        >
          <X aria-hidden size={18} strokeWidth={2} />
        </button>
      )}
    </label>
  </div>
);

const Group = ({
  label,
  items,
  action,
  onOpen,
}: {
  label: string;
  items: SearchItem[];
  action?: ReactNode;
  onOpen: (item: SearchItem) => void;
}) => (
  <section
    aria-label={label}
    className="flex flex-col gap-1.5 border-t-2 border-text pt-3"
  >
    <div className="flex items-center justify-between">
      <h2>
        <Label>{label}</Label>
      </h2>
      {action}
    </div>
    <ul>
      {items.map((item, i) => (
        <ResultRow key={item.key} item={item} first={i === 0} onOpen={onOpen} />
      ))}
    </ul>
  </section>
);

// "CLEAR", "3 MORE →": small caps text buttons in a group header
const HeaderButton = ({
  children,
  label,
  onClick,
}: {
  children: string;
  label?: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className="relative cursor-pointer after:absolute after:-inset-x-2 after:-inset-y-3 hover:[&>span]:text-text"
  >
    <Label>{children}</Label>
  </button>
);

// Values this page wrote to ?q= that the router hasn't caught up with yet,
// to tell them apart from a link to /search while the page is open
const pendingUrls = new Set<string>();

const urlFor = (query: string) =>
  query ? `/search?${new URLSearchParams({ q: query })}` : "/search";

const localDate = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const Search = () => {
  const router = useRouter();
  const urlQuery = useSearchParams().get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [seenUrlQuery, setSeenUrlQuery] = useState(urlQuery);
  const [filter, setFilter] = useState<Filter>("all");
  const recent = useRecentSearches();

  // The URL changed under the page (the header's search link, back or
  // forward), so follow it
  if (urlQuery !== seenUrlQuery) {
    setSeenUrlQuery(urlQuery);
    if (!pendingUrls.has(urlQuery)) {
      setQuery(urlQuery);
      setFilter("all");
    }
  }

  useEffect(() => {
    if (urlQuery === query) pendingUrls.clear();
  }, [urlQuery, query]);

  const deferred = useDeferredValue(query);
  const trimmed = deferred.trim();
  const year = deferred.match(/\b(19[5-9]\d|20\d\d)\b/)?.[1];
  const { index, isLoading, isError, refetch } = useSearchIndex(year);

  const results = useMemo(
    () => (trimmed ? search(deferred, index) : []),
    [trimmed, deferred, index],
  );
  const shown =
    filter === "all" ? results : results.filter((r) => r.type === filter);
  const counts = useMemo(() => {
    const map = new Map<Filter, number>([["all", results.length]]);
    results.forEach((r) => map.set(r.type, (map.get(r.type) ?? 0) + 1));
    return map;
  }, [results]);

  const onChange = (text: string) => {
    setQuery(text);
    setFilter("all");
    pendingUrls.add(text);
    window.history.replaceState(null, "", urlFor(text));
  };

  const open = (item: SearchItem) => addRecentSearch(item);

  // Enter opens the first result, like the app's search key
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const first = shown[0];
    if (!first) return;
    open(first);
    router.push(first.href);
  };

  const today = localDate();
  const nextRace = index.currentRaces.find((r) => r.date >= today);
  const shortcuts: SearchItem[] = [
    ...(nextRace
      ? [
          {
            key: "next-race",
            type: "race" as const,
            title: nextRace.raceName,
            subtitle: `Next race · ${formatShortDate(toDate(nextRace.date), "UTC")}`,
            meta: `R${nextRace.round}`,
            href: raceHref(nextRace, index.currentRaces),
          },
        ]
      : []),
    ...(index.currentSeason ? [seasonItem(index.currentSeason, index)] : []),
  ];

  const top = filter === "all" ? shown[0] : undefined;
  const rest = top ? shown.slice(1) : shown;
  const limit = filter === "all" ? GROUP_LIMIT : RESULT_LIMIT;

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-3">
      <h1 className="sr-only">Search</h1>
      <form role="search" onSubmit={onSubmit} className="flex flex-col gap-3">
        <SearchField value={query} onChange={onChange} />
        {!!trimmed && results.length > 0 && (
          <div
            role="radiogroup"
            aria-label="Filter results"
            onKeyDown={onRadioKeyDown}
            className="-mx-4 no-scrollbar flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0"
          >
            {FILTERS.filter(
              (f) =>
                f.value === "all" || counts.get(f.value) || filter === f.value,
            ).map((f) => (
              <FilterChip
                key={f.value}
                label={f.label}
                count={counts.get(f.value) ?? 0}
                on={filter === f.value}
                onSelect={() => setFilter(f.value)}
              />
            ))}
          </div>
        )}
      </form>

      <p role="status" className="sr-only">
        {trimmed && !isLoading
          ? `${shown.length} ${shown.length === 1 ? "result" : "results"}`
          : ""}
      </p>

      <div className="flex flex-col gap-[18px] pt-1">
        {!trimmed ? (
          <>
            {recent.length > 0 && (
              <Group
                label="Recent"
                items={recent}
                onOpen={open}
                action={
                  <HeaderButton
                    label="Clear recent searches"
                    onClick={clearRecentSearches}
                  >
                    Clear
                  </HeaderButton>
                }
              />
            )}
            {shortcuts.length > 0 && (
              <Group label="Jump to" items={shortcuts} onOpen={open} />
            )}
            <p className="text-[13px] leading-[19px] text-muted">
              Search by name, code (VER), year (2021) or a place and a year
              (monaco 2024).
            </p>
          </>
        ) : (
          <>
            {top && <TopHit item={top} onOpen={open} />}
            {GROUPS.map(({ value, label }) => {
              const list = rest.filter((r) => r.type === value);
              if (!list.length) return null;
              const more = filter === "all" ? list.length - limit : 0;
              return (
                <Group
                  key={value}
                  label={label}
                  items={list.slice(0, limit)}
                  onOpen={open}
                  action={
                    more > 0 && (
                      <HeaderButton
                        label={`Show all ${list.length} ${label.toLowerCase()}`}
                        onClick={() => setFilter(value)}
                      >
                        {`${more} more →`}
                      </HeaderButton>
                    )
                  }
                />
              );
            })}
            {isLoading && (
              <p className="flex items-center justify-center gap-2 text-[13px] text-muted">
                <LoaderCircle
                  aria-hidden
                  size={16}
                  className="animate-spin motion-reduce:animate-none"
                />
                Loading every driver, team and circuit…
              </p>
            )}
            {!isLoading && isError && <ErrorState onRetry={refetch} />}
            {!isLoading && !isError && !shown.length && (
              <EmptyState>
                Nothing for “{trimmed}”. Try a surname, a code like LEC, or a
                place and a year like spa 2023.
              </EmptyState>
            )}
          </>
        )}
      </div>
    </div>
  );
};

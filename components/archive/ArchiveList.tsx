"use client";

// The seasons table from the app's src/screens/Archive/Archive.tsx, with its
// filter and "Show all". Every row is in the HTML, so crawlers reach each
// season; the ones past the first page are only hidden.
import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Search, X } from "lucide-react";
import { EmptyState } from "@/components/ui/States";
import { cn } from "@/lib/cn";

export type ArchiveRow = {
  season: string;
  href: string;
  // "In progress" or "Upcoming" before a season has a champion
  champion: string;
  team?: string;
  teamColor?: string;
  wins?: number;
  points?: number;
};

const PAGE = 12;

// "Räikkönen" matches "raikkonen"
const normalize = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const matches = (row: ArchiveRow, term: string) =>
  [row.season, row.champion, row.team ?? ""].some((text) =>
    normalize(text).includes(term),
  );

const header =
  "pb-1.5 text-left align-bottom font-mono text-[11px] font-medium tracking-[1px] text-muted uppercase lg:px-2 lg:pb-2";
const cell = "h-[50px] border-b border-line-soft lg:px-2";
const desktopOnly = "max-lg:hidden";

export const ArchiveList = ({ rows }: { rows: ArchiveRow[] }) => {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const term = normalize(query.trim());
  const visible = term ? rows.filter((row) => matches(row, term)) : rows;
  const paged = !term && !showAll && rows.length > PAGE;

  return (
    <div className="flex flex-col gap-3.5 lg:gap-5">
      <label className="flex min-h-[46px] items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3.5 text-muted focus-within:border-line-dashed lg:max-w-md">
        <Search aria-hidden size={18} strokeWidth={2} className="shrink-0" />
        <span className="sr-only">Search the archive</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Year, champion or team"
          enterKeyHint="search"
          className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-text placeholder:text-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="-mr-2.5 flex size-11 shrink-0 cursor-pointer items-center justify-center hover:text-text"
          >
            <X aria-hidden size={18} strokeWidth={2} />
          </button>
        )}
      </label>

      <section aria-label="Seasons" className="flex flex-col">
        <table className="w-full border-collapse font-sans">
          <caption className="sr-only">
            Formula 1 seasons, newest first, with the drivers&apos; champion
          </caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className={cn(header, "w-14 lg:w-20")}>
                Year
              </th>
              <th scope="col" className={header}>
                Champion
              </th>
              <th scope="col" className={cn(header, "pl-2")}>
                Team
              </th>
              <th
                scope="col"
                className={cn(header, desktopOnly, "w-20 lg:text-right")}
              >
                Wins
              </th>
              <th
                scope="col"
                className={cn(header, desktopOnly, "w-20 lg:text-right")}
              >
                <abbr title="Points" className="no-underline">
                  Pts
                </abbr>
              </th>
              <td aria-hidden className="w-5" />
            </tr>
          </thead>
          <tbody>
            {visible.map((row, index) => (
              // The year's link stretches over the whole row
              <tr
                key={row.season}
                className={cn(
                  "relative transition-colors hover:bg-surface",
                  paged && index >= PAGE && "hidden",
                )}
              >
                <td className={cn(cell, "font-mono text-[15px] font-bold")}>
                  <Link
                    href={row.href}
                    className="after:absolute after:inset-0 hover:underline"
                  >
                    {row.season}
                    <span className="sr-only"> season</span>
                  </Link>
                </td>
                <td
                  className={cn(
                    cell,
                    "max-w-0 truncate text-[15px] font-bold",
                    !row.team && "text-muted",
                  )}
                >
                  {row.champion}
                </td>
                <td className={cn(cell, "pl-2")}>
                  {row.team && (
                    <span className="flex max-w-[120px] items-center gap-1.5 text-xs text-muted lg:max-w-none lg:text-sm">
                      <span
                        aria-hidden
                        className="size-2 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: row.teamColor }}
                      />
                      <span className="truncate">{row.team}</span>
                    </span>
                  )}
                </td>
                <td
                  className={cn(
                    cell,
                    desktopOnly,
                    "text-right font-mono text-sm text-soft",
                  )}
                >
                  {row.wins}
                </td>
                <td
                  className={cn(
                    cell,
                    desktopOnly,
                    "text-right font-mono text-sm font-bold",
                  )}
                >
                  {row.points}
                </td>
                <td className={cn(cell, "text-right")}>
                  <ChevronRight
                    aria-hidden
                    size={14}
                    strokeWidth={2}
                    className="ml-auto text-muted"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!visible.length && (
          <EmptyState>No seasons match your search.</EmptyState>
        )}

        {paged && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="mt-2.5 min-h-11 cursor-pointer rounded-md border border-line bg-surface font-semibold transition-colors hover:bg-surface-raised"
          >
            Show all {rows.length} seasons
          </button>
        )}
      </section>
    </div>
  );
};

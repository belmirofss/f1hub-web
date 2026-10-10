"use client";

// The grid as a plain table, newest first, under its own "Show all". Every
// row is in the HTML, so crawlers reach each season; the ones past the first
// page are only hidden. The grid's filter narrows it too.
import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui/States";
import { cn } from "@/lib/cn";
import type { ArchiveView, GridCell } from "@/lib/domain/archive";

const PAGE = 10;

const header =
  "pb-1.5 text-left align-bottom font-mono text-[11px] font-medium tracking-[1px] text-muted uppercase lg:px-2 lg:pb-2";
const cell = "h-[50px] border-b border-line-soft lg:px-2";
const desktopOnly = "max-lg:hidden";

export const ArchiveList = ({
  view,
  rows,
  term,
}: {
  view: ArchiveView;
  rows: GridCell[];
  // The grid's filter, normalized
  term: string;
}) => {
  const [showAll, setShowAll] = useState(false);
  const drivers = view === "drivers";
  const visible = term ? rows.filter((row) => row.search.includes(term)) : rows;
  const paged = !term && !showAll && rows.length > PAGE;

  return (
    <section
      aria-labelledby="every-season"
      className="flex flex-col border-t-2 border-text pt-3"
    >
      <h2 id="every-season" className="pb-2 section-label">
        Every season
      </h2>
      <table className="w-full border-collapse font-sans">
        <caption className="sr-only">
          Formula 1 seasons, newest first, with the{" "}
          {drivers ? "drivers'" : "constructors'"} champion
        </caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className={cn(header, "w-14 lg:w-20")}>
              Year
            </th>
            <th scope="col" className={header}>
              {drivers ? "Champion" : "Constructor"}
            </th>
            {drivers && (
              <th scope="col" className={cn(header, "pl-2")}>
                Team
              </th>
            )}
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
                  href={row.href!}
                  className="after:absolute after:inset-0 hover:underline"
                >
                  {row.season}
                  <span className="sr-only"> season</span>
                </Link>
              </td>
              <td
                className={cn(
                  cell,
                  "max-w-0 text-[15px] font-bold",
                  row.kind !== "title" && "text-muted",
                )}
              >
                <span className="flex items-center gap-1.5">
                  {/* Constructors have no team column, so the swatch
                      sits by the name */}
                  {!drivers && row.background && (
                    <span
                      aria-hidden
                      className="size-2 shrink-0"
                      style={{ backgroundColor: row.background }}
                    />
                  )}
                  <span className="truncate">{row.name}</span>
                </span>
              </td>
              {drivers && (
                <td className={cn(cell, "pl-2")}>
                  {row.team && (
                    <span className="flex max-w-[120px] items-center gap-1.5 text-xs text-muted lg:max-w-none lg:text-sm">
                      <span
                        aria-hidden
                        className="size-2 shrink-0"
                        style={{ backgroundColor: row.background }}
                      />
                      <span className="truncate">{row.team}</span>
                    </span>
                  )}
                </td>
              )}
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

      {!visible.length && <EmptyState>No seasons match the filter.</EmptyState>}

      {paged && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-2.5 min-h-11 cursor-pointer border border-text font-semibold transition-colors hover:bg-text hover:text-background"
        >
          Show all {rows.length} seasons
        </button>
      )}
    </section>
  );
};

"use client";

// Every season on one screen: a row per decade, a cell per year in the
// champion's team colour. Hovering, focusing or tapping a cell shows it in
// the detail panel; the filter dims the cells that don't match. Every cell
// is a link to its season, so the grid works without JavaScript too.
import { useRef, useState, type MouseEvent, type PointerEvent } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { Segmented } from "@/components/ui/Segmented";
import { cn } from "@/lib/cn";
import {
  archiveHref,
  normalize,
  type ArchiveView,
  type GridCell,
  type GridDecade,
  type LegendEntry,
  type TitleCount,
} from "@/lib/domain/archive";
import { shortYear } from "@/lib/domain/drivers";
import { ArchiveList } from "./ArchiveList";
import { ChampionBlock } from "./ChampionBlock";

const ROW =
  "grid grid-cols-[30px_repeat(10,minmax(0,1fr))] gap-[3px] md:grid-cols-[52px_repeat(10,minmax(0,1fr))] md:gap-[5px]";

const CELL =
  "relative flex h-[34px] items-center justify-center overflow-hidden font-mono text-[9px] font-bold transition-opacity md:h-[78px] md:flex-col md:items-stretch md:justify-between md:p-[7px] md:text-[10px] focus-visible:z-10";

const matches = (cell: GridCell, term: string) =>
  cell.kind !== "future" && cell.search.includes(term);

const Cell = ({
  cell,
  selected,
  dimmed,
}: {
  cell: GridCell;
  selected: boolean;
  dimmed: boolean;
}) => {
  if (cell.kind === "future") {
    return (
      <span
        aria-hidden
        className={cn(CELL, "border border-dashed border-line")}
      />
    );
  }
  const title = cell.kind === "title";
  return (
    <Link
      href={cell.href!}
      aria-label={cell.label}
      aria-current={selected ? "true" : undefined}
      data-season={cell.season}
      className={cn(
        CELL,
        cell.kind === "live" &&
          "border-2 border-dashed border-accent text-accent-ink",
        cell.kind === "upcoming" &&
          "border border-dashed border-line-dashed text-muted",
        cell.kind === "none" && "bg-surface-raised text-muted",
        // An ink ring inside a paper one, so it shows on every team colour
        selected &&
          "shadow-[inset_0_0_0_3px_var(--color-text),inset_0_0_0_5px_var(--color-background)] md:shadow-[inset_0_0_0_3px_var(--color-text),inset_0_0_0_6px_var(--color-background)]",
        dimmed && "opacity-20",
      )}
      style={
        title ? { backgroundColor: cell.background, color: cell.text } : {}
      }
    >
      <span className="md:hidden">{shortYear(cell.season)}</span>
      <span className="max-md:hidden">{cell.season}</span>
      {cell.short && (
        <span className="truncate font-sans text-xs leading-[1.05] font-extrabold max-md:hidden">
          {cell.short}
        </span>
      )}
    </Link>
  );
};

const DetailPanel = ({ cell }: { cell: GridCell }) => (
  <ChampionBlock
    meta={cell.meta}
    headline={cell.headline}
    summary={cell.summary}
    link={
      cell.href
        ? { href: cell.href, label: `Open the ${cell.season} season` }
        : undefined
    }
    color={
      cell.kind === "title"
        ? { background: cell.background!, text: cell.text! }
        : undefined
    }
    live={cell.kind === "live"}
  />
);

const MostTitles = ({ most }: { most: TitleCount[] }) => (
  <section aria-labelledby="most-titles" className="flex flex-col gap-2">
    <h2 id="most-titles" className="section-label">
      Most titles
    </h2>
    <ol className="flex flex-col">
      {most.map((entry) => (
        <li key={entry.id}>
          <Link
            href={entry.href}
            className="group grid min-h-9 grid-cols-[104px_minmax(0,1fr)_20px] items-center gap-2.5"
          >
            <span className="truncate text-sm font-bold group-hover:underline">
              {entry.name}
            </span>
            <span aria-hidden className="flex flex-wrap gap-0.5">
              {Array.from({ length: entry.count }, (_, i) => (
                <span key={i} className="size-2 bg-accent-ink" />
              ))}
            </span>
            <span className="text-right font-mono text-sm font-bold">
              {entry.count}
              <span className="sr-only">
                {entry.count === 1 ? " title" : " titles"}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  </section>
);

const Legend = ({ legend }: { legend: LegendEntry[] }) => (
  <section aria-labelledby="team-colours" className="flex flex-col gap-2">
    <h2 id="team-colours" className="section-label">
      Teams
    </h2>
    <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
      {legend.map((team) => (
        <li
          key={team.name}
          className="flex items-center gap-1.5 text-xs text-soft"
        >
          <span
            aria-hidden
            className="size-2.5 shrink-0"
            style={{ backgroundColor: team.color }}
          />
          {team.name}
        </li>
      ))}
    </ul>
  </section>
);

export const ChampionsGrid = ({
  view,
  decades,
  initial,
  most,
  legend,
}: {
  view: ArchiveView;
  decades: GridDecade[];
  // The season the panel opens on
  initial: string;
  most: TitleCount[];
  legend: LegendEntry[];
}) => {
  const cells = decades.flatMap((decade) => decade.cells);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(initial);
  // What was selected when a tap started, before focus moved
  const tapStart = useRef<string | null>(null);

  const term = normalize(query.trim());
  const shown = cells.find((cell) => cell.season === selected) ?? cells[0];

  const filter = (value: string) => {
    setQuery(value);
    const next = normalize(value.trim());
    const first = next && cells.find((cell) => matches(cell, next));
    if (first) setSelected(first.season);
  };

  const seasonOf = (target: EventTarget) =>
    (target as Element).closest<HTMLElement>("[data-season]")?.dataset.season;

  // A mouse previews on hover, so its click opens the season. A tap only
  // selects the cell, and a second tap on it opens the season.
  const onPointerOver = (event: PointerEvent) => {
    const season = seasonOf(event.target);
    if (event.pointerType === "mouse" && season) setSelected(season);
  };
  const onPointerDown = (event: PointerEvent) => {
    tapStart.current = event.pointerType === "mouse" ? null : selected;
  };
  const onClick = (event: MouseEvent) => {
    const season = seasonOf(event.target);
    if (season && tapStart.current !== null && tapStart.current !== season) {
      event.preventDefault();
      setSelected(season);
    }
    tapStart.current = null;
  };

  const listRows = cells.filter((cell) => cell.kind !== "future").reverse();

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Segmented<ArchiveView>
          label="Championship"
          value={view}
          className="w-full md:w-auto"
          options={[
            {
              value: "drivers",
              label: "Drivers",
              href: archiveHref("drivers"),
            },
            {
              value: "constructors",
              label: "Constructors",
              href: archiveHref("constructors"),
            },
          ]}
        />
        <label className="flex min-h-[46px] items-center gap-2.5 border border-line bg-surface px-3.5 text-muted focus-within:border-text md:w-80">
          <Search aria-hidden size={18} strokeWidth={2} className="shrink-0" />
          <span className="sr-only">Filter the archive</span>
          <input
            type="search"
            value={query}
            onChange={(event) => filter(event.target.value)}
            placeholder={
              view === "drivers" ? "Year, driver or team" : "Year or team"
            }
            enterKeyHint="search"
            className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-text placeholder:text-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear the filter"
              onClick={() => filter("")}
              className="-mr-2.5 flex size-11 shrink-0 cursor-pointer items-center justify-center hover:text-text"
            >
              <X aria-hidden size={18} strokeWidth={2} />
            </button>
          )}
        </label>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-7">
        <section
          aria-label={
            view === "drivers"
              ? "Drivers' champions by season"
              : "Constructors' champions by season"
          }
          className="flex flex-col gap-[3px] md:gap-[5px]"
          onPointerOver={onPointerOver}
          onPointerDown={onPointerDown}
          // Capture, so it runs before the cell's link navigates
          onClickCapture={onClick}
          onFocus={(event) => {
            const season = seasonOf(event.target);
            if (season) setSelected(season);
          }}
        >
          <div aria-hidden className={cn(ROW, "max-md:hidden")}>
            <span />
            {Array.from({ length: 10 }, (_, digit) => (
              <span
                key={digit}
                className="text-center font-mono text-[10px] text-muted"
              >
                {digit}
              </span>
            ))}
          </div>
          {decades.map((decade) => (
            <div key={decade.label} className={ROW}>
              <span
                aria-hidden
                className="self-center font-mono text-[10px] font-bold text-muted md:text-xs"
              >
                <span className="md:hidden">{decade.short}</span>
                <span className="max-md:hidden">{decade.label}</span>
              </span>
              {decade.cells.map((cell) => (
                <Cell
                  key={cell.season}
                  cell={cell}
                  selected={cell.season === shown.season}
                  dimmed={!!term && !matches(cell, term)}
                />
              ))}
            </div>
          ))}
        </section>

        <div className="flex flex-col gap-6 lg:pt-[17px]">
          <DetailPanel cell={shown} />
          {most.length > 0 && <MostTitles most={most} />}
          {legend.length > 0 && <Legend legend={legend} />}
        </div>
      </div>

      <ArchiveList view={view} rows={listRows} term={term} />
    </div>
  );
};

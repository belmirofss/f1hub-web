"use client";

// Ported from the app's src/screens/Standings/Teammates.tsx. The selected team
// lives in ?team=, swapped with history.replaceState so picking a team
// doesn't go back to the server; the rows stay real links for crawlers and
// new tabs.
import { useRef, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Timer } from "lucide-react";
import { Columns } from "@/components/layout/Columns";
import { Card, TeamBar } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { SplitBar } from "@/components/ui/SplitBar";
import type { Driver } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import type { Score, TeammatePair } from "@/lib/domain/headToHead";
import { driverHref } from "@/lib/domain/routes";
import { getDriverCode, getTeamColor } from "@/lib/domain/teams";

const Metric = ({
  label,
  score,
  color,
}: {
  label: string;
  score: Score;
  color: string;
}) => {
  const [a, b] = score.map((value) => +value.toFixed(1));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline">
        <span
          className={cn(
            "w-16 font-mono text-[15px] font-bold",
            a > b ? "text-text" : "text-muted",
          )}
        >
          {a}
        </span>
        <Label className="flex-1 text-center text-[10px]">{label}</Label>
        <span
          className={cn(
            "w-16 text-right font-mono text-[15px] font-bold",
            b > a ? "text-text" : "text-muted",
          )}
        >
          {b}
        </span>
      </div>
      <SplitBar a={a} b={b} color={color} />
    </div>
  );
};

const Name = ({
  driver,
  align,
}: {
  driver: Driver;
  align: "left" | "right";
}) => (
  <Link
    href={driverHref(driver.driverId)}
    className={cn(
      "flex min-w-0 flex-1 flex-col hover:underline",
      align === "left" ? "items-start" : "items-end text-right",
    )}
  >
    <span className="text-[13px] text-muted">{driver.givenName}</span>
    <span className="max-w-full -skew-x-6 truncate text-[22px] leading-[26px] font-black uppercase">
      {driver.familyName}
    </span>
  </Link>
);

const PairCard = ({ pair }: { pair: TeammatePair }) => {
  const color = getTeamColor(pair.team.constructorId);
  const gap = pair.qualifyingGapMs;
  const faster = gap === undefined ? undefined : gap <= 0 ? pair.a : pair.b;
  const id = `pair-${pair.team.constructorId}`;

  return (
    <Card as="section" aria-labelledby={id} className="gap-3.5">
      <div className="flex items-center gap-2">
        <TeamBar color={color} height={16} />
        <h2 id={id}>
          <Label className="text-text">{pair.team.name}</Label>
        </h2>
        <Label className="ml-auto">{pair.rounds} races together</Label>
      </div>
      <div className="flex items-center">
        <Name driver={pair.a} align="left" />
        <span className="px-2.5 font-mono text-xs text-faint">VS</span>
        <Name driver={pair.b} align="right" />
      </div>
      <dl className="contents">
        {(
          [
            ["Qualifying", pair.qualifying],
            ["Race", pair.race],
            ["Points", pair.points],
            ["Podiums", pair.podiums],
          ] as const
        ).map(([label, score]) => (
          <div key={label}>
            <dt className="sr-only">{label}</dt>
            <dd>
              <span className="sr-only">
                {pair.a.familyName} {+score[0].toFixed(1)}, {pair.b.familyName}{" "}
                {+score[1].toFixed(1)}
              </span>
              <div aria-hidden>
                <Metric label={label} score={score} color={color} />
              </div>
            </dd>
          </div>
        ))}
      </dl>
      {faster && gap !== undefined && (
        <div className="flex items-center gap-2.5 rounded-[10px] bg-surface-raised p-3">
          <Timer
            aria-hidden
            size={18}
            strokeWidth={2}
            className="shrink-0 text-purple"
          />
          <span className="flex-1 text-[13px] text-soft">
            Average qualifying gap
          </span>
          <span className="font-mono text-[13px] font-bold text-purple">
            <abbr title={faster.familyName} className="no-underline">
              {getDriverCode(faster)}
            </abbr>{" "}
            −{(Math.abs(gap) / 1000).toFixed(3)}s
          </span>
        </div>
      )}
    </Card>
  );
};

// A plain click swaps the card in place; modified clicks open the link
const isPlainClick = (event: MouseEvent) =>
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey;

// Every team's two drivers compared; pick a team to see its full battle
export const TeammateBattles = ({ pairs }: { pairs: TeammatePair[] }) => {
  const pathname = usePathname();
  const selected = useSearchParams().get("team");
  const cardRef = useRef<HTMLDivElement>(null);

  const pair = pairs.find((p) => p.team.constructorId === selected) ?? pairs[0];

  const select = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    window.history.replaceState(null, "", event.currentTarget.href);
    // On phones the list is under the card, so bring the card back into view
    const card = cardRef.current;
    if (card && card.getBoundingClientRect().top < 0) {
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      card.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    }
  };

  return (
    // Phones show the card above the list, desktop keeps it beside the list
    // while it scrolls
    <Columns
      asideClassName="max-lg:order-first max-lg:basis-full lg:sticky lg:top-5"
      aside={
        <div ref={cardRef} className="scroll-mt-4">
          <PairCard pair={pair} />
        </div>
      }
    >
      <section aria-labelledby="teams-heading" className="flex flex-col">
        <div className="flex gap-2.5 border-b border-line pb-1.5">
          <h2 id="teams-heading" className="flex-1">
            <Label>Team</Label>
          </h2>
          <Label aria-hidden>Qualifying</Label>
        </div>
        <ul>
          {pairs.map((p) => {
            const on = p === pair;
            const color = getTeamColor(p.team.constructorId);
            const [a, b] = p.qualifying;
            return (
              <li key={p.team.constructorId}>
                <a
                  href={`${pathname}?team=${p.team.constructorId}`}
                  onClick={select}
                  aria-current={on ? "true" : undefined}
                  aria-label={`${p.team.name}: ${p.a.familyName} ${a}, ${p.b.familyName} ${b} in qualifying`}
                  className={cn(
                    "flex min-h-[52px] items-center gap-2.5 border-b border-line-soft px-1 transition-colors hover:bg-surface",
                    on && "bg-surface",
                  )}
                >
                  <TeamBar color={color} height={28} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] font-bold">
                      {p.team.name}
                    </span>
                    <span className="font-mono text-[10px] text-muted">
                      {getDriverCode(p.a)} vs {getDriverCode(p.b)}
                    </span>
                  </span>
                  <SplitBar a={a} b={b} color={color} className="w-24" />
                  <span className="w-11 text-right font-mono text-[13px] font-bold">
                    {a}–{b}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>
    </Columns>
  );
};

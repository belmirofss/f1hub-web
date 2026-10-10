// "Race control · key laps": the race's turning points by lap, beside the
// results table on desktop and under it on phones. Race control comes from
// OpenF1 (2023+); retirements and the fastest lap come from the results, so
// older races still get those. Ends with a link to the team radio.
import Link from "next/link";
import { Play } from "lucide-react";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import {
  getRaceControl,
  getTeamRadio,
  type SessionRef,
} from "@/lib/api/openf1";
import type { OpenF1Session, Result } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { getKeyLaps, type KeyLapKind } from "@/lib/domain/keyLaps";
import { orFallback, plural } from "@/lib/metadata";

const LAP_COLORS: Record<KeyLapKind, string> = {
  incident: "text-text",
  "safety-car": "text-sprint-ink",
  "red-flag": "text-accent-ink",
  penalty: "text-second",
  retirement: "text-muted",
  "fastest-lap": "text-purple",
};

const RadioLink = async ({
  session,
  href,
}: {
  session: SessionRef;
  href: string;
}) => {
  // OpenF1 locks every request while a session is live, and the link is
  // an extra, so a failure just leaves it out
  const clips = (await orFallback(getTeamRadio(session)))?.length;
  if (!clips) return null;

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 border-t-2 border-text pt-3"
    >
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent"
      >
        <Play size={14} fill="currentColor" strokeWidth={0} />
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-bold group-hover:underline">
          Team radio · {plural(clips, "clip")}
        </span>
        <span className="text-[11px] text-muted">
          Race control and radio, lap by lap
        </span>
      </span>
    </Link>
  );
};

export const KeyLaps = async ({
  session,
  results,
  radioHref,
}: {
  // OpenF1's session, or null before 2023
  session: OpenF1Session | null;
  results: Result[];
  // The race links to its Radio tab; a sprint has no radio of its own
  radioHref?: string;
}) => {
  // Without race control (before 2023, or OpenF1 down) the results still
  // give the retirements and the fastest lap
  const messages =
    (session && (await orFallback(getRaceControl(session)))) || [];
  const laps = getKeyLaps({
    messages,
    results,
    start: session?.date_start,
  });
  if (!laps.length) return null;

  return (
    <aside
      aria-labelledby="key-laps"
      className="flex flex-col gap-4 lg:border-l lg:border-line lg:pl-6"
    >
      <h2 id="key-laps">
        <Label>
          {messages.length ? "Race control · key laps" : "Key laps"}
        </Label>
      </h2>
      <ol className="flex flex-col">
        {laps.map((lap, index) => (
          <li
            key={index}
            className="grid grid-cols-[40px_minmax(0,1fr)] gap-2.5 border-b border-line-soft py-2.5 first:pt-0"
          >
            <span
              className={cn(
                "font-mono text-xs font-bold",
                LAP_COLORS[lap.kind],
              )}
            >
              <span aria-hidden>L{lap.lap}</span>
              <span className="sr-only">Lap {lap.lap}:</span>
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[13px] leading-snug font-bold">
                {lap.title}
              </span>
              {lap.detail && (
                <span className="text-xs leading-snug break-words text-muted">
                  {lap.detail}
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
      {session && radioHref && <RadioLink session={session} href={radioHref} />}
    </aside>
  );
};

export const KeyLapsSkeleton = () => (
  <CardSkeleton lines={8} className="lg:border-l lg:border-line lg:pl-6" />
);

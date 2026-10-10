import Link from "next/link";
import { Card, InlineLink } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { getCountryCode3ByName } from "@/lib/domain/countries";
import { raceHref } from "@/lib/domain/routes";
import {
  formatRaceDay,
  getRaceStart,
  isSprintWeekend,
} from "@/lib/domain/sessions";
import { getNextWeekend } from "@/lib/nextWeekend";

const DAY = 24 * 3600000;

// The round after the coming one, its date and how long the wait is
export const UpNextCard = async () => {
  const { races, race } = await getNextWeekend();
  const after = race && races[races.indexOf(race) + 1];

  if (!after) {
    return (
      <Card as="section" aria-labelledby="up-next">
        <h2 id="up-next">
          <Label>Up next after this</Label>
        </h2>
        <p className="text-sm text-soft">
          {race
            ? `The ${race.raceName} is the last round of ${race.season}.`
            : "Next season's calendar isn't out yet."}
        </p>
        <InlineLink href="/calendar" className="self-start">
          Calendar
        </InlineLink>
      </Card>
    );
  }

  const weeks = Math.round(
    (getRaceStart(after).getTime() - getRaceStart(race).getTime()) / (7 * DAY),
  );
  const { locality, country } = after.Circuit.Location;

  return (
    <Card as="section" aria-labelledby="up-next">
      <div className="flex items-center justify-between gap-3">
        <h2 id="up-next">
          <Label>Up next after this</Label>
        </h2>
        <InlineLink href="/calendar">Calendar</InlineLink>
      </div>
      <Link
        href={raceHref(after, races)}
        className="group flex items-end justify-between gap-3"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="font-mono text-[11px] text-muted">
            R{after.round} · {formatRaceDay(after)}
            {isSprintWeekend(after) && " · SPRINT"}
          </span>
          <span className="display-title text-[26px] group-hover:underline">
            {after.raceName}
          </span>
          <span className="text-xs text-muted">
            {locality} · {getCountryCode3ByName(country)}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end">
          <span className="big-number text-[34px] leading-none">+{weeks}</span>
          <span className="font-mono text-[10px] tracking-[0.14em] text-muted">
            {weeks === 1 ? "WEEK" : "WEEKS"}
          </span>
        </span>
      </Link>
      <p className="border-t border-line-soft pt-2 text-sm text-soft">
        {weeks <= 1
          ? `Back-to-back with the ${race.raceName}.`
          : `${weeks} weeks after the ${race.raceName}.`}
      </p>
    </Card>
  );
};

export const UpNextCardSkeleton = () => (
  <CardSkeleton lines={2} className="min-h-[159px]" />
);

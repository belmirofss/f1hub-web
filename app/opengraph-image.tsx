import { connection } from "next/server";
import { getSeasonSchedule } from "@/lib/api/jolpica";
import type { Race } from "@/lib/api/types";
import { getCircuitTimezone } from "@/lib/domain/circuits";
import { getCountryCode3ByName } from "@/lib/domain/countries";
import {
  findNextRace,
  getRaceStart,
  getWeekendStart,
  isSprintWeekend,
} from "@/lib/domain/sessions";
import { formatDateRange } from "@/lib/domain/time";
import { orFallback } from "@/lib/metadata";
import {
  OG_COLORS,
  OG_CONTENT_TYPE,
  OG_SIZE,
  OgFrame,
  OgLabel,
  OgTitle,
  ogImage,
  ogMono,
} from "@/lib/og";
import { getRequestTime } from "@/lib/requestTime";

// The default card, for Home and every page without its own: the wordmark,
// then the next race and how far away it is

export const alt = "F1HUB: the next Formula 1 race and countdown";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const DAY = 24 * 60 * 60 * 1000;

// "RACE IN 12 DAYS", "RACE TOMORROW", "LIGHTS OUT TODAY"
const countdown = (start: number, now: number) => {
  const days = Math.floor((start - now) / DAY);
  if (days > 1) return `Race in ${days} days`;
  if (days === 1) return "Race tomorrow";
  return start > now ? "Lights out today" : "Racing now";
};

const NextRace = ({ race, now }: { race: Race; now: number }) => {
  // Dates at the track; without a start time only the UTC date is known
  const zone =
    (race.time && getCircuitTimezone(race.Circuit.circuitId)) || "UTC";
  const start = getRaceStart(race);
  const { Location } = race.Circuit;
  const meta = [
    `Next race · R${race.round}`,
    getCountryCode3ByName(Location.country),
    isSprintWeekend(race) && "Sprint",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 40,
        paddingTop: 18,
        borderTop: `3px solid ${OG_COLORS.text}`,
      }}
    >
      <div
        style={{ display: "flex", flexDirection: "column", flex: 1, gap: 8 }}
      >
        <OgLabel color={OG_COLORS.accentInk}>{meta}</OgLabel>
        <OgTitle size={64}>{race.raceName}</OgTitle>
        <div style={{ display: "flex", fontSize: 26, color: OG_COLORS.soft }}>
          {`${race.Circuit.circuitName} · ${Location.locality}`}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 10,
        }}
      >
        <div style={{ ...ogMono, display: "flex", fontSize: 40 }}>
          {formatDateRange(getWeekendStart(race), start, zone)}
        </div>
        <div
          style={{
            display: "flex",
            padding: "8px 14px",
            background: OG_COLORS.accent,
          }}
        >
          <OgLabel size={20} color={OG_COLORS.onAccent}>
            {countdown(start.getTime(), now)}
          </OgLabel>
        </div>
      </div>
    </div>
  );
};

export default async function Image() {
  // The next race depends on the time, so this renders per request; the
  // schedule is cached and the CDN keeps the PNG for the current tier
  await connection();
  const now = await getRequestTime();
  const races = await orFallback(getSeasonSchedule("current"));
  const race = races && findNextRace(races, now);

  return ogImage(
    <OgFrame
      kicker={races?.[0] ? `Formula 1 · ${races[0].season}` : "Formula 1"}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          gap: 8,
        }}
      >
        <OgTitle size={124}>Calendar, standings and results</OgTitle>
        <div style={{ display: "flex", fontSize: 30, color: OG_COLORS.soft }}>
          Live standings, lap charts, tyre strategy and team radio
        </div>
      </div>
      {race ? (
        <NextRace race={race} now={now} />
      ) : (
        races && (
          <OgLabel size={26} color={OG_COLORS.text}>
            Season complete · every race since 1950
          </OgLabel>
        )
      )}
    </OgFrame>,
    "current",
  );
}

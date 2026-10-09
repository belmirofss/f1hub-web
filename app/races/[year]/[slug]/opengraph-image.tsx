import { connection } from "next/server";
import { getCurrentSeason, getRaceResults } from "@/lib/api/jolpica";
import type { Race, Result } from "@/lib/api/types";
import { getCircuitTimezone } from "@/lib/domain/circuits";
import { getCountryCode3ByName } from "@/lib/domain/countries";
import { getStatusLabel } from "@/lib/domain/results";
import { formatRaceDay, getSessions } from "@/lib/domain/sessions";
import { getDriverName, getTeamColor } from "@/lib/domain/teams";
import { formatClock, formatDay, utcOffsetLabel } from "@/lib/domain/time";
import { orFallback } from "@/lib/metadata";
import {
  OG_COLORS,
  OG_CONTENT_TYPE,
  OG_SIZE,
  OgFrame,
  OgLabel,
  OgRow,
  OgTitle,
  ogImage,
} from "@/lib/og";
import { getRaceWeekend, getWeekendTabs } from "@/lib/raceWeekend";

// The race weekend's card, shared by all its tabs: the podium once there are
// results, the session times at the track until then

export const alt = "Race weekend: podium or session times";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const Podium = ({ results }: { results: Result[] }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    {results.slice(0, 3).map((result, index) => (
      <OgRow
        key={result.Driver.driverId}
        position={`P${index + 1}`}
        color={getTeamColor(result.Constructor.constructorId)}
        name={getDriverName(result.Driver)}
        detail={result.Constructor.name}
        value={result.Time?.time ?? getStatusLabel(result)}
        highlight={index === 0}
      />
    ))}
  </div>
);

const Sessions = ({ race }: { race: Race }) => {
  // Times at the track; without a start time only the UTC date is known
  const zone = getCircuitTimezone(race.Circuit.circuitId);
  const sessions = getSessions(race);
  const timed = zone && sessions.some((s) => s.hasTime);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <OgLabel size={18}>
        {timed
          ? `Sessions · track time (${utcOffsetLabel(zone, sessions[0].start)})`
          : "Sessions"}
      </OgLabel>
      <div style={{ display: "flex", gap: 12 }}>
        {sessions.map((session) => {
          const isRace = session.key === "race";
          const timeZone = (session.hasTime && zone) || "UTC";
          return (
            <div
              key={session.key}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                gap: 4,
                padding: "16px 20px",
                borderRadius: 12,
                border: `1px solid ${isRace ? OG_COLORS.accent : OG_COLORS.line}`,
                background: OG_COLORS.surface,
              }}
            >
              <OgLabel
                size={16}
                color={isRace ? OG_COLORS.accent : OG_COLORS.muted}
              >
                {session.short}
              </OgLabel>
              <div style={{ display: "flex", fontSize: 26, fontWeight: 700 }}>
                {formatDay(session.start, timeZone)}
              </div>
              <div
                style={{ display: "flex", fontFamily: "Mono", fontSize: 30 }}
              >
                {session.hasTime && zone
                  ? formatClock(session.start, true, zone)
                  : "TBC"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default async function Image({
  params,
}: {
  params: Promise<{ year: string; slug: string }>;
}) {
  await connection();
  const { year, slug } = await params;
  const { race } = await getRaceWeekend(year, slug);
  const [tabs, current] = await Promise.all([
    orFallback(getWeekendTabs(race)),
    orFallback(getCurrentSeason()),
  ]);
  const results = tabs?.results
    ? (await orFallback(getRaceResults(race.season, race.round)))?.Results
    : undefined;

  const { circuitName, Location } = race.Circuit;
  const country = getCountryCode3ByName(Location.country);

  return ogImage(
    <OgFrame
      kicker={[`R${race.round}`, race.season, country]
        .filter(Boolean)
        .join(" · ")}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <OgTitle>{race.raceName}</OgTitle>
        <div style={{ display: "flex", fontSize: 30, color: OG_COLORS.muted }}>
          {`${circuitName} · ${Location.locality} · ${formatRaceDay(race)}`}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "flex-end",
        }}
      >
        {results?.length ? (
          <Podium results={results} />
        ) : (
          <Sessions race={race} />
        )}
      </div>
    </OgFrame>,
    current && Number(race.season) < current ? "past" : "current",
  );
}

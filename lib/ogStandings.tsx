import "server-only";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  getConstructorStandings,
  getCurrentSeason,
  getDriverStandings,
  getSeasonSchedule,
  type SeasonParam,
} from "@/lib/api/jolpica";
import type {
  ConstructorStanding,
  DriverStanding,
  Standings,
} from "@/lib/api/types";
import { formatPoints } from "@/lib/domain/drivers";
import { isSeasonYear } from "@/lib/domain/routes";
import { getDriverName, getTeamColor } from "@/lib/domain/teams";
import { orFallback } from "@/lib/metadata";
import { OG_COLORS, OgFrame, OgLabel, OgRow, OgTitle, ogImage } from "@/lib/og";
import { FIRST_CONSTRUCTORS_SEASON } from "@/lib/season";

// The top 5 of a championship, for the Standings and Season cards

export const STANDINGS_ALT = "Championship standings: the top 5";

export const standingsImage = async (
  season: SeasonParam,
  type: "drivers" | "constructors",
) => {
  await connection();
  if (season !== "current" && !isSeasonYear(String(season))) notFound();

  const [standings, races, current] = await Promise.all([
    orFallback<Standings<DriverStanding | ConstructorStanding> | null>(
      type === "drivers"
        ? getDriverStandings(season)
        : getConstructorStandings(season),
    ),
    orFallback(getSeasonSchedule(season)),
    orFallback(getCurrentSeason()),
  ]);
  const year = season === "current" ? current : Number(season);

  const rows = (standings?.standings ?? []).slice(0, 5).map((row) =>
    "Driver" in row
      ? {
          id: row.Driver.driverId,
          position: row.position,
          name: getDriverName(row.Driver),
          team: row.Constructors.at(-1),
          points: row.points,
        }
      : {
          id: row.Constructor.constructorId,
          position: row.position,
          name: row.Constructor.name,
          team: row.Constructor,
          points: row.points,
        },
  );
  const over =
    !!year &&
    !!current &&
    (year < current || (!!races && Number(standings?.round) === races.length));
  const kicker = !standings
    ? "Standings"
    : over
      ? `Final standings · ${standings.season}`
      : `After round ${standings.round}${races ? ` of ${races.length}` : ""}`;

  return ogImage(
    <OgFrame kicker={kicker}>
      <OgTitle size={56}>
        {`${year ?? ""} ${type === "drivers" ? "Drivers'" : "Constructors'"} standings`.trim()}
      </OgTitle>
      {rows.length ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            gap: 8,
          }}
        >
          {rows.map((row, index) => (
            <OgRow
              key={row.id}
              compact
              position={row.position ? `P${row.position}` : "–"}
              color={getTeamColor(row.team?.constructorId)}
              name={row.name}
              detail={type === "drivers" ? row.team?.name : undefined}
              value={`${formatPoints(Number(row.points))} pts`}
              highlight={index === 0}
            />
          ))}
        </div>
      ) : (
        <OgLabel size={26} color={OG_COLORS.text}>
          {type === "constructors" && year && year < FIRST_CONSTRUCTORS_SEASON
            ? `The constructors' title started in ${FIRST_CONSTRUCTORS_SEASON}`
            : "No results yet"}
        </OgLabel>
      )}
    </OgFrame>,
    year && current && year < current ? "past" : "current",
  );
};

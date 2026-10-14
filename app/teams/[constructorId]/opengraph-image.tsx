import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  getConstructor,
  getConstructorSeasons,
  getConstructorTitles,
  getConstructorWins,
  getCurrentSeason,
  getDriverStandings,
} from "@/lib/api/jolpica";
import { getCountryCode3ByNationality } from "@/lib/domain/countries";
import { formatPoints } from "@/lib/domain/drivers";
import { getDriverName, getTeamColor, getTeamHero } from "@/lib/domain/teams";
import { orFallback } from "@/lib/metadata";
import {
  OG_CONTENT_TYPE,
  OG_SIZE,
  OgLabel,
  OgPosterFrame,
  OgRow,
  OgRows,
  OgStats,
  ogImage,
  type OgStat,
} from "@/lib/og";

// The team's card: the Livery Poster block in its colour, then the all-time
// stats and the drivers of its latest season

export const alt = "Team card: titles, wins and current drivers";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ constructorId: string }>;
}) {
  await connection();
  const constructorId = decodeURIComponent((await params).constructorId);
  const team = /^[a-z0-9_-]+$/.test(constructorId)
    ? await getConstructor(constructorId)
    : null;
  if (!team) notFound();

  const [seasons, current, titleSeasons] = await Promise.all([
    orFallback(getConstructorSeasons(constructorId)),
    orFallback(getCurrentSeason()),
    getConstructorTitles(constructorId),
  ]);
  const latest = seasons?.at(-1);
  const [wins, standings] = await Promise.all([
    seasons ? orFallback(getConstructorWins(constructorId, seasons)) : null,
    latest ? orFallback(getDriverStandings(latest)) : null,
  ]);
  // The latest season's two best placed drivers, as on the Drivers card
  const drivers = (standings?.standings ?? [])
    .filter((s) =>
      s.Constructors.some((c) => c.constructorId === constructorId),
    )
    .slice(0, 2);

  const titles = titleSeasons.length;
  const stats: OgStat[] = [
    { label: "Titles", value: titles },
    ...(wins != null ? [{ label: "Wins", value: wins }] : []),
    ...(seasons ? [{ label: "Seasons", value: seasons.length }] : []),
  ];

  const meta = [
    getCountryCode3ByNationality(team.nationality),
    seasons?.[0] && `Since ${seasons[0]}`,
    titles > 0 && `${titles > 1 ? `${titles}× ` : ""}Constructors' champion`,
  ]
    .filter(Boolean)
    .join(" · ");

  return ogImage(
    <OgPosterFrame
      hero={getTeamHero(constructorId)}
      kicker={latest ? `Team · ${latest}` : "Team"}
      headline={team.name}
      meta={meta}
    >
      <div style={{ display: "flex", width: 440 }}>
        <OgStats label="All time" stats={stats} />
      </div>
      {drivers.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            gap: 12,
          }}
        >
          <OgLabel size={16}>{`Drivers · ${latest}`}</OgLabel>
          <OgRows>
            {drivers.map((standing) => (
              <OgRow
                key={standing.Driver.driverId}
                compact
                position={standing.position ? `P${standing.position}` : "–"}
                color={getTeamColor(constructorId)}
                name={getDriverName(standing.Driver)}
                value={`${formatPoints(Number(standing.points))} pts`}
              />
            ))}
          </OgRows>
        </div>
      )}
    </OgPosterFrame>,
    latest && Number(latest) === current ? "current" : "lists",
  );
}

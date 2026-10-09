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
import { formatPoints } from "@/lib/domain/drivers";
import { getDriverName, getTeamColor } from "@/lib/domain/teams";
import { orFallback } from "@/lib/metadata";
import {
  OG_COLORS,
  OG_CONTENT_TYPE,
  OG_SIZE,
  OgFrame,
  OgLabel,
  OgRow,
  OgStats,
  OgTeamBar,
  OgTitle,
  ogImage,
  type OgStat,
} from "@/lib/og";

// The team's card: the name beside its colour, titles and all-time stats,
// and the drivers of its latest season

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
  const color = getTeamColor(constructorId);
  const stats: OgStat[] = [
    { label: "Titles", value: titles },
    ...(wins != null ? [{ label: "Wins", value: wins }] : []),
    ...(seasons ? [{ label: "Seasons", value: seasons.length }] : []),
  ];

  return ogImage(
    <OgFrame kicker={latest ? `Team · ${latest}` : "Team"} accent={color}>
      <div style={{ display: "flex", alignItems: "stretch", gap: 28 }}>
        <OgTeamBar color={color} height={150} width={12} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <OgTitle size={96}>{team.name}</OgTitle>
          <div style={{ display: "flex", gap: 24 }}>
            <OgLabel>
              {[team.nationality, seasons?.[0] && `since ${seasons[0]}`]
                .filter(Boolean)
                .join(" · ")}
            </OgLabel>
            {titles > 0 && (
              <OgLabel color={OG_COLORS.sprint}>
                {`${titles > 1 ? `${titles}× ` : ""}Constructors' champion`}
              </OgLabel>
            )}
          </div>
        </div>
      </div>
      <div
        style={{ display: "flex", flex: 1, alignItems: "flex-end", gap: 28 }}
      >
        <div style={{ display: "flex", width: 400 }}>
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
            <OgLabel size={18}>{`Drivers · ${latest}`}</OgLabel>
            {drivers.map((standing) => (
              <OgRow
                key={standing.Driver.driverId}
                position={standing.position ? `P${standing.position}` : "–"}
                color={color}
                name={getDriverName(standing.Driver)}
                value={`${formatPoints(Number(standing.points))} pts`}
              />
            ))}
          </div>
        )}
      </div>
    </OgFrame>,
    latest && Number(latest) === current ? "current" : "lists",
  );
}

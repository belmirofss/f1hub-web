import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  getCurrentSeason,
  getDriver,
  getDriverCareer,
  getDriverSeasonStanding,
} from "@/lib/api/jolpica";
import { formatPoints, getTitleSeasons, ordinal } from "@/lib/domain/drivers";
import { getDriverCode, getTeamColor } from "@/lib/domain/teams";
import { orFallback } from "@/lib/metadata";
import {
  OG_COLORS,
  OG_CONTENT_TYPE,
  OG_SIZE,
  OgFrame,
  OgLabel,
  OgStats,
  OgTeamBar,
  OgTitle,
  ogImage,
} from "@/lib/og";

// The driver's card: the hero in the team's colour, then the latest season
// and the whole career, like the Stats card

export const alt = "Driver card: team, season and career stats";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ driverId: string }>;
}) {
  await connection();
  const driverId = decodeURIComponent((await params).driverId);
  const driver = /^[a-z0-9_-]+$/.test(driverId)
    ? await getDriver(driverId)
    : null;
  if (!driver) notFound();

  const [career, current] = await Promise.all([
    orFallback(getDriverCareer(driverId)),
    orFallback(getCurrentSeason()),
  ]);
  const latest = career?.seasons.at(-1);
  // Points and wins from the standings, as on the page: they include sprints
  const standing =
    latest &&
    (await orFallback(getDriverSeasonStanding(latest.season, driverId)));
  const position = Number(standing?.position);
  const titles = getTitleSeasons(driverId).length;
  const color = getTeamColor(latest?.team.constructorId);
  const racing = !!latest && Number(latest.season) === current;

  return ogImage(
    <OgFrame
      kicker={latest ? `Driver · ${latest.season}` : "Driver"}
      accent={color}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <OgTeamBar color={color} height={150} width={12} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 132,
            height: 132,
            flexShrink: 0,
            borderRadius: 66,
            border: `2px solid ${OG_COLORS.line}`,
            background: OG_COLORS.raised,
            fontFamily: "Mono",
            fontSize: 36,
            color,
          }}
        >
          {getDriverCode(driver)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div
            style={{
              display: "flex",
              fontSize: 34,
              fontWeight: 600,
              color: OG_COLORS.muted,
            }}
          >
            {driver.givenName}
          </div>
          <OgTitle size={96}>{driver.familyName}</OgTitle>
          <div style={{ display: "flex", gap: 24, marginTop: 6 }}>
            <OgLabel>
              {[driver.nationality, latest?.team.name]
                .filter(Boolean)
                .join(" · ")}
            </OgLabel>
            {titles > 0 && (
              <OgLabel color={OG_COLORS.sprint}>
                {`${titles > 1 ? `${titles}× ` : ""}World champion`}
              </OgLabel>
            )}
          </div>
        </div>
      </div>
      {career && (
        <div
          style={{ display: "flex", flex: 1, alignItems: "flex-end", gap: 28 }}
        >
          {latest && (
            <OgStats
              label={`${latest.season} season`}
              stats={[
                { label: "Pos", value: position > 0 ? ordinal(position) : "–" },
                {
                  label: "Pts",
                  value: formatPoints(
                    standing ? Number(standing.points) : latest.points,
                  ),
                },
                {
                  label: "Wins",
                  value: standing ? Number(standing.wins) : latest.wins,
                },
                { label: "Podiums", value: latest.podiums },
              ]}
            />
          )}
          <OgStats
            label="Career"
            stats={[
              { label: "Starts", value: career.starts },
              { label: "Wins", value: career.wins },
              { label: "Podiums", value: career.podiums },
              { label: "Poles", value: career.poles },
            ]}
          />
        </div>
      )}
    </OgFrame>,
    racing ? "current" : "lists",
  );
}

import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  getCurrentSeason,
  getDriver,
  getDriverCareer,
  getDriverSeasonStanding,
  getTitleSeasons,
} from "@/lib/api/jolpica";
import { getCountryCode3ByNationality } from "@/lib/domain/countries";
import {
  formatPoints,
  formerCareerStats,
  ordinal,
  seasonSpan,
} from "@/lib/domain/drivers";
import { getTeamHero } from "@/lib/domain/teams";
import { orFallback } from "@/lib/metadata";
import {
  OG_CONTENT_TYPE,
  OG_SIZE,
  OgPosterFrame,
  OgStats,
  ogImage,
} from "@/lib/og";

// The driver's card: the Livery Poster block in the team's colour, then the
// latest season and the whole career, like the page's stat rail. A former
// driver's card is in the colour of the team they raced for most, with the
// whole career only.

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

  const [career, current, titleSeasons] = await Promise.all([
    orFallback(getDriverCareer(driverId)),
    orFallback(getCurrentSeason()),
    getTitleSeasons(driverId),
  ]);
  const latest = career?.seasons.at(-1);
  const former = career && !career.onGrid;
  // Points and wins from the standings, as on the page: they include sprints
  const standing =
    latest && !former
      ? await orFallback(getDriverSeasonStanding(latest.season, driverId))
      : null;
  const position = Number(standing?.position);
  const titles = titleSeasons.length;
  const racing = !!latest && Number(latest.season) === current;
  const team = former ? career.mainTeam : latest?.team;

  const meta = [
    !former && latest?.team.name,
    getCountryCode3ByNationality(driver.nationality),
    titles > 0 && `${titles > 1 ? `${titles}× ` : ""}World champion`,
  ]
    .filter(Boolean)
    .join(" · ");

  return ogImage(
    <OgPosterFrame
      hero={getTeamHero(team?.constructorId)}
      kicker={
        former
          ? `Driver · ${seasonSpan(career.seasons)}`
          : latest
            ? `Driver · ${latest.season}`
            : "Driver"
      }
      overline={driver.givenName}
      headline={driver.familyName}
      meta={meta}
      number={driver.permanentNumber}
    >
      {former ? (
        <OgStats
          label="Career"
          stats={formerCareerStats(career, titles)}
          size={52}
        />
      ) : (
        career && (
          <div style={{ display: "flex", flex: 1, gap: 40 }}>
            {latest && (
              <OgStats
                label={`${latest.season} season`}
                stats={[
                  {
                    label: "Pos",
                    value: position > 0 ? ordinal(position) : "–",
                  },
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
        )
      )}
    </OgPosterFrame>,
    racing ? "current" : "lists",
  );
}

import "server-only";
import type { MetadataRoute } from "next";
import {
  getAllCircuits,
  getAllConstructors,
  getAllDrivers,
  getAllRaces,
  getCurrentSeason,
  getRoundsWithResults,
} from "@/lib/api/jolpica";
import type { RaceBase } from "@/lib/api/types";
import {
  circuitHref,
  driverHref,
  FIRST_CONSTRUCTORS_SEASON,
  raceHref,
  seasonHref,
  teamHref,
} from "@/lib/domain/routes";
import { SITE_URL } from "@/lib/metadata";

// The sitemaps behind /sitemap.xml, one per kind of page. Each is built from
// the cached full lists, so the races come from one paged list instead of a
// request per season.

export const SITEMAP_IDS = [
  "pages",
  "seasons",
  "races",
  "drivers",
  "teams",
  "circuits",
] as const;

export type SitemapId = (typeof SITEMAP_IDS)[number];

// "/sitemaps/sitemap/races.xml", from app/sitemaps/sitemap.ts
export const sitemapUrl = (id: SitemapId) =>
  `${SITE_URL}/sitemaps/sitemap/${id}.xml`;

type Entry = MetadataRoute.Sitemap[number];

const entry = (path: string, fields?: Omit<Entry, "url">): Entry => ({
  url: `${SITE_URL}${path}`,
  ...fields,
});

// The current season (and next year's, once its calendar is out) changes
// every race weekend, so it gets no lastModified
const changing: Omit<Entry, "url"> = { changeFrequency: "daily" };

const STATIC_PAGES = [
  "/",
  "/calendar",
  "/standings",
  "/standings/constructors",
  "/standings/teammates",
  "/archive",
];

// Every race grouped by season, oldest first, for slugs and season dates
const getRacesBySeason = async () => {
  const bySeason = new Map<string, RaceBase[]>();
  (await getAllRaces()).forEach((race) => {
    const races = bySeason.get(race.season) ?? [];
    races.push(race);
    bySeason.set(race.season, races);
  });
  return bySeason;
};

const seasonPages = async (): Promise<Entry[]> => {
  const [bySeason, current] = await Promise.all([
    getRacesBySeason(),
    getCurrentSeason(),
  ]);
  return [...bySeason].flatMap(([season, races]) => {
    const base = seasonHref(season);
    const paths = [base, `${base}/races`, `${base}/teammates`];
    if (Number(season) >= FIRST_CONSTRUCTORS_SEASON) {
      paths.push(`${base}/constructors`);
    }
    // A finished season last changed on its final race day
    const fields =
      Number(season) < current
        ? {
            lastModified: races.at(-1)?.date,
            changeFrequency: "yearly" as const,
          }
        : changing;
    return paths.map((path) => entry(path, fields));
  });
};

const racePages = async (): Promise<Entry[]> => {
  const [bySeason, current] = await Promise.all([
    getRacesBySeason(),
    getCurrentSeason(),
  ]);
  const finished = new Set((await getRoundsWithResults(current)).race);

  return [...bySeason.values()].flatMap((races) =>
    races.map((race) => {
      const season = Number(race.season);
      const done =
        season < current || (season === current && finished.has(race.round));
      return entry(
        raceHref(race, races),
        done
          ? {
              lastModified: race.date,
              changeFrequency: season < current ? "yearly" : "weekly",
            }
          : changing,
      );
    }),
  );
};

export const getSitemap = async (id: SitemapId): Promise<Entry[]> => {
  switch (id) {
    case "pages":
      return STATIC_PAGES.map((path) => entry(path, changing));
    case "seasons":
      return seasonPages();
    case "races":
      return racePages();
    case "drivers":
      return (await getAllDrivers()).map((d) => entry(driverHref(d.driverId)));
    case "teams":
      return (await getAllConstructors()).map((c) =>
        entry(teamHref(c.constructorId)),
      );
    case "circuits":
      return (await getAllCircuits()).map((c) =>
        entry(circuitHref(c.circuitId)),
      );
  }
};

import type { Circuit, Constructor, Driver, Race } from "@/lib/api/types";
import { getCountryNameByNationality } from "@/lib/domain/countries";
import {
  circuitHref,
  driverHref,
  seasonHref,
  teamHref,
} from "@/lib/domain/routes";
import { getSessions } from "@/lib/domain/sessions";
import { getDriverName } from "@/lib/domain/teams";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/metadata";

// schema.org JSON-LD for components/seo/JsonLd. URLs are absolute and point
// at production, like the canonical URLs.

export type JsonLdData = Record<string, unknown>;

const CONTEXT = "https://schema.org";

const absolute = (path: string) => `${SITE_URL}${path}`;

// The API links Wikipedia over http. Undefined values drop out of the JSON.
const wikipedia = (url: string) => url.replace(/^http:/, "https:") || undefined;

const SPORT = "Formula 1";

// Home: the site and its search, for the sitelinks search box
export const websiteLd = (): JsonLdData => ({
  "@context": CONTEXT,
  "@type": "WebSite",
  name: SITE_NAME,
  url: absolute("/"),
  description: SITE_DESCRIPTION,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: absolute("/search?q={search_term_string}"),
    },
    "query-input": "required name=search_term_string",
  },
});

type Crumb = { name: string; path: string };

export const breadcrumbLd = (crumbs: Crumb[]): JsonLdData => ({
  "@context": CONTEXT,
  "@type": "BreadcrumbList",
  itemListElement: [{ name: SITE_NAME, path: "/" }, ...crumbs].map(
    (crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absolute(crumb.path),
    }),
  ),
});

// Home › 2026 season, the start of a season's or race's trail
export const seasonCrumbs = (season: string): Crumb[] => [
  { name: "Archive", path: "/archive" },
  { name: `${season} season`, path: seasonHref(season) },
];

const circuitPlace = (circuit: Circuit) => ({
  "@type": "Place",
  name: circuit.circuitName,
  address: {
    "@type": "PostalAddress",
    addressLocality: circuit.Location.locality,
    addressCountry: circuit.Location.country,
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: Number(circuit.Location.lat),
    longitude: Number(circuit.Location.long),
  },
});

export const circuitLd = (circuit: Circuit): JsonLdData => {
  const path = circuitHref(circuit.circuitId);
  return {
    "@context": CONTEXT,
    ...circuitPlace(circuit),
    url: absolute(path),
    image: absolute(`${path}/opengraph-image`),
    sameAs: wikipedia(circuit.url),
  };
};

// A full date-time when the session has a start time, the day otherwise
// (most races before 2005)
const sessionStart = ({ start, hasTime }: { start: Date; hasTime: boolean }) =>
  hasTime ? start.toISOString() : start.toISOString().slice(0, 10);

// The weekend, from its first session to race day
export const raceEventLd = (
  race: Race,
  href: string,
  description?: string,
): JsonLdData => {
  const [first] = getSessions(race);
  return {
    "@context": CONTEXT,
    "@type": "SportsEvent",
    name: `${race.raceName} ${race.season}`,
    sport: SPORT,
    url: absolute(href),
    image: absolute(`${href}/opengraph-image`),
    ...(description && { description }),
    startDate: first ? sessionStart(first) : race.date,
    endDate: race.date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: circuitPlace(race.Circuit),
    organizer: {
      "@type": "Organization",
      name: "Fédération Internationale de l'Automobile",
      url: "https://www.fia.com",
    },
    sameAs: wikipedia(race.url),
  };
};

export const driverLd = (driver: Driver): JsonLdData => {
  const path = driverHref(driver.driverId);
  const country = getCountryNameByNationality(driver.nationality);
  return {
    "@context": CONTEXT,
    "@type": "Person",
    name: getDriverName(driver),
    givenName: driver.givenName,
    familyName: driver.familyName,
    birthDate: driver.dateOfBirth,
    ...(country && { nationality: { "@type": "Country", name: country } }),
    jobTitle: "Racing driver",
    url: absolute(path),
    image: absolute(`${path}/opengraph-image`),
    sameAs: wikipedia(driver.url),
  };
};

export const teamLd = (team: Constructor): JsonLdData => {
  const path = teamHref(team.constructorId);
  return {
    "@context": CONTEXT,
    "@type": "SportsTeam",
    name: team.name,
    sport: SPORT,
    url: absolute(path),
    image: absolute(`${path}/opengraph-image`),
    sameAs: wikipedia(team.url),
  };
};

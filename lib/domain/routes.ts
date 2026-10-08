// URLs for the app's screens. Races use slugs ("/races/2026/singapore-grand-prix")
// resolved through the season schedule; a season with two races of the same
// name gets the round appended to both ("british-grand-prix-5").
import type { RaceBase } from "@/lib/api/types";

export const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

type RaceRef = Pick<RaceBase, "round" | "raceName">;

// `seasonRaces` is the whole schedule, to spot repeated names
export const getRaceSlug = (race: RaceRef, seasonRaces: RaceRef[]) => {
  const slug = slugify(race.raceName);
  const repeated = seasonRaces.some(
    (other) => other.round !== race.round && slugify(other.raceName) === slug,
  );
  return repeated ? `${slug}-${race.round}` : slug;
};

export const findRaceBySlug = <R extends RaceRef>(races: R[], slug: string) =>
  races.find((race) => getRaceSlug(race, races) === slug);

export const raceHref = (
  race: RaceRef & Pick<RaceBase, "season">,
  seasonRaces: RaceRef[],
) => `/races/${race.season}/${getRaceSlug(race, seasonRaces)}`;

export const driverHref = (driverId: string) => `/drivers/${driverId}`;

export const teamHref = (constructorId: string) => `/teams/${constructorId}`;

export const circuitHref = (circuitId: string) => `/circuits/${circuitId}`;

export const seasonHref = (season: string | number) => `/seasons/${season}`;

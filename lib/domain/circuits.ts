// Ported from the app's src/helpers/circuits.ts.
import type { Driver, RaceResults } from "@/lib/api/types";
import { lapTimeToMs } from "./results";

// The API has no time zone for circuits, so map the ones on recent calendars.
const CIRCUIT_TIMEZONES: Record<string, string> = {
  albert_park: "Australia/Melbourne",
  shanghai: "Asia/Shanghai",
  suzuka: "Asia/Tokyo",
  bahrain: "Asia/Bahrain",
  jeddah: "Asia/Riyadh",
  miami: "America/New_York",
  imola: "Europe/Rome",
  monaco: "Europe/Monaco",
  villeneuve: "America/Toronto",
  catalunya: "Europe/Madrid",
  madring: "Europe/Madrid",
  red_bull_ring: "Europe/Vienna",
  silverstone: "Europe/London",
  spa: "Europe/Brussels",
  hungaroring: "Europe/Budapest",
  zandvoort: "Europe/Amsterdam",
  monza: "Europe/Rome",
  baku: "Asia/Baku",
  marina_bay: "Asia/Singapore",
  americas: "America/Chicago",
  rodriguez: "America/Mexico_City",
  interlagos: "America/Sao_Paulo",
  vegas: "America/Los_Angeles",
  losail: "Asia/Qatar",
  yas_marina: "Asia/Dubai",
  portimao: "Europe/Lisbon",
  istanbul: "Europe/Istanbul",
  sochi: "Europe/Moscow",
  ricard: "Europe/Paris",
  nurburgring: "Europe/Berlin",
  hockenheimring: "Europe/Berlin",
  mugello: "Europe/Rome",
  sepang: "Asia/Kuala_Lumpur",
  yeongam: "Asia/Seoul",
  buddh: "Asia/Kolkata",
};

export const getCircuitTimezone = (circuitId: string) =>
  CIRCUIT_TIMEZONES[circuitId];

// Current layouts of circuits on recent calendars: lap length (km) and corners
const CIRCUIT_LAYOUTS: Record<string, { length: number; corners: number }> = {
  albert_park: { length: 5.278, corners: 14 },
  americas: { length: 5.513, corners: 20 },
  bahrain: { length: 5.412, corners: 15 },
  baku: { length: 6.003, corners: 20 },
  catalunya: { length: 4.657, corners: 14 },
  hungaroring: { length: 4.381, corners: 14 },
  imola: { length: 4.909, corners: 19 },
  interlagos: { length: 4.309, corners: 15 },
  jeddah: { length: 6.174, corners: 27 },
  losail: { length: 5.419, corners: 16 },
  madring: { length: 5.474, corners: 22 },
  marina_bay: { length: 4.94, corners: 19 },
  miami: { length: 5.412, corners: 19 },
  monaco: { length: 3.337, corners: 19 },
  monza: { length: 5.793, corners: 11 },
  red_bull_ring: { length: 4.318, corners: 10 },
  rodriguez: { length: 4.304, corners: 17 },
  sepang: { length: 5.543, corners: 15 },
  shanghai: { length: 5.451, corners: 16 },
  silverstone: { length: 5.891, corners: 18 },
  spa: { length: 7.004, corners: 19 },
  suzuka: { length: 5.807, corners: 18 },
  vegas: { length: 6.201, corners: 17 },
  villeneuve: { length: 4.361, corners: 14 },
  yas_marina: { length: 5.281, corners: 16 },
  zandvoort: { length: 4.259, corners: 14 },
};

export const getCircuitLayout = (circuitId: string) =>
  CIRCUIT_LAYOUTS[circuitId];

// Races that run under floodlights, for the calendar's Night races filter
// and the circuit page's tags. Abu Dhabi starts at dusk and finishes in the
// dark, so it counts.
const NIGHT_RACES = new Set([
  "bahrain",
  "jeddah",
  "marina_bay",
  "vegas",
  "losail",
  "yas_marina",
]);

export const isNightRace = (circuitId: string) => NIGHT_RACES.has(circuitId);

// Circuits on public roads closed for the weekend, including the park and
// island ones (Albert Park, Villeneuve) and Miami's around the stadium
const STREET_CIRCUITS = new Set([
  "albert_park",
  "baku",
  "jeddah",
  "madring",
  "marina_bay",
  "miami",
  "monaco",
  "vegas",
  "villeneuve",
]);

// Which way the cars go round. Suzuka's figure of eight goes both ways, and
// circuits missing here just get no tag.
const ANTICLOCKWISE = new Set([
  "americas",
  "baku",
  "imola",
  "interlagos",
  "istanbul",
  "jeddah",
  "marina_bay",
  "miami",
  "vegas",
  "yas_marina",
  "yeongam",
]);
const CLOCKWISE = new Set([
  "albert_park",
  "bahrain",
  "buddh",
  "catalunya",
  "hockenheimring",
  "hungaroring",
  "losail",
  "monaco",
  "monza",
  "mugello",
  "nurburgring",
  "portimao",
  "red_bull_ring",
  "ricard",
  "rodriguez",
  "sepang",
  "shanghai",
  "silverstone",
  "sochi",
  "spa",
  "villeneuve",
  "zandvoort",
]);

// The circuit page's tags: "Street circuit", "Night race", "Anticlockwise".
// Only what we know, so an unlisted circuit has none.
export const getCircuitTags = (circuitId: string) =>
  [
    STREET_CIRCUITS.has(circuitId) && "Street circuit",
    isNightRace(circuitId) && "Night race",
    CLOCKWISE.has(circuitId) && "Clockwise",
    ANTICLOCKWISE.has(circuitId) && "Anticlockwise",
  ].filter((tag) => typeof tag === "string");

// The scheduled distance. A race cut short by rain or the time limit
// (Singapore 2022 ran 59 of 62 laps) shouldn't set it, so the longer of the
// last two races counts.
const getLaps = (races: RaceResults[]) =>
  Math.max(
    0,
    ...races.slice(-2).map((race) => Number(race.Results?.[0]?.laps ?? 0)),
  );

export type CircuitFact = {
  key: "length" | "laps" | "distance" | "turns" | "first" | "races";
  label: string;
  value: string | number;
  unit?: string;
};

// Lap length, laps, race distance, turns, first race and races held, from
// every race held at the circuit (oldest first). The layout numbers only
// exist for circuits on recent calendars.
export const getCircuitFacts = (
  circuitId: string,
  races: RaceResults[],
): CircuitFact[] => {
  const layout = getCircuitLayout(circuitId);
  const laps = getLaps(races);
  const facts: (CircuitFact | false | undefined)[] = [
    layout && {
      key: "length",
      label: "Lap length",
      value: layout.length.toFixed(3),
      unit: "km",
    },
    laps > 0 && { key: "laps", label: "Laps", value: laps },
    layout &&
      laps > 0 && {
        key: "distance",
        label: "Race distance",
        value: (layout.length * laps).toFixed(1),
        unit: "km",
      },
    layout && { key: "turns", label: "Turns", value: layout.corners },
    races[0] && { key: "first", label: "First race", value: races[0].season },
    { key: "races", label: "Races held", value: races.length },
  ];
  return facts.filter((fact) => !!fact);
};

// The drivers who won at a circuit, most wins first
export const getWinsByDriver = (races: RaceResults[]) => {
  const byDriver = new Map<string, { driver: Driver; wins: number }>();
  races.forEach((race) => {
    const winner = race.Results?.[0]?.Driver;
    if (!winner) return;
    const entry = byDriver.get(winner.driverId) ?? { driver: winner, wins: 0 };
    entry.wins++;
    byDriver.set(winner.driverId, entry);
  });
  return [...byDriver.values()].sort((a, b) => b.wins - a.wins);
};

// The quickest race lap ever set at a circuit, from each race's fastest lap
export const getLapRecord = (fastestLaps: RaceResults[]) =>
  fastestLaps
    .flatMap((race) => {
      const result = race.Results?.[0];
      const ms = lapTimeToMs(result?.FastestLap?.Time.time);
      return result && ms ? [{ race, result, ms }] : [];
    })
    .sort((a, b) => a.ms - b.ms)[0];

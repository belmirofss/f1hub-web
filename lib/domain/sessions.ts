// Ported from the app's src/helpers/sessions.ts. Session starts are Dates
// (moment objects in the app).
import type { Race, RaceResults, Result, SessionTime } from "@/lib/api/types";
import { getCircuitTimezone } from "./circuits";
import { HOUR, formatShortDate, toDate } from "./time";

export type SessionKey =
  "fp1" | "fp2" | "fp3" | "sprintQualifying" | "sprint" | "qualifying" | "race";

export type Session = {
  key: SessionKey;
  name: string;
  short: string;
  start: Date;
  hasTime: boolean;
};

const SESSION_FIELDS: {
  key: SessionKey;
  name: string;
  short: string;
  pick: (race: Race) => SessionTime | undefined;
}[] = [
  {
    key: "fp1",
    name: "Practice 1",
    short: "FP1",
    pick: (r) => r.FirstPractice,
  },
  {
    key: "fp2",
    name: "Practice 2",
    short: "FP2",
    pick: (r) => r.SecondPractice,
  },
  {
    key: "fp3",
    name: "Practice 3",
    short: "FP3",
    pick: (r) => r.ThirdPractice,
  },
  {
    key: "sprintQualifying",
    name: "Sprint Qualifying",
    short: "SQ",
    pick: (r) => r.SprintQualifying ?? r.SprintShootout,
  },
  { key: "sprint", name: "Sprint", short: "SPRINT", pick: (r) => r.Sprint },
  {
    key: "qualifying",
    name: "Qualifying",
    short: "QUALI",
    pick: (r) => r.Qualifying,
  },
  { key: "race", name: "Race", short: "RACE", pick: (r) => r },
];

export const getSessions = (race: Race): Session[] =>
  SESSION_FIELDS.flatMap(({ key, name, short, pick }) => {
    const value = pick(race);
    if (!value?.date) return [];
    return [
      {
        key,
        name,
        short,
        start: toDate(value.date, value.time),
        hasTime: !!value.time,
      },
    ];
  }).sort((a, b) => a.start.getTime() - b.start.getTime());

export const getRaceStart = (race: Race) => toDate(race.date, race.time);

// "11 OCT", the race day at the track, so the server can render it. Without
// a start time only the UTC date is known.
export const formatRaceDay = (race: Race) => {
  const zone = race.time && getCircuitTimezone(race.Circuit.circuitId);
  return formatShortDate(getRaceStart(race), zone || "UTC");
};

export const getWeekendStart = (race: Race) => {
  const sessions = getSessions(race);
  return sessions[0]?.start ?? getRaceStart(race);
};

export const isSprintWeekend = (race: Race) => !!race.Sprint;

// Races in a season whose start is still ahead (with a 3h buffer so a race
// stays "next" while it's running).
export const findNextRace = (races: Race[], now: number) =>
  races.find((race) => getRaceStart(race).getTime() + 3 * HOUR > now);

export const findNextSession = (races: Race[], now: number) => {
  for (const race of races) {
    const session = getSessions(race).find((s) => s.start.getTime() > now);
    if (session) return { race, session };
  }
};

export type RoundState = {
  race: Race;
  winner?: Result;
  isNext: boolean;
  isPast: boolean;
};

// A race is done once it has a winner or started over 3 hours ago (results
// can take a while to reach the API). The first one that isn't is next.
export const getRoundStates = (
  races: Race[],
  winners: RaceResults[],
  now: number,
): RoundState[] => {
  const winnerByRound = new Map(
    winners.map((race) => [race.round, race.Results?.[0]]),
  );
  let nextFound = false;
  return races.map((race) => {
    const winner = winnerByRound.get(race.round);
    const isPast = !!winner || getRaceStart(race).getTime() + 3 * HOUR < now;
    const isNext = !isPast && !nextFound;
    if (isNext) nextFound = true;
    return { race, winner, isNext, isPast };
  });
};

// Ported from the app's src/helpers/sessions.ts. Session starts are Dates
// (moment objects in the app).
import type { Race, RaceResults, Result, SessionTime } from "@/lib/api/types";
import { getCircuitTimezone } from "./circuits";
import { HOUR, formatShortDate, startOfDay, toDate } from "./time";

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

// Scheduled length of each session, for the weekend timeline and to tell
// when one is live. Red flags can run them over; this is the plan.
const SESSION_MINUTES: Record<SessionKey, number> = {
  fp1: 60,
  fp2: 60,
  fp3: 60,
  sprintQualifying: 45,
  sprint: 60,
  qualifying: 60,
  race: 120,
};

export const getSessionEnd = (session: Pick<Session, "key" | "start">) =>
  session.start.getTime() + SESSION_MINUTES[session.key] * 60000;

// The weekend Home is about: the first race whose race hasn't finished. Once
// the chequered flag is out it moves on to the next one.
export const findWeekendRace = (races: Race[], now: number) =>
  races.find(
    (race) => getRaceStart(race).getTime() + SESSION_MINUTES.race * 60000 > now,
  );

export type WeekendState = {
  // Sessions over by now
  done: number;
  // Index of the session running now, or of the next one to start
  live?: number;
  next?: number;
};

// Where a weekend is at `now`, given its sessions in order
export const getWeekendState = (
  sessions: { start: number; end: number }[],
  now: number,
): WeekendState => {
  const done = sessions.filter((session) => session.end <= now).length;
  const live = sessions.findIndex(
    (session) => session.start <= now && now < session.end,
  );
  const next = sessions.findIndex((session) => session.start > now);
  return {
    done,
    live: live === -1 ? undefined : live,
    next: next === -1 ? undefined : next,
  };
};

const DAY = 24 * HOUR;

// The weekend's days in a time zone (the viewer's when left out), from
// midnight before the first session to midnight after the last
export const getWeekendSpan = (starts: number[], timeZone?: string) => {
  const first = startOfDay(starts[0], timeZone);
  // Past midday of the next day whatever the DST change, then back to midnight
  const end = startOfDay(
    startOfDay(starts[starts.length - 1], timeZone) + 36 * HOUR,
    timeZone,
  );
  return { first, end, days: Math.round((end - first) / DAY) };
};

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

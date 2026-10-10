// The moments that shaped a race, by lap: start incidents, safety cars,
// red flags and penalties from OpenF1's race control (2023+), plus
// retirements and the fastest lap from the results, which every season has.
import type { Driver, RaceControlMessage, Result } from "@/lib/api/types";
import { getFastestLap, isClassified } from "./results";

export type KeyLapKind =
  | "incident"
  | "safety-car"
  | "red-flag"
  | "penalty"
  | "retirement"
  | "fastest-lap";

export type KeyLap = {
  lap: number;
  kind: KeyLapKind;
  // "Safety car", "5s penalty for Alonso"
  title: string;
  // "Laps 23–26", "Causing a collision"
  detail?: string;
};

// "Hamilton", or the full name when two drivers share it (Michael and Ralf
// Schumacher)
const shortNames = (results: Result[]) => {
  const count = new Map<string, number>();
  results.forEach(({ Driver }) =>
    count.set(Driver.familyName, (count.get(Driver.familyName) ?? 0) + 1),
  );
  return (driver: Driver) =>
    (count.get(driver.familyName) ?? 0) > 1
      ? `${driver.givenName} ${driver.familyName}`
      : driver.familyName;
};

type NameOf = ReturnType<typeof shortNames>;

// "CAUSING A COLLISION" -> "Causing a collision"
const sentence = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

// Messages name cars as "CAR 14 (ALO)" or "CARS 2 (SAR) AND 23 (ALB)"
const CAR = /(\d+) \(([A-Z]{3})\)/g;

const carNames = (message: string, names: Map<number, string>) =>
  Array.from(
    message.matchAll(CAR),
    ([, number, code]) => names.get(Number(number)) ?? code,
  );

const join = (names: string[]) =>
  names.length > 1
    ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`
    : (names[0] ?? "");

// The reason after the dash: "... NOTED - CAUSING A COLLISION"
const reasonOf = (message: string) => {
  const reason = message.split(" - ").slice(1).join(" - ").trim();
  return reason ? sentence(reason) : undefined;
};

// Lap 1 incidents the stewards looked at. Race control posts them a minute
// or two later, so a turn 1 crash is often logged on lap 2. The same
// incident comes back as NOTED, UNDER INVESTIGATION, then a decision, so
// each is kept once.
const startIncidents = (
  messages: RaceControlMessage[],
  names: Map<number, string>,
): KeyLap[] => {
  const seen = new Set<string>();
  const laps: KeyLap[] = [];
  for (const m of messages) {
    if ((m.lap_number ?? 1) > 2 || !m.message.includes("INCIDENT")) continue;
    const cars = carNames(m.message, names);
    const key = cars.join();
    if (!cars.length || seen.has(key)) continue;
    seen.add(key);
    const turn = m.message.match(/TURN (\d+)/)?.[1];
    laps.push({
      lap: 1,
      kind: "incident",
      title: `Start incident: ${join(cars)}`,
      detail:
        [turn && `Turn ${turn}`, reasonOf(m.message)]
          .filter(Boolean)
          .join(" · ") || undefined,
    });
  }
  return laps;
};

// Each safety car and VSC from deployment to the lap it comes in
const safetyCars = (messages: RaceControlMessage[]): KeyLap[] => {
  const laps: KeyLap[] = [];
  let open: { lap: number; virtual: boolean } | null = null;

  const close = (end?: number) => {
    if (!open) return;
    const name = open.virtual ? "Virtual safety car" : "Safety car";
    laps.push({
      lap: open.lap,
      kind: "safety-car",
      title: name,
      detail:
        end === undefined
          ? undefined
          : end > open.lap
            ? `Laps ${open.lap}–${end}`
            : `Lap ${open.lap}`,
    });
    open = null;
  };

  for (const m of messages) {
    const deployed = m.message.match(/^(VIRTUAL )?SAFETY CAR DEPLOYED/);
    if (deployed) {
      close();
      open = { lap: m.lap_number ?? 1, virtual: !!deployed[1] };
    } else if (
      /^SAFETY CAR IN THIS LAP|^VIRTUAL SAFETY CAR ENDING/.test(m.message)
    ) {
      close(m.lap_number ?? undefined);
    }
  }
  close();
  return laps;
};

const redFlags = (messages: RaceControlMessage[]): KeyLap[] =>
  messages
    .filter((m) => m.flag === "RED")
    .map((m) => ({
      lap: m.lap_number ?? 1,
      kind: "red-flag",
      title: "Red flag",
      detail: "Race suspended",
    }));

// "5 SECOND TIME" -> "5s penalty", "DRIVE THROUGH" -> "Drive-through penalty"
const penaltyName = (what: string) => {
  const seconds = what.match(/^(\d+) SECOND (TIME|STOP\/GO)$/);
  if (seconds) {
    return `${seconds[1]}s ${seconds[2] === "TIME" ? "penalty" : "stop-go penalty"}`;
  }
  const grid = what.match(/^(\d+) PLACE GRID$/);
  if (grid) return `${grid[1]}-place grid penalty`;
  return `${sentence(what).replace("Drive through", "Drive-through")} penalty`;
};

// Penalties handed out, not the messages saying they were served
const penalties = (
  messages: RaceControlMessage[],
  names: Map<number, string>,
): KeyLap[] =>
  messages.flatMap((m) => {
    const match = m.message.match(
      /^FIA STEWARDS: (.+?) PENALTY FOR CAR (\d+) \(([A-Z]{3})\)(.*)$/,
    );
    if (!match || /SERVED/.test(match[4])) return [];
    const [, what, number, code] = match;
    return [
      {
        lap: m.lap_number ?? 1,
        kind: "penalty" as const,
        title: `${penaltyName(what)} for ${names.get(Number(number)) ?? code}`,
        detail: reasonOf(m.message),
      },
    ];
  });

// Finishers who were lapped still show "+1 Lap" or "Lapped"
const isFinishedStatus = (status: string) =>
  status === "Finished" || status === "Lapped" || /^\+\d+ Laps?$/.test(status);

// Drivers who stopped: out of the race, or classified after retiring late.
// Disqualified, non-starters and those not classified for distance are left
// out, as they didn't retire on a lap.
const retirements = (
  results: Result[],
  total: number,
  nameOf: NameOf,
): KeyLap[] =>
  results
    .filter((r) =>
      isClassified(r) ? !isFinishedStatus(r.status) : r.positionText === "R",
    )
    .map((r) => ({
      lap: Math.min(Number(r.laps) + 1, total),
      kind: "retirement",
      title: `${nameOf(r.Driver)} retires`,
      // Jolpica often only says "Retired"
      detail: r.status === "Retired" ? undefined : r.status,
    }));

const fastestLap = (results: Result[], nameOf: NameOf): KeyLap[] => {
  const fastest = getFastestLap(results);
  if (!fastest?.FastestLap) return [];
  return [
    {
      lap: Number(fastest.FastestLap.lap),
      kind: "fastest-lap",
      title: `Fastest lap: ${nameOf(fastest.Driver)}`,
      detail: fastest.FastestLap.Time.time,
    },
  ];
};

// Same lap: what happened first in a race comes first
const ORDER: KeyLapKind[] = [
  "incident",
  "red-flag",
  "safety-car",
  "retirement",
  "penalty",
  "fastest-lap",
];

export const getKeyLaps = ({
  messages,
  results,
  start,
}: {
  // Race control for the session, empty before 2023
  messages: RaceControlMessage[];
  results: Result[];
  // The session's start: what's posted before it (reconnaissance laps,
  // earlier sessions' decisions) isn't part of the race
  start?: string;
}): KeyLap[] => {
  const from = start ? Date.parse(start) : -Infinity;
  const race = messages
    .filter((m) => Date.parse(m.date) >= from)
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  // Flags and safety cars stop at the chequered flag (a race can end under
  // red, posted after it). Penalties handed out after the race still count.
  const end = race.findIndex((m) => m.flag === "CHEQUERED");
  const running = end < 0 ? race : race.slice(0, end);
  const nameOf = shortNames(results);
  // OpenF1 knows drivers by car number, which the results carry too
  const names = new Map(
    results.map((r) => [Number(r.number), nameOf(r.Driver)]),
  );
  const total = Number(results[0]?.laps) || Infinity;

  return [
    ...startIncidents(running, names),
    ...safetyCars(running),
    ...redFlags(running),
    ...penalties(race, names),
    ...retirements(results, total, nameOf),
    ...fastestLap(results, nameOf),
  ].sort(
    (a, b) => a.lap - b.lap || ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind),
  );
};

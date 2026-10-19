// Writes lib/data/circuitOutlines.ts: the calendar's thumbnail outline of
// every circuit OpenF1 has raced at, drawn like lib/circuitOutlines.ts does
// at runtime: the winner's fastest clean lap of the latest race there (or
// the one before, when OpenF1 is missing that race's car positions).
// Run it after a new venue's first race or a layout change:
//
//   npm run outlines
//
// OpenF1 allows 30 requests a minute, so a full run takes a few minutes.
// A circuit that fails to draw keeps the outline it already has, so an
// OpenF1 outage never drops circuits. A GitHub Action
// (.github/workflows/circuit-outlines.yml) runs it weekly.

import { execSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { CIRCUIT_OUTLINES } from "../lib/data/circuitOutlines.ts";
import { buildOutline, buildTrackMap } from "../lib/domain/trackMap.ts";

const JOLPICA = "https://api.jolpi.ca/ergast/f1/";
const OPENF1 = "https://api.openf1.org/v1/";
const FIRST_SEASON = 2023;
// 30 a minute, with a little room
const OPENF1_GAP_MS = 2100;
const OUT = new URL("../lib/data/circuitOutlines.ts", import.meta.url);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getJson = async (url) => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(url);
    if (response.ok) return response.json();
    if (response.status === 404) return [];
    if (response.status !== 429) {
      throw new Error(`${response.status} ${response.statusText}: ${url}`);
    }
    const retryAfter = Number(response.headers.get("retry-after")) || 10;
    await sleep(retryAfter * 1000);
  }
  throw new Error(`Still rate limited: ${url}`);
};

let lastOpenF1 = 0;
const openF1 = async (endpoint, params) => {
  await sleep(Math.max(0, lastOpenF1 + OPENF1_GAP_MS - Date.now()));
  lastOpenF1 = Date.now();
  return getJson(`${OPENF1}${endpoint}?${new URLSearchParams(params)}`);
};

// Same filter as pickCleanLap in lib/api/openf1.ts
const pickCleanLap = (laps) =>
  laps
    .filter(
      (l) =>
        l.date_start &&
        l.lap_duration &&
        l.duration_sector_1 &&
        l.duration_sector_2 &&
        l.duration_sector_3 &&
        !l.is_pit_out_lap,
    )
    .sort((a, b) => a.lap_duration - b.lap_duration)[0];

// Same pipeline as loadTrackMap in lib/api/openf1.ts
const loadOutline = async (sessionKey, driverNumber) => {
  const laps = await openF1("laps", {
    session_key: sessionKey,
    driver_number: driverNumber,
  });
  const lap = pickCleanLap(laps);
  if (!lap) return null;
  const start = Date.parse(lap.date_start);
  const sector2 = start + lap.duration_sector_1 * 1000;
  const sector3 = sector2 + lap.duration_sector_2 * 1000;
  const end = start + lap.lap_duration * 1000;
  const locations = await openF1("location", {
    session_key: sessionKey,
    driver_number: driverNumber,
    "date>": new Date(start).toISOString(),
    "date<": new Date(end).toISOString(),
  });
  const points = locations
    .filter((p) => p.x !== 0 || p.y !== 0)
    .map((p) => {
      const time = Date.parse(p.date);
      return {
        x: p.x,
        y: p.y,
        sector: time < sector2 ? 0 : time < sector3 ? 1 : 2,
      };
    });
  if (points.length < 100) return null;
  const map = buildTrackMap(points);
  return map && buildOutline(map);
};

// Every race at each circuit, latest first
const races = new Map();
const today = new Date().toISOString().slice(0, 10);
for (let season = FIRST_SEASON; ; season++) {
  const data = await getJson(`${JOLPICA}${season}/results/1.json?limit=100`);
  const seasonRaces = data.MRData?.RaceTable.Races ?? [];
  if (!seasonRaces.length) break;
  seasonRaces.forEach((race) => {
    const id = race.Circuit.circuitId;
    races.set(id, [race, ...(races.get(id) ?? [])]);
  });
  await sleep(400);
}

// Each season's race sessions, fetched once
const seasonSessions = new Map();
const getSessions = async (year) => {
  if (!seasonSessions.has(year)) {
    seasonSessions.set(
      year,
      await openF1("sessions", { year, session_name: "Race" }),
    );
  }
  return seasonSessions.get(year);
};

// The latest race there that OpenF1 can draw. Some have no car positions
// at all (the 2026 Monaco Grand Prix is all zeros), so try the one before.
const drawCircuit = async (circuitRaces) => {
  for (const race of circuitRaces) {
    if (race.date >= today) continue;
    const sessions = await getSessions(race.season);
    const session = sessions.find(
      (s) => s.date_start.slice(0, 10) === race.date,
    );
    const outline =
      session &&
      (await loadOutline(session.session_key, race.Results[0].number));
    if (outline) return { race, outline };
    console.log(`     no lap at ${race.season} ${race.raceName}`);
  }
  return null;
};

const outlines = {};
for (const [circuitId, circuitRaces] of [...races].sort(([a], [b]) =>
  a.localeCompare(b),
)) {
  const drawn = await drawCircuit(circuitRaces).catch((error) => {
    console.log(`     ${error.message}`);
    return null;
  });
  const kept = !drawn && CIRCUIT_OUTLINES[circuitId];
  console.log(
    drawn
      ? `ok   ${circuitId} (${drawn.race.season} ${drawn.race.raceName})`
      : kept
        ? `kept ${circuitId}`
        : `none ${circuitId}`,
  );
  const outline = drawn?.outline ?? kept;
  if (outline) outlines[circuitId] = outline;
}

const header = `import type { TrackOutline } from "@/lib/domain/trackMap";

// The calendar's thumbnail outline of every circuit OpenF1 has raced at,
// generated by scripts/circuit-outlines.mjs. Layouts hardly ever change, so
// they ship with the app instead of costing two OpenF1 requests each (30 a
// minute) on a cold cache. Circuits missing here (a new venue) are drawn
// from OpenF1 by getCircuitOutline, so rerunning the script is optional: it
// just stops that circuit from being fetched.
export const CIRCUIT_OUTLINES: Record<string, TrackOutline> = `;
await writeFile(OUT, `${header}${JSON.stringify(outlines, null, 2)};\n`);
execSync(`npx prettier --write "${fileURLToPath(OUT)}"`);
console.log(`Wrote ${Object.keys(outlines).length} outlines`);

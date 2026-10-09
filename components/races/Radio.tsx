// Ported from the app's src/screens/RaceWeekend/RadioTab.tsx. The Radio tab:
// team radio clips and race control messages from OpenF1 (2023+) in one
// timeline, newest first. Everything is worked out here, and the client only
// filters the list and plays the clips.
import { getRaceResults } from "@/lib/api/jolpica";
import {
  getDrivers,
  getRaceControl,
  getRaceSession,
  getTeamRadio,
} from "@/lib/api/openf1";
import type { Race, RaceControlMessage } from "@/lib/api/types";
import { getDriverName, getTeamColor } from "@/lib/domain/teams";
import { EmptyState } from "@/components/ui/States";
import {
  RadioTimeline,
  type RadioSummary,
  type TimelineItem,
} from "./RadioTimeline";

// Blue flags are shown dozens of times a race and say little afterwards
const isNoise = (m: RaceControlMessage) => m.flag === "BLUE";

// Swatch next to a flag message
const FLAG_COLORS: Record<string, string> = {
  GREEN: "bg-gain",
  CLEAR: "bg-gain",
  YELLOW: "bg-sprint",
  "DOUBLE YELLOW": "bg-sprint",
  RED: "bg-[#FF3B3B]",
  "BLACK AND WHITE": "bg-text",
  CHEQUERED: "bg-text",
};

const getCategory = (m: RaceControlMessage) => {
  if (m.message.includes("DELETED"))
    return { label: "TRACK LIMITS", className: "text-loss" };
  if (m.message.includes("PENALTY"))
    return { label: "PENALTY", className: "text-loss" };
  if (m.category === "SafetyCar")
    return { label: "SAFETY CAR", className: "text-sprint" };
  if (m.category === "Flag") return { label: "FLAG", className: "text-text" };
  if (m.category === "Drs") return { label: "DRS", className: "text-muted" };
  return { label: "RACE CONTROL", className: "text-muted" };
};

const byDate = (a: { date: string }, b: { date: string }) =>
  Date.parse(a.date) - Date.parse(b.date);

// Race control posts one yellow per marshal sector, so a single incident can
// be a dozen messages. Count periods instead: from the first yellow on a
// clear track until every sector is clear again.
const countYellowPeriods = (messages: RaceControlMessage[]) => {
  const active = new Set<number | null>();
  let periods = 0;
  for (const m of messages) {
    if (m.flag === "YELLOW" || m.flag === "DOUBLE YELLOW") {
      if (!active.size) periods++;
      active.add(m.scope === "Sector" ? m.sector : null);
    } else if (m.flag === "CLEAR" && m.scope === "Sector") {
      active.delete(m.sector);
    } else if (
      (m.flag === "CLEAR" || m.flag === "GREEN") &&
      m.scope === "Track"
    ) {
      active.clear();
    }
  }
  return periods;
};

const getSummary = (
  messages: RaceControlMessage[],
  sessionStart: string,
): RadioSummary => {
  // Leave out the pre-race period (reconnaissance laps, delays), which can
  // have dozens of yellows
  const start = Date.parse(
    messages.find((m) => m.message.trim() === "RACE START")?.date ??
      sessionStart,
  );
  const race = messages.filter((m) => Date.parse(m.date) >= start).sort(byDate);

  return {
    yellows: countYellowPeriods(race),
    // VIRTUAL SAFETY CAR DEPLOYED counts too
    safetyCars: race.filter((m) =>
      /^(VIRTUAL )?SAFETY CAR DEPLOYED/.test(m.message),
    ).length,
    deleted: race.filter((m) => m.message.includes("DELETED")).length,
  };
};

const NoData = () => (
  <EmptyState>No radio or race control data for this race.</EmptyState>
);

export const Radio = async ({ race }: { race: Race }) => {
  const session = await getRaceSession(race.season, race.date);
  if (!session) return <NoData />;

  const [radio, control, drivers, results] = await Promise.all([
    getTeamRadio(session),
    getRaceControl(session),
    // Names and colours come from the results, like the rest of the site,
    // and OpenF1's own driver list covers anyone missing there
    getDrivers(session).catch(() => []),
    getRaceResults(race.season, race.round).catch(() => null),
  ]);
  // OpenF1 lists the season's sessions ahead of time
  if (!radio.length && !control.length) return <NoData />;

  // OpenF1 knows drivers by car number, which the results carry too
  const fromResults = new Map(
    (results?.Results ?? []).map((r) => [
      Number(r.number),
      {
        name: getDriverName(r.Driver),
        color: getTeamColor(r.Constructor.constructorId),
      },
    ]),
  );
  const fromOpenF1 = new Map(
    drivers.map((d) => [
      d.driver_number,
      {
        name: `${d.first_name} ${d.last_name}`,
        color: d.team_colour ? `#${d.team_colour}` : undefined,
      },
    ]),
  );

  // Radio has no lap number: take the lap of the last race control message
  // before it
  const laps = control
    .filter((m) => m.lap_number)
    .map((m) => ({ time: Date.parse(m.date), lap: m.lap_number as number }))
    .sort((a, b) => a.time - b.time);
  const lapAt = (time: number) =>
    laps.findLast((l) => l.time <= time)?.lap ?? null;

  const items: TimelineItem[] = [
    ...radio.map((clip): TimelineItem => {
      const time = Date.parse(clip.date);
      const driver =
        fromResults.get(clip.driver_number) ??
        fromOpenF1.get(clip.driver_number);
      return {
        kind: "radio",
        time,
        lap: lapAt(time),
        url: clip.recording_url,
        name: driver?.name ?? `Car ${clip.driver_number}`,
        color: driver?.color ?? "var(--color-muted)",
      };
    }),
    ...control
      .filter((m) => !isNoise(m))
      .map((m): TimelineItem => {
        const category = getCategory(m);
        return {
          kind: "control",
          time: Date.parse(m.date),
          lap: m.lap_number || null,
          label: category.label,
          labelClassName: category.className,
          flagClassName: m.flag ? FLAG_COLORS[m.flag] : undefined,
          message: m.message,
        };
      }),
  ].sort((a, b) => b.time - a.time);

  return (
    <RadioTimeline
      items={items}
      summary={getSummary(control, session.date_start)}
    />
  );
};

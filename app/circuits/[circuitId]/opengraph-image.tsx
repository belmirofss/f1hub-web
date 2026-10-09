import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getCircuit, getCircuitHistory } from "@/lib/api/jolpica";
import {
  getRaceSession,
  getTrackMap,
  OPENF1_FIRST_SEASON,
} from "@/lib/api/openf1";
import type { RaceResults } from "@/lib/api/types";
import { getCircuitFacts } from "@/lib/domain/circuits";
import type { TrackMap } from "@/lib/domain/trackMap";
import { orFallback } from "@/lib/metadata";
import {
  OG_COLORS,
  OG_CONTENT_TYPE,
  OG_SIZE,
  OgFrame,
  OgStats,
  OgTitle,
  ogImage,
} from "@/lib/og";

// The circuit's card: name and facts, beside the track outline when OpenF1
// has a race there

export const alt = "Circuit card: track outline and facts";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const MAP_BOX = 400;
const SECTOR_COLORS = [OG_COLORS.rain, OG_COLORS.sprint, OG_COLORS.purple];

// The same drawing as the Track map card, from the winner's lap of the latest
// race OpenF1 covers
const loadMap = async (races: RaceResults[]) => {
  const race = races.findLast((r) => Number(r.season) >= OPENF1_FIRST_SEASON);
  const winner = race?.Results?.[0];
  if (!race || !winner) return null;
  const session = await getRaceSession(race.season, race.date);
  return session && getTrackMap(session, Number(winner.number));
};

const TrackOutline = ({ map }: { map: TrackMap }) => {
  const scale = MAP_BOX / Math.max(map.width, map.height);
  const line = {
    fill: "none",
    strokeLinejoin: "round",
    strokeLinecap: "round",
  } as const;
  return (
    <svg
      width={map.width * scale}
      height={map.height * scale}
      viewBox={`0 0 ${map.width} ${map.height}`}
    >
      <polyline
        {...line}
        points={map.sectors.join(" ")}
        strokeWidth={12}
        stroke={OG_COLORS.lightOff}
      />
      {map.sectors.map((points, index) => (
        <polyline
          key={index}
          {...line}
          points={points}
          strokeWidth={4}
          stroke={SECTOR_COLORS[index]}
        />
      ))}
      <circle
        cx={map.start.x}
        cy={map.start.y}
        r={6}
        strokeWidth={2.5}
        fill={OG_COLORS.background}
        stroke={OG_COLORS.text}
      />
    </svg>
  );
};

export default async function Image({
  params,
}: {
  params: Promise<{ circuitId: string }>;
}) {
  await connection();
  const circuitId = decodeURIComponent((await params).circuitId);
  const circuit = /^[a-z0-9_-]+$/.test(circuitId)
    ? await getCircuit(circuitId)
    : null;
  if (!circuit) notFound();

  const races = (await orFallback(getCircuitHistory(circuitId)))?.races ?? [];
  const map = await orFallback(loadMap(races));
  // One row of up to four tiles: the race distance stays on the page, and
  // the laps too when the layout numbers fill the row
  const facts = getCircuitFacts(circuitId, races).filter(
    (fact, _, all) =>
      fact.label !== "Km race" && (fact.label !== "Laps" || all.length < 6),
  );
  const { Location } = circuit;

  return ogImage(
    <OgFrame kicker={`Circuit · ${Location.country}`}>
      <div style={{ display: "flex", flex: 1, gap: 48 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
              gap: 8,
            }}
          >
            <OgTitle size={map ? 72 : 84}>{circuit.circuitName}</OgTitle>
            <div
              style={{ display: "flex", fontSize: 30, color: OG_COLORS.muted }}
            >
              {`${Location.locality}, ${Location.country}`}
            </div>
          </div>
          <div style={{ display: "flex" }}>
            <OgStats stats={facts} />
          </div>
        </div>
        {map && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: MAP_BOX,
            }}
          >
            <TrackOutline map={map} />
          </div>
        )}
      </div>
    </OgFrame>,
    "lists",
  );
}

// Throwaway check for the data layer (#5). Delete it in #28.
import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { getDriverStandings, getLastRaceResults } from "@/lib/api/jolpica";
import { getDrivers, getRaceSession, getTeamRadio } from "@/lib/api/openf1";

export const metadata: Metadata = {
  title: "Data layer",
  robots: { index: false },
};

export default function DataPage() {
  return (
    <div className="flex flex-col gap-4 pb-8">
      <PageHeader title="Data layer" meta="#5 scratch page" />
      <Suspense fallback={<CardSkeleton />}>
        <Standings />
      </Suspense>
      <Suspense fallback={<CardSkeleton />}>
        <Radio />
      </Suspense>
    </div>
  );
}

const Standings = async () => {
  // Request time, so the build doesn't depend on the APIs
  await connection();
  const standings = await getDriverStandings("current");
  if (!standings) return <Card>No standings yet</Card>;

  return (
    <Card as="section">
      <Label>
        Drivers · {standings.season} after round {standings.round}
      </Label>
      <table className="w-full text-sm">
        <tbody>
          {standings.standings.map((s) => (
            <tr key={s.Driver.driverId} className="border-t border-line-soft">
              <td className="w-8 py-1.5 font-mono text-muted">{s.position}</td>
              <td className="py-1.5">
                {s.Driver.givenName} {s.Driver.familyName}
              </td>
              <td className="py-1.5 text-muted">
                {s.Constructors.at(-1)?.name}
              </td>
              <td className="py-1.5 text-right font-mono">{s.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};

const Radio = async () => {
  await connection();
  const race = await getLastRaceResults();
  const session = race && (await getRaceSession(race.season, race.date));
  if (!race || !session)
    return <Card>No OpenF1 session for the last race</Card>;

  const [radio, drivers] = await Promise.all([
    getTeamRadio(session),
    getDrivers(session),
  ]);
  const byNumber = new Map(drivers.map((d) => [d.driver_number, d]));

  return (
    <Card as="section">
      <Label>
        Team radio · {race.raceName} {race.season} · {radio.length} clips
      </Label>
      <ul className="flex flex-col text-sm">
        {radio.map((clip) => (
          <li
            key={clip.recording_url}
            className="flex gap-3 border-t border-line-soft py-1.5"
          >
            <time dateTime={clip.date} className="font-mono text-muted">
              {clip.date.slice(11, 19)}
            </time>
            <span className="w-10 font-mono">
              {byNumber.get(clip.driver_number)?.name_acronym ??
                clip.driver_number}
            </span>
            <a
              href={clip.recording_url}
              className="truncate text-accent hover:underline"
            >
              Listen
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
};

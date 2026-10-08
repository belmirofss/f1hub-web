import type { Metadata } from "next";
import { Schedule } from "@/components/races/Schedule";
import { getRaceWeekend } from "@/lib/raceWeekend";

export const generateMetadata = async ({
  params,
}: PageProps<"/races/[year]/[slug]/schedule">): Promise<Metadata> => {
  const { year, slug } = await params;
  const { race } = await getRaceWeekend(year, slug);
  return {
    title: `${race.raceName} ${year} schedule`,
    description: `${race.raceName} ${year} session times in your time zone and at the track, the weekend forecast and circuit info.`,
  };
};

export default async function RaceSchedulePage({
  params,
}: PageProps<"/races/[year]/[slug]/schedule">) {
  const { year, slug } = await params;
  const { race } = await getRaceWeekend(year, slug);
  return <Schedule race={race} />;
}

import type { Metadata } from "next";
import { Schedule } from "@/components/races/Schedule";
import { pageMetadata } from "@/lib/metadata";
import {
  describeWeekend,
  getRaceWeekend,
  getWeekendName,
  getWeekendTabs,
} from "@/lib/raceWeekend";

export const generateMetadata = async ({
  params,
}: PageProps<"/races/[year]/[slug]/schedule">): Promise<Metadata> => {
  const { year, slug } = await params;
  const { race, races, href } = await getRaceWeekend(year, slug);
  const { results } = await getWeekendTabs(race);
  return pageMetadata({
    title: `${getWeekendName(race)} schedule and session times`,
    description: `${describeWeekend(race, races)}: every session in your time zone and at the track, the weekend forecast and circuit info.`,
    // Until there are results the weekend's main page is this schedule
    path: results ? `${href}/schedule` : href,
    image: `${href}/opengraph-image`,
  });
};

export default async function RaceSchedulePage({
  params,
}: PageProps<"/races/[year]/[slug]/schedule">) {
  const { year, slug } = await params;
  const { race } = await getRaceWeekend(year, slug);
  return <Schedule race={race} />;
}

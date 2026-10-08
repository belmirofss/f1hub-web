import { Columns } from "@/components/layout/Columns";
import { Schedule } from "@/components/races/Schedule";
import { Stub } from "@/components/Stub";
import { getRaceWeekend, getWeekendTabs } from "@/lib/raceWeekend";

// The race once there are results, the schedule until then
export default async function RaceWeekendPage({
  params,
}: PageProps<"/races/[year]/[slug]">) {
  const { year, slug } = await params;
  const { race } = await getRaceWeekend(year, slug);
  const { results } = await getWeekendTabs(race);

  if (!results) return <Schedule race={race} />;

  return (
    <Columns
      aside={
        <Stub
          issue={13}
          links={[
            { href: "/circuits/sepang", label: "Sepang International Circuit" },
          ]}
        >
          Pole, fastest lap and top gainer.
        </Stub>
      }
    >
      <Stub
        issue={13}
        links={[
          { href: "/drivers/max_verstappen", label: "Max Verstappen" },
          { href: "/teams/red_bull", label: "Red Bull" },
        ]}
      >
        Race classification with places gained, gaps, status and points.
      </Stub>
    </Columns>
  );
}

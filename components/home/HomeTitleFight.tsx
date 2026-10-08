import { io } from "next/cache";
import {
  TitleFightCompact,
  getTitleFight,
} from "@/components/standings/TitleFightCard";
import { getDriverStandings, getSeasonSchedule } from "@/lib/api/jolpica";

// Only renders when two to five drivers can still be champion
export const HomeTitleFight = async () => {
  // Request time, so the build doesn't depend on the APIs
  await io();
  const [standings, races] = await Promise.all([
    getDriverStandings("current"),
    getSeasonSchedule("current"),
  ]);
  if (!standings) return null;

  const fight = getTitleFight(
    standings.standings,
    Number(standings.round),
    races,
  );
  return fight ? <TitleFightCompact fight={fight} /> : null;
};

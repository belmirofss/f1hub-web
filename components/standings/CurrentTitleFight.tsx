import { io } from "next/cache";
import { getDriverStandings, getSeasonSchedule } from "@/lib/api/jolpica";
import {
  TitleFightCompact,
  TitleFightFull,
  getTitleFight,
} from "./TitleFightCard";

// This season's title fight, or nothing once the title is decided. Home and
// the desktop constructors' page show the compact card, the drivers'
// standings the full one.
export const CurrentTitleFight = async ({
  compact,
  link,
}: {
  compact?: boolean;
  link?: { href: string; label: string };
}) => {
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
  if (!fight) return null;
  return compact ? (
    <TitleFightCompact fight={fight} link={link} />
  ) : (
    <TitleFightFull fight={fight} />
  );
};

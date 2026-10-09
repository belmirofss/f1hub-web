import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getSeasonSchedule } from "@/lib/api/jolpica";
import { raceHref } from "@/lib/domain/routes";
import { findNextRace } from "@/lib/domain/sessions";

// The installed app's "Next race" shortcut. The manifest can't name the race,
// so this sends it to the next race's page, or the calendar between seasons.
export async function GET() {
  await connection();
  const races = await getSeasonSchedule("current");
  const race = findNextRace(races, Date.now());
  redirect(race ? raceHref(race, races) : "/calendar");
}

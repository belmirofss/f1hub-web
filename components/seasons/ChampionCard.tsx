import { io } from "next/cache";
import { ChampionBlock } from "@/components/archive/ChampionBlock";
import { LinkCard } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import {
  getConstructorChampionList,
  getCurrentSeason,
} from "@/lib/api/jolpica";
import { CHAMPIONS } from "@/lib/data/champions";
import {
  fromConstructorsChampion,
  fromDriversChampion,
  summarizeTitle,
} from "@/lib/domain/archive";
import { getTeamHero } from "@/lib/domain/teams";
import type { SeasonInfo } from "@/lib/season";

// The archive's champion block, in the team colour, with a link to the
// driver or team

// From the season info and the shipped titles, so it costs no requests of
// its own
export const DriversChampionCard = ({
  champion,
}: {
  champion: NonNullable<SeasonInfo["champion"]>;
}) => {
  const title = fromDriversChampion(champion);
  return (
    <ChampionBlock
      meta={`Drivers' champion · ${champion.team}`}
      headline={champion.driver}
      summary={summarizeTitle(title, CHAMPIONS.map(fromDriversChampion))}
      link={{ href: title.href, label: "Driver profile" }}
      color={getTeamHero(champion.teamId)}
    />
  );
};

// The title started in 1958
export const ConstructorsChampionCard = async ({ year }: { year: string }) => {
  // Request time, so the build doesn't depend on the APIs
  await io();
  const titles = (await getConstructorChampionList()).map(
    fromConstructorsChampion,
  );
  const title = titles.find((t) => t.season === year);
  if (!title) return null;

  return (
    <ChampionBlock
      meta="Constructors' champion"
      headline={title.name}
      summary={summarizeTitle(title, titles)}
      link={{ href: title.href, label: "Team profile" }}
      color={getTeamHero(title.teamId)}
    />
  );
};

// Before a season ends there's no champion, so point to the live standings
export const SeasonInProgressCard = async ({ year }: { year: string }) => {
  // Request time, so the build doesn't depend on the APIs
  await io();
  if (Number(year) !== (await getCurrentSeason())) return null;

  return (
    <LinkCard href="/standings">
      <Label>Season in progress</Label>
      <span className="font-bold">Title fight and what-if</span>
    </LinkCard>
  );
};

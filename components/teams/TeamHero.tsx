import { PosterHero } from "@/components/layout/PosterHero";
import type { Constructor } from "@/lib/api/types";
import { getCountryCode3ByNationality } from "@/lib/domain/countries";
import { getTeamHero } from "@/lib/domain/teams";

// The page header in the team colour: "TEAM · GBR · SINCE 1966", the name as
// the headline and the constructors' title years
export const TeamHero = ({
  team,
  seasons,
  titles,
}: {
  team: Constructor;
  // Every season the team raced, oldest first
  seasons: string[];
  titles: string[];
}) => (
  <PosterHero
    hero={getTeamHero(team.constructorId)}
    meta={
      <>
        TEAM ·{" "}
        <abbr title={team.nationality} className="no-underline">
          {getCountryCode3ByNationality(team.nationality)}
        </abbr>
        {seasons[0] && ` · since ${seasons[0]}`}
      </>
    }
    headline={team.name}
    titles={titles}
    titlesLabel="Constructors' titles"
    back="/standings/constructors"
  />
);

import Link from "next/link";
import { PosterHero } from "@/components/layout/PosterHero";
import type { Constructor, Driver } from "@/lib/api/types";
import { getCountryCode3ByNationality } from "@/lib/domain/countries";
import { teamHref } from "@/lib/domain/routes";
import { getTeamHero } from "@/lib/domain/teams";

// The page header in the colour of the driver's current (or last) team:
// "DRIVER · RED BULL RACING · NLD", the car number behind the given name and
// surname, and the title years
export const DriverHero = ({
  driver,
  team,
  titles,
}: {
  driver: Driver;
  // The driver's latest team
  team?: Constructor;
  titles: string[];
}) => (
  <PosterHero
    hero={getTeamHero(team?.constructorId)}
    meta={
      <>
        DRIVER
        {team && (
          <>
            {" · "}
            <Link
              href={teamHref(team.constructorId)}
              className="relative underline underline-offset-2 after:absolute after:-inset-x-2 after:-inset-y-3 hover:no-underline"
            >
              {team.name}
            </Link>
          </>
        )}
        {" · "}
        <abbr title={driver.nationality} className="no-underline">
          {getCountryCode3ByNationality(driver.nationality)}
        </abbr>
      </>
    }
    kicker={driver.givenName}
    headline={driver.familyName}
    number={driver.permanentNumber}
    titles={titles}
    titlesLabel="World titles"
    back="/standings"
  />
);

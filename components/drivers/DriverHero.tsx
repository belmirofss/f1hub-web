import Link from "next/link";
import { PosterHero } from "@/components/layout/PosterHero";
import type { Career } from "@/lib/api/jolpica";
import type { Driver } from "@/lib/api/types";
import { getCountryCode3ByNationality } from "@/lib/domain/countries";
import { seasonSpan } from "@/lib/domain/drivers";
import { teamHref } from "@/lib/domain/routes";
import { getTeamHero } from "@/lib/domain/teams";

// The page header in the colour of the driver's current (or last) team:
// "DRIVER · RED BULL RACING · NLD", or "DRIVER · 1991–2012 · DEU" for a
// former driver, then the car number behind the given name and surname, and
// the title years
export const DriverHero = ({
  driver,
  career,
  titles,
}: {
  driver: Driver;
  career: Career;
  titles: string[];
}) => {
  const latest = career.seasons.at(-1)?.team;
  const team = career.onGrid ? latest : undefined;
  return (
    <PosterHero
      hero={getTeamHero(latest?.constructorId)}
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
          {!career.onGrid && career.seasons.length > 0 && (
            <> · {seasonSpan(career.seasons)}</>
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
};

import Link from "next/link";
import { BackButton } from "@/components/layout/BackButton";
import { TeamBar } from "@/components/ui/Card";
import type { Constructor, Driver } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { getCountryCode3ByNationality } from "@/lib/domain/countries";
import { teamHref } from "@/lib/domain/routes";
import {
  getDriverCode,
  getTeamColor,
  getTeamTextColor,
} from "@/lib/domain/teams";

// The page header: Back + "DRIVER · 2026", then the team bar, the code in a
// circle, the given name over the slanted surname, nationality and team
export const DriverHero = ({
  driver,
  season,
  team,
}: {
  driver: Driver;
  // The driver's latest season and team
  season?: string;
  team?: Constructor;
}) => {
  const color = getTeamColor(team?.constructorId);
  // "Schumacher" doesn't fit a phone at full size
  const long = driver.familyName.length > 9;

  return (
    <header className="flex flex-col gap-2 pt-2 lg:gap-4 lg:pt-6">
      <div className="-ml-2.5 flex min-h-11 items-center lg:ml-0 lg:min-h-0">
        <BackButton fallbackHref="/standings" className="lg:hidden" />
        <p className="truncate font-mono text-xs tracking-[1px] text-muted">
          DRIVER{season && ` · ${season}`}
        </p>
      </div>
      <div className="flex items-center gap-3.5 lg:gap-5">
        <TeamBar color={color} height={76} className="lg:h-24!" />
        <span
          aria-hidden
          className="flex size-[76px] shrink-0 items-center justify-center rounded-full border border-line bg-surface-raised font-mono text-lg font-bold lg:size-24 lg:text-[22px]"
          style={{ color: getTeamTextColor(team?.constructorId) }}
        >
          {getDriverCode(driver)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h1 className="flex flex-col">
            <span className="text-[17px] leading-5 font-semibold text-muted lg:text-xl">
              {driver.givenName}
            </span>
            <span
              className={cn(
                "-skew-x-6 font-black break-words uppercase lg:text-[44px] lg:leading-[48px]",
                long ? "text-2xl leading-7" : "text-[30px] leading-[34px]",
              )}
            >
              {driver.familyName}
            </span>
          </h1>
          <p className="font-mono text-[11px] font-medium tracking-[1px] text-muted uppercase">
            <abbr title={driver.nationality} className="no-underline">
              {getCountryCode3ByNationality(driver.nationality)}
            </abbr>
            {team && (
              <>
                {" · "}
                <Link
                  href={teamHref(team.constructorId)}
                  className="relative text-text underline after:absolute after:-inset-x-2 after:-inset-y-3 hover:text-accent-ink"
                >
                  {team.name}
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </header>
  );
};

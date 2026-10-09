import { BackButton } from "@/components/layout/BackButton";
import { TeamBar } from "@/components/ui/Card";
import type { Constructor } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { getTeamColor } from "@/lib/domain/teams";

// The page header: Back + "TEAM · 2026", then the team bar beside the slanted
// name, nationality and first season
export const TeamHero = ({
  team,
  seasons,
}: {
  team: Constructor;
  // Every season the team raced, oldest first
  seasons: string[];
}) => {
  const latest = seasons.at(-1);
  // "Cooper-Maserati" doesn't fit a phone at full size
  const long = team.name.length > 11;

  return (
    <header className="flex flex-col gap-2 pt-2 lg:gap-4 lg:pt-6">
      <div className="-ml-2.5 flex min-h-11 items-center lg:ml-0 lg:min-h-0">
        <BackButton
          fallbackHref="/standings/constructors"
          className="lg:hidden"
        />
        <p className="truncate font-mono text-xs tracking-[1px] text-muted">
          TEAM{latest && ` · ${latest}`}
        </p>
      </div>
      <div className="flex items-stretch gap-3.5 lg:gap-5">
        <TeamBar
          color={getTeamColor(team.constructorId)}
          height={56}
          className="lg:h-[72px]!"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h1
            className={cn(
              "-skew-x-6 font-black break-words uppercase lg:text-[44px] lg:leading-[48px]",
              long
                ? "text-[26px] leading-[30px]"
                : "text-[34px] leading-[38px]",
            )}
          >
            {team.name}
          </h1>
          <p className="font-mono text-[11px] font-medium tracking-[1px] text-muted uppercase">
            {team.nationality}
            {seasons[0] && ` · since ${seasons[0]}`}
          </p>
        </div>
      </div>
    </header>
  );
};

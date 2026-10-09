import { LinkCard } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { getCurrentSeason } from "@/lib/api/jolpica";
import { seasonHref } from "@/lib/domain/routes";
import { getTeamPair } from "@/lib/team";

// Opens the team's head-to-head on the Teammates page of its latest season.
// Hidden when the team didn't have two main drivers that season.
export const TeammateLink = async ({
  constructorId,
  season,
}: {
  constructorId: string;
  season: string;
}) => {
  const [{ pair }, current] = await Promise.all([
    getTeamPair(season, constructorId),
    getCurrentSeason(),
  ]);
  if (!pair) return null;
  const page =
    Number(season) === current
      ? "/standings/teammates"
      : `${seasonHref(season)}/teammates`;

  return (
    <LinkCard
      href={`${page}?team=${constructorId}`}
      aria-label={`Teammate battle ${season}: ${pair.a.familyName} against ${pair.b.familyName}, qualifying, race and points head-to-head`}
    >
      <Label>Teammate battle · {season}</Label>
      <span className="text-[15px] font-bold">
        Qualifying, race and points head-to-head
      </span>
    </LinkCard>
  );
};

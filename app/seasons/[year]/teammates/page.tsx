import { Suspense } from "react";
import type { Metadata } from "next";
import { SeasonHeader } from "@/components/seasons/SeasonHeader";
import { Teammates, TeammatesSkeleton } from "@/components/standings/Teammates";
import { getSeasonInfo } from "@/lib/season";

export const generateMetadata = async ({
  params,
}: PageProps<"/seasons/[year]/teammates">): Promise<Metadata> => {
  const { year } = await params;
  await getSeasonInfo(year);
  return {
    title: `${year} teammate battles`,
    description: `Formula 1 teammate head-to-heads in ${year}: qualifying, race, points and podiums inside every team.`,
  };
};

export default async function SeasonTeammatesPage({
  params,
}: PageProps<"/seasons/[year]/teammates">) {
  const { year } = await params;
  const season = await getSeasonInfo(year);

  return (
    <>
      <SeasonHeader season={season} value="teammates" />
      <Suspense fallback={<TeammatesSkeleton />}>
        <Teammates season={year} />
      </Suspense>
    </>
  );
}

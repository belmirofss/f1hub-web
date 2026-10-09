import { Suspense } from "react";
import type { Metadata } from "next";
import { SeasonHeader } from "@/components/seasons/SeasonHeader";
import { Teammates, TeammatesSkeleton } from "@/components/standings/Teammates";
import { seasonHref } from "@/lib/domain/routes";
import { pageMetadata } from "@/lib/metadata";
import { getSeasonInfo } from "@/lib/season";

export const generateMetadata = async ({
  params,
}: PageProps<"/seasons/[year]/teammates">): Promise<Metadata> => {
  const { year } = await params;
  const { champion } = await getSeasonInfo(year);
  return pageMetadata({
    title: `${year} F1 season: teammate head-to-heads`,
    description: `Who beat whom inside every Formula 1 team in ${year}${
      champion ? `, the year ${champion.driver} won the title` : ""
    }: qualifying, race, points and podium head-to-heads with the average qualifying gap.`,
    path: `${seasonHref(year)}/teammates`,
    image: `${seasonHref(year)}/opengraph-image`,
  });
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

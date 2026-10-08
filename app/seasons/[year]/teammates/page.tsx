import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeasonHeader } from "@/components/seasons/SeasonHeader";
import { Teammates, TeammatesSkeleton } from "@/components/standings/Teammates";

export const generateMetadata = async ({
  params,
}: PageProps<"/seasons/[year]/teammates">): Promise<Metadata> => {
  const { year } = await params;
  if (!/^\d{4}$/.test(year)) notFound();
  return {
    title: `${year} teammate battles`,
    description: `Formula 1 teammate head-to-heads in ${year}: qualifying, race, points and podiums inside every team.`,
  };
};

export default async function SeasonTeammatesPage({
  params,
}: PageProps<"/seasons/[year]/teammates">) {
  const { year } = await params;
  if (!/^\d{4}$/.test(year)) notFound();

  return (
    <>
      <SeasonHeader year={year} value="teammates" />
      <Suspense fallback={<TeammatesSkeleton />}>
        <Teammates season={year} />
      </Suspense>
    </>
  );
}

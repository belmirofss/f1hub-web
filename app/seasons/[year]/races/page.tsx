import type { Metadata } from "next";
import { SeasonHeader } from "@/components/seasons/SeasonHeader";
import { Stub } from "@/components/Stub";

export const metadata: Metadata = { title: "Season races" };

export default async function SeasonRacesPage({
  params,
}: PageProps<"/seasons/[year]/races">) {
  const { year } = await params;

  return (
    <>
      <SeasonHeader year={year} value="races" />
      <Stub
        issue={16}
        links={[
          {
            href: `/races/${year}/abu-dhabi-grand-prix`,
            label: "Abu Dhabi Grand Prix",
          },
        ]}
      >
        Every race of the season with its winner.
      </Stub>
    </>
  );
}

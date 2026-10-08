import type { Metadata } from "next";
import { SeasonHeader } from "@/components/seasons/SeasonHeader";
import { Stub } from "@/components/Stub";

export const metadata: Metadata = { title: "Season" };

export default async function SeasonDriversPage({
  params,
}: PageProps<"/seasons/[year]">) {
  const { year } = await params;

  return (
    <>
      <SeasonHeader year={year} value="drivers" />
      <Stub
        issue={16}
        links={[{ href: "/drivers/max_verstappen", label: "Max Verstappen" }]}
      >
        The champion and the final drivers&apos; standings.
      </Stub>
    </>
  );
}

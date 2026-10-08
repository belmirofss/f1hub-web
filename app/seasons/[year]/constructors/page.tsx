import type { Metadata } from "next";
import { SeasonHeader } from "@/components/seasons/SeasonHeader";
import { Stub } from "@/components/Stub";

export const metadata: Metadata = { title: "Season constructors" };

export default async function SeasonConstructorsPage({
  params,
}: PageProps<"/seasons/[year]/constructors">) {
  const { year } = await params;

  return (
    <>
      <SeasonHeader year={year} value="constructors" />
      <Stub issue={16} links={[{ href: "/teams/red_bull", label: "Red Bull" }]}>
        The final constructors&apos; standings.
      </Stub>
    </>
  );
}

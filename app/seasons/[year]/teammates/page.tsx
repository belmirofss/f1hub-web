import type { Metadata } from "next";
import { SeasonHeader } from "@/components/seasons/SeasonHeader";
import { Stub } from "@/components/Stub";

export const metadata: Metadata = { title: "Season teammates" };

export default async function SeasonTeammatesPage({
  params,
}: PageProps<"/seasons/[year]/teammates">) {
  const { year } = await params;

  return (
    <>
      <SeasonHeader year={year} value="teammates" />
      <Stub issue={11}>Teammate head-to-heads for the season.</Stub>
    </>
  );
}

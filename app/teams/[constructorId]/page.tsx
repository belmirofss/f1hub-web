import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Stub, nameFromSlug } from "@/components/Stub";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage({
  params,
}: PageProps<"/teams/[constructorId]">) {
  const { constructorId } = await params;

  return (
    <>
      <PageHeader
        back="/standings/constructors"
        meta="TEAM"
        title={nameFromSlug(constructorId)}
      />
      <Stub
        issue={18}
        links={[{ href: "/drivers/russell", label: "George Russell" }]}
      >
        Titles, current drivers, all-time stats and points per round.
      </Stub>
    </>
  );
}

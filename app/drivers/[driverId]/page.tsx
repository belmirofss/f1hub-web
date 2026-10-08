import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Stub, nameFromSlug } from "@/components/Stub";

export const metadata: Metadata = { title: "Driver" };

export default async function DriverPage({
  params,
}: PageProps<"/drivers/[driverId]">) {
  const { driverId } = await params;

  return (
    <>
      <PageHeader
        back="/standings"
        meta="DRIVER"
        title={nameFromSlug(driverId)}
      />
      <Stub
        issue={17}
        links={[
          { href: "/teams/mercedes", label: "Mercedes" },
          {
            href: "/standings/teammates?team=mercedes",
            label: "Teammate battle",
          },
        ]}
      >
        Season and career stats, last 5 races, championship by season and the
        Wikipedia bio.
      </Stub>
    </>
  );
}

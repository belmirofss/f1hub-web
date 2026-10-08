import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Stub, nameFromSlug } from "@/components/Stub";

export const metadata: Metadata = { title: "Circuit" };

export default async function CircuitPage({
  params,
}: PageProps<"/circuits/[circuitId]">) {
  const { circuitId } = await params;

  return (
    <>
      <PageHeader
        back="/calendar"
        meta="CIRCUIT"
        title={nameFromSlug(circuitId)}
      />
      <Stub issue={19}>
        Track map, facts, fastest race lap, recent winners and most wins.
      </Stub>
    </>
  );
}

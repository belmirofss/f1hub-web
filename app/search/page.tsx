import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Stub } from "@/components/Stub";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false },
};

export default function SearchPage() {
  return (
    <>
      <PageHeader back="/" title="Search" />
      <Stub issue={20}>Drivers, teams, races, circuits and seasons.</Stub>
    </>
  );
}

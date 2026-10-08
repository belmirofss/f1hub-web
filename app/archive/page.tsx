import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Stub } from "@/components/Stub";

export const metadata: Metadata = { title: "Archive" };

export default function ArchivePage() {
  return (
    <>
      <PageHeader title="Archive" meta="1950–2026" />
      <Stub
        issue={16}
        links={[
          { href: "/seasons/2025", label: "2025 season" },
          { href: "/seasons/1988", label: "1988 season" },
        ]}
      >
        Every season with its champion and team.
      </Stub>
    </>
  );
}

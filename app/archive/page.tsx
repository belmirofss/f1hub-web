import { Suspense } from "react";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import {
  Archive,
  ArchiveMeta,
  ArchiveSkeleton,
} from "@/components/archive/Archive";
import { PageHeader } from "@/components/layout/PageHeader";
import { IconButton } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Archive",
  description:
    "Every Formula 1 season since 1950 with its drivers' champion and team. Open a season for its final standings and race winners.",
};

export default function ArchivePage() {
  return (
    <>
      <PageHeader
        title="Archive"
        meta={
          <Suspense fallback={null}>
            <ArchiveMeta />
          </Suspense>
        }
        // From 768px the top navigation has search
        actions={
          <IconButton
            href="/search"
            label="Search drivers, teams, circuits, races and seasons"
            className="md:hidden"
          >
            <Search aria-hidden size={18} strokeWidth={2} />
          </IconButton>
        }
      />
      <Suspense fallback={<ArchiveSkeleton />}>
        <Archive />
      </Suspense>
    </>
  );
}

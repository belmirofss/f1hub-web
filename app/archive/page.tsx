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
import { CHAMPIONS } from "@/lib/data/champions";
import { FIRST_SEASON } from "@/lib/domain/routes";
import { pageMetadata } from "@/lib/metadata";

// Finished seasons ship with the app, so this costs no request
const first = CHAMPIONS[0];
const latest = CHAMPIONS.at(-1)!;

export const metadata: Metadata = pageMetadata({
  title: `F1 archive: every season and champion since ${FIRST_SEASON}`,
  description: `${CHAMPIONS.length} Formula 1 seasons with each drivers' champion and team, from ${first.driver} in ${first.season} to ${latest.driver} in ${latest.season}. Open a season for its final standings and race winners.`,
  path: "/archive",
});

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

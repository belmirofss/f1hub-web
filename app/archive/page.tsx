import { Suspense } from "react";
import type { Metadata } from "next";
import { io } from "next/cache";
import { Search } from "lucide-react";
import {
  Archive,
  ArchiveMeta,
  ArchiveSkeleton,
  getTitles,
} from "@/components/archive/Archive";
import { PageHeader } from "@/components/layout/PageHeader";
import { IconButton } from "@/components/ui/Card";
import { parseArchiveView } from "@/lib/domain/archive";
import { pageMetadata } from "@/lib/metadata";

export const generateMetadata = async ({
  searchParams,
}: PageProps<"/archive">): Promise<Metadata> => {
  // Both championships share the canonical /archive; only the shared link
  // keeps ?view=constructors
  const view = parseArchiveView(await searchParams);
  // Request time, like the grid, so the build doesn't depend on the APIs
  await io();
  const titles = await getTitles(view);
  const first = titles[0];
  const latest = titles.at(-1)!;
  if (view === "constructors") {
    return pageMetadata({
      title: `F1 archive: every constructors' champion since ${first.season}`,
      description: `${titles.length} Formula 1 constructors' titles, from ${first.name} in ${first.season} to ${latest.name} in ${latest.season}, on one grid in each team's colours. Open a season for its final standings and race winners.`,
      path: "/archive",
      query: "?view=constructors",
    });
  }
  return pageMetadata({
    title: `F1 archive: every season and champion since ${first.season}`,
    description: `${titles.length} Formula 1 seasons with each drivers' champion and team, from ${first.name} in ${first.season} to ${latest.name} in ${latest.season}, on one grid in each team's colours. Open a season for its final standings and race winners.`,
    path: "/archive",
  });
};

export default async function ArchivePage({
  searchParams,
}: PageProps<"/archive">) {
  const view = parseArchiveView(await searchParams);
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
      <Suspense key={view} fallback={<ArchiveSkeleton />}>
        <Archive view={view} />
      </Suspense>
    </>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { Search, SearchField } from "@/components/search/Search";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Search",
  description: "Search Formula 1 drivers, teams, races, circuits and seasons.",
  path: "/search",
  noindex: true,
});

// The page is static; the query comes from the URL in the browser
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-[760px] flex-col gap-3">
          <h1 className="sr-only">Search</h1>
          <SearchField value="" />
        </div>
      }
    >
      <Search />
    </Suspense>
  );
}

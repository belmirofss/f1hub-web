import type { Metadata } from "next";
import { HomeCards } from "@/components/home/HomeCards";
import { LightsOut, LightsOutSkeleton } from "@/components/home/LightsOut";
import { SearchBar } from "@/components/home/SearchBar";
import { JsonLd } from "@/components/seo/JsonLd";
import { Slot } from "@/components/ui/Slot";
import { pageMetadata, SITE_DESCRIPTION, SITE_NAME } from "@/lib/metadata";
import { websiteLd } from "@/lib/structuredData";

const TITLE = `${SITE_NAME}: Formula 1 calendar, standings and results`;

export const metadata: Metadata = {
  ...pageMetadata({ title: TITLE, description: SITE_DESCRIPTION, path: "/" }),
  // The brand is already in it, so no " | F1HUB"
  title: { absolute: TITLE },
};

export default function Home() {
  return (
    <>
      <h1 className="sr-only">{TITLE}</h1>
      <JsonLd data={websiteLd()} />
      <div className="flex flex-col gap-6 pt-[18px] lg:gap-9 lg:pt-6">
        <SearchBar />
        <Slot label="Next race" fallback={<LightsOutSkeleton />}>
          <LightsOut />
        </Slot>
        <HomeCards />
      </div>
    </>
  );
}

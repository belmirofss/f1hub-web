import type { Metadata } from "next";
import {
  LastRaceCard,
  LastRaceCardSkeleton,
} from "@/components/home/LastRaceCard";
import {
  NextRaceCard,
  NextRaceCardSkeleton,
} from "@/components/home/NextRaceCard";
import { SearchBar } from "@/components/home/SearchBar";
import {
  SeasonStripCard,
  SeasonStripCardSkeleton,
} from "@/components/home/SeasonStripCard";
import {
  TeammateSpotlightCard,
  TeammateSpotlightCardSkeleton,
} from "@/components/home/TeammateSpotlightCard";
import {
  TopFiveCard,
  TopFiveCardSkeleton,
} from "@/components/home/TopFiveCard";
import { Columns } from "@/components/layout/Columns";
import { JsonLd } from "@/components/seo/JsonLd";
import { CurrentTitleFight } from "@/components/standings/CurrentTitleFight";
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
      <div className="flex flex-col gap-3.5 pt-[18px] lg:gap-5 lg:pt-6">
        <SearchBar />
        <Columns
          asideLabel="Championship"
          aside={
            <>
              <Slot label="Top 5" fallback={<TopFiveCardSkeleton />}>
                <TopFiveCard />
              </Slot>
              <Slot fallback={null}>
                <CurrentTitleFight compact />
              </Slot>
              <Slot fallback={<TeammateSpotlightCardSkeleton />}>
                <TeammateSpotlightCard />
              </Slot>
              <div className="contents max-lg:hidden">
                <Slot fallback={<SeasonStripCardSkeleton />}>
                  <SeasonStripCard />
                </Slot>
              </div>
            </>
          }
        >
          <Slot label="Next race" fallback={<NextRaceCardSkeleton />}>
            <NextRaceCard />
          </Slot>
          <Slot label="Last race" fallback={<LastRaceCardSkeleton />}>
            <LastRaceCard />
          </Slot>
        </Columns>
      </div>
    </>
  );
}

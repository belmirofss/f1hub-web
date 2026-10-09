import { SlidersHorizontal } from "lucide-react";
import {
  LastRaceCard,
  LastRaceCardSkeleton,
} from "@/components/home/LastRaceCard";
import {
  NextRaceCard,
  NextRaceCardSkeleton,
} from "@/components/home/NextRaceCard";
import {
  NextSessionTicker,
  NextSessionTickerSkeleton,
} from "@/components/home/NextSessionTicker";
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
import { Wordmark } from "@/components/layout/Wordmark";
import { CurrentTitleFight } from "@/components/standings/CurrentTitleFight";
import { IconButton } from "@/components/ui/Card";
import { Slot } from "@/components/ui/Slot";

export default function Home() {
  return (
    <>
      {/* Phones have no top navigation, so Home carries the wordmark and settings */}
      <header className="flex items-center justify-between pt-[18px] md:hidden">
        <Wordmark />
        <IconButton href="/settings" label="Settings">
          <SlidersHorizontal aria-hidden size={18} strokeWidth={2} />
        </IconButton>
      </header>
      <h1 className="sr-only">
        F1HUB: Formula 1 calendar, standings and results
      </h1>
      <div className="flex flex-col gap-3.5 md:pt-5 lg:gap-5">
        <Slot fallback={<NextSessionTickerSkeleton />}>
          <NextSessionTicker />
        </Slot>
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

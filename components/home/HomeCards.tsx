import { Slot } from "@/components/ui/Slot";
import {
  CircuitGlanceCard,
  CircuitGlanceCardSkeleton,
} from "./CircuitGlanceCard";
import { ConstructorsCard, ConstructorsCardSkeleton } from "./ConstructorsCard";
import { ForecastCard, ForecastCardSkeleton } from "./ForecastCard";
import { LastRaceCard, LastRaceCardSkeleton } from "./LastRaceCard";
import { SeasonStripCard, SeasonStripCardSkeleton } from "./SeasonStripCard";
import {
  TeammateSpotlightCard,
  TeammateSpotlightCardSkeleton,
} from "./TeammateSpotlightCard";
import {
  TitleFightHomeCard,
  TitleFightHomeCardSkeleton,
} from "./TitleFightHomeCard";
import { TopFiveCard, TopFiveCardSkeleton } from "./TopFiveCard";
import { UpNextCard, UpNextCardSkeleton } from "./UpNextCard";

const CARDS = [
  { label: "Last race", Card: LastRaceCard, Skeleton: LastRaceCardSkeleton },
  {
    label: "Title fight",
    Card: TitleFightHomeCard,
    Skeleton: TitleFightHomeCardSkeleton,
  },
  { label: "Form", Card: TopFiveCard, Skeleton: TopFiveCardSkeleton },
  {
    label: "Constructors",
    Card: ConstructorsCard,
    Skeleton: ConstructorsCardSkeleton,
  },
  {
    label: "Closest teammate battle",
    Card: TeammateSpotlightCard,
    Skeleton: TeammateSpotlightCardSkeleton,
  },
  {
    label: "Weekend forecast",
    Card: ForecastCard,
    Skeleton: ForecastCardSkeleton,
  },
  {
    label: "Circuit at a glance",
    Card: CircuitGlanceCard,
    Skeleton: CircuitGlanceCardSkeleton,
  },
  {
    label: "Season so far",
    Card: SeasonStripCard,
    Skeleton: SeasonStripCardSkeleton,
  },
  { label: "Up next", Card: UpNextCard, Skeleton: UpNextCardSkeleton },
];

// The quick-info cards under the hero: three columns on desktop, two on
// tablets and one under the other on phones. Each loads (and fails) on its
// own behind a placeholder of its size.
export const HomeCards = ({ skeleton }: { skeleton?: boolean }) => (
  <div className="grid grid-cols-1 gap-x-5 gap-y-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-y-8">
    {CARDS.map(({ label, Card, Skeleton }) =>
      skeleton ? (
        <Skeleton key={label} />
      ) : (
        <Slot key={label} label={label} fallback={<Skeleton />}>
          <Card />
        </Slot>
      ),
    )}
  </div>
);

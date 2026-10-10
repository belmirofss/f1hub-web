import {
  CardSkeleton,
  ListSkeleton,
  LoadingRegion,
  Skeleton,
} from "@/components/ui/Skeleton";
import { StatRailSkeleton } from "@/components/ui/StatRail";

// Placeholders for loading.tsx, shaped like a PageHeader plus content

const Body = ({ rows = 6 }: { rows?: number }) => (
  <div className="flex flex-wrap items-start gap-3.5 lg:gap-5">
    <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-3.5 lg:gap-5">
      <CardSkeleton lines={4} />
      <ListSkeleton rows={rows} />
    </div>
    <div className="hidden min-w-0 flex-[1_1_340px] flex-col gap-5 lg:flex">
      <CardSkeleton />
    </div>
  </div>
);

export const TabPageSkeleton = () => (
  <LoadingRegion className="flex flex-col gap-3.5 lg:gap-5">
    <div className="flex items-center justify-between pt-[18px] lg:pt-6">
      <Skeleton className="h-9 w-40 lg:h-11 lg:w-72" />
      <Skeleton className="h-3 w-16 lg:hidden" />
    </div>
    <Body />
  </LoadingRegion>
);

export const DetailPageSkeleton = () => (
  <LoadingRegion className="flex flex-col gap-3.5 lg:gap-5">
    <div className="flex flex-col gap-1 pt-2 lg:gap-1.5 lg:pt-6">
      <div className="flex min-h-11 items-center gap-3 lg:min-h-0">
        <Skeleton className="size-6 lg:hidden" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-[30px] w-3/5 lg:h-11" />
    </div>
    <Body />
  </LoadingRegion>
);

// Inside a layout that already shows the header (race weekend tabs). Pass the
// number of list rows the page will show, so the footer doesn't jump down when
// it streams in: 20 for a results table.
export const ContentSkeleton = ({ rows }: { rows?: number }) => (
  <LoadingRegion>
    <Body rows={rows} />
  </LoadingRegion>
);

// Driver and team pages: the PosterHero block and its stat rail, then the
// columns. Tall enough that the footer stays below the fold.
export const PosterPageSkeleton = () => (
  <LoadingRegion className="flex min-h-svh flex-col gap-3.5 lg:gap-5">
    <div className="flex flex-col">
      <Skeleton className="-mx-4 h-[380px] md:-mx-6 lg:mx-0 lg:mt-6 lg:h-[400px]" />
      <StatRailSkeleton />
    </div>
    <Body />
  </LoadingRegion>
);

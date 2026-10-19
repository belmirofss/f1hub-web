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

// A tab page's title, with its meta beside it on phones. On its own where
// the page's content brings its own skeleton.
export const TabHeaderSkeleton = () => (
  <div
    aria-hidden
    className="flex items-center justify-between pt-[18px] lg:pt-6"
  >
    <Skeleton className="h-9 w-40 lg:h-[54px] lg:w-72" />
    <Skeleton className="h-3 w-16 lg:hidden" />
  </div>
);

const DetailHeaderSkeleton = () => (
  <div aria-hidden className="flex flex-col gap-1 pt-2 lg:gap-1.5 lg:pt-6">
    <div className="flex min-h-11 items-center gap-3 lg:min-h-0">
      <Skeleton className="size-6 lg:hidden" />
      <Skeleton className="h-3 w-32" />
    </div>
    <Skeleton className="h-[34px] w-3/5 lg:h-[54px]" />
  </div>
);

export const TabPageSkeleton = () => (
  <LoadingRegion className="flex flex-col gap-3.5 lg:gap-5">
    <TabHeaderSkeleton />
    <Body />
  </LoadingRegion>
);

export const DetailPageSkeleton = () => (
  <LoadingRegion className="flex flex-col gap-3.5 lg:gap-5">
    <DetailHeaderSkeleton />
    <Body />
  </LoadingRegion>
);

// Settings: the app mark, the clock switch and the ruled list of links
export const SettingsSkeleton = () => (
  <LoadingRegion className="flex flex-col gap-3.5 lg:gap-5">
    <DetailHeaderSkeleton />
    <div className="flex w-full max-w-xl flex-col gap-[18px] pt-1">
      <div className="flex items-center gap-3.5">
        <Skeleton className="size-14" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>
      <Skeleton className="h-[46px] w-full rounded-full" />
      <div className="flex flex-col border-t-2 border-line-dashed">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex min-h-[52px] items-center gap-3 border-b border-line px-1"
          >
            <Skeleton className="size-[18px]" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  </LoadingRegion>
);

// 404, error and offline: the StatusScreen's start lights, label, headline
// and a line of text
export const StatusScreenSkeleton = () => (
  <LoadingRegion className="flex w-full max-w-xl flex-1 flex-col justify-center gap-[18px] py-10">
    <div className="flex gap-1">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-2 flex-1" />
      ))}
    </div>
    <Skeleton className="h-3 w-40" />
    <Skeleton className="h-[34px] w-3/4 lg:h-[54px]" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-11 w-32" />
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

// Circuit page: the header with its tags, then the map beside the side
// panel (under it on phones)
export const TrackHeroSkeleton = () => (
  <LoadingRegion className="flex min-h-svh flex-col gap-3.5 lg:gap-5">
    <div className="flex flex-col gap-1 pt-2 lg:gap-1.5 lg:pt-6">
      <div className="flex min-h-11 items-center gap-3 lg:min-h-0">
        <Skeleton className="size-6 lg:hidden" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-[34px] w-3/5 lg:h-[54px]" />
      <Skeleton className="mt-2 h-8 w-64 rounded-full" />
    </div>
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-10">
      <Skeleton className="aspect-[8/5] max-h-[420px] w-full lg:max-h-[500px]" />
      <div className="flex flex-col gap-6 lg:bg-surface lg:p-6">
        <div className="grid grid-cols-3 gap-x-3 gap-y-4 lg:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-11" />
          ))}
        </div>
        <Skeleton className="h-[100px]" />
        <ListSkeleton rows={5} />
      </div>
    </div>
  </LoadingRegion>
);

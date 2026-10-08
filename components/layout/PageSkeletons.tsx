import {
  CardSkeleton,
  ListSkeleton,
  LoadingRegion,
  Skeleton,
} from "@/components/ui/Skeleton";

// Placeholders for loading.tsx, shaped like a PageHeader plus content

const Body = () => (
  <div className="flex flex-wrap items-start gap-3.5 lg:gap-5">
    <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-3.5 lg:gap-5">
      <CardSkeleton lines={4} />
      <ListSkeleton rows={6} />
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

// Inside a layout that already shows the header (race weekend tabs)
export const ContentSkeleton = () => (
  <LoadingRegion>
    <Body />
  </LoadingRegion>
);

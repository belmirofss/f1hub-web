import { HomeCards } from "@/components/home/HomeCards";
import { LightsOutSkeleton } from "@/components/home/LightsOut";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <LoadingRegion className="flex flex-col gap-6 pt-[18px] lg:gap-9 lg:pt-6">
      <Skeleton className="h-[46px] md:hidden" />
      <LightsOutSkeleton />
      <HomeCards skeleton />
    </LoadingRegion>
  );
}

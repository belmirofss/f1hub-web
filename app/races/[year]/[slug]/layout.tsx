import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { RaceTabs } from "@/components/races/RaceTabs";
import { nameFromSlug } from "@/components/Stub";
import { Skeleton } from "@/components/ui/Skeleton";

// Placeholder header until the race weekend shell (#12)
const RaceHeader = async ({
  params,
}: Pick<LayoutProps<"/races/[year]/[slug]">, "params">) => {
  const { year, slug } = await params;

  return (
    <PageHeader
      back="/calendar"
      meta={`${year} · RACE WEEKEND`}
      title={nameFromSlug(slug)}
    >
      <RaceTabs base={`/races/${year}/${slug}`} />
    </PageHeader>
  );
};

const RaceHeaderSkeleton = () => (
  <div aria-hidden className="flex flex-col gap-3 pt-2 lg:pt-6">
    <Skeleton className="mt-4 h-3 w-32 lg:mt-0" />
    <Skeleton className="mt-1 h-[30px] w-3/5 lg:h-11" />
    <Skeleton className="h-11 w-full" />
  </div>
);

export default function RaceLayout({
  children,
  params,
}: LayoutProps<"/races/[year]/[slug]">) {
  return (
    <>
      <Suspense fallback={<RaceHeaderSkeleton />}>
        <RaceHeader params={params} />
      </Suspense>
      {children}
    </>
  );
}

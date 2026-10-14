import { ArchiveSkeleton } from "@/components/archive/Archive";
import { TabHeaderSkeleton } from "@/components/layout/PageSkeletons";

export default function Loading() {
  return (
    <>
      <TabHeaderSkeleton />
      <ArchiveSkeleton />
    </>
  );
}

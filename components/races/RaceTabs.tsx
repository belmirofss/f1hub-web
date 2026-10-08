"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { Tabs } from "@/components/ui/Tabs";

// Weekend sections under the race header. #12 disables the ones without data.
export const RaceTabs = ({ base }: { base: string }) => {
  const segment = useSelectedLayoutSegment();

  return (
    <Tabs
      label="Weekend sections"
      value={segment ? `${base}/${segment}` : base}
      className="-mx-4 px-1 md:mx-0 md:px-0"
      tabs={[
        { href: `${base}/schedule`, label: "Schedule" },
        { href: base, label: "Race" },
        { href: `${base}/sprint`, label: "Sprint" },
        { href: `${base}/qualifying`, label: "Qualifying" },
        { href: `${base}/analysis`, label: "Analysis" },
        { href: `${base}/radio`, label: "Radio" },
      ]}
    />
  );
};

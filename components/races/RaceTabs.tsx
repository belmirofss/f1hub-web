"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { Tabs, type Tab } from "@/components/ui/Tabs";
import type { WeekendTabs } from "@/lib/raceWeekend";

// Weekend sections under the race header. Sprint only shows on sprint
// weekends and Radio from 2023; tabs without data are disabled.
export const RaceTabs = ({
  base,
  available,
}: {
  base: string;
  available: WeekendTabs;
}) => {
  const segment = useSelectedLayoutSegment();
  const { results, qualifying, sprint, analysis, radio } = available;

  const tabs: Tab[] = [
    { href: `${base}/schedule`, label: "Schedule" },
    { href: base, label: "Race", disabled: !results },
    ...(sprint === undefined
      ? []
      : [{ href: `${base}/sprint`, label: "Sprint", disabled: !sprint }]),
    { href: `${base}/qualifying`, label: "Qualifying", disabled: !qualifying },
    { href: `${base}/analysis`, label: "Analysis", disabled: !analysis },
    ...(radio
      ? [{ href: `${base}/radio`, label: "Radio", disabled: !results }]
      : []),
  ];

  // The base route is the race once there are results, the schedule before
  const current = segment
    ? `${base}/${segment}`
    : results
      ? base
      : `${base}/schedule`;

  return (
    <Tabs
      label="Weekend sections"
      value={current}
      className="-mx-4 px-1 md:mx-0 md:px-0"
      tabs={tabs}
    />
  );
};

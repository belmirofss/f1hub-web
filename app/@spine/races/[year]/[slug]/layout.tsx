import { SeasonSpineSlot } from "@/components/layout/SpineSlot";

// The race's season, with the race selected, on every weekend tab. The tabs
// themselves add nothing to the slot.
export default function RaceSpine({
  params,
  children,
}: LayoutProps<"/races/[year]/[slug]">) {
  return (
    <>
      <SeasonSpineSlot params={params} />
      {children}
    </>
  );
}

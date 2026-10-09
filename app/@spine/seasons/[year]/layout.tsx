import { SeasonSpineSlot } from "@/components/layout/SpineSlot";

// That season, on every tab of /seasons/[year]. The tabs themselves add
// nothing to the slot.
export default function SeasonSpine({
  params,
  children,
}: LayoutProps<"/seasons/[year]">) {
  return (
    <>
      <SeasonSpineSlot params={params} />
      {children}
    </>
  );
}

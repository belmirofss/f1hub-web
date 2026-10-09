import { getRecentSeasonParams } from "@/lib/season";

// Prerenders the last few seasons for every tab; the rest render on their
// first visit
export const generateStaticParams = getRecentSeasonParams;

export default function SeasonLayout({
  children,
}: LayoutProps<"/seasons/[year]">) {
  return children;
}

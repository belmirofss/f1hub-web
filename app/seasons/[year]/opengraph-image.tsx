import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";
import { STANDINGS_ALT, standingsImage } from "@/lib/ogStandings";

export const alt = STANDINGS_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  return standingsImage((await params).year, "drivers");
}

// Driver page helpers, from the app's src/screens/Driver/Driver.tsx
import { CHAMPIONS } from "@/lib/data/champions";

// 1 → "1st", 22 → "22nd", 13 → "13th"
export const ordinal = (n: number) => {
  const suffix = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffix[(v - 20) % 10] ?? suffix[v] ?? suffix[0]}`;
};

// Seasons the driver won the title, oldest first
export const getTitleSeasons = (driverId: string) =>
  CHAMPIONS.filter((c) => c.driverId === driverId).map((c) => c.season);

// 2026 → "'26"
export const shortYear = (season: string) => `'${season.slice(2)}`;

// Half points from the 1950s and shared drives: 7.5, never 7.50
export const formatPoints = (points: number) => String(+points.toFixed(1));

// The API has no date of death, but the Wikipedia description has the life
// span: "Argentine racing driver (1911–1995)" → 1995
export const getDeathYear = (description?: string) => {
  const match = description?.match(/\(\d{4}\s*[–-]\s*(\d{4})\)/);
  return match ? Number(match[1]) : undefined;
};

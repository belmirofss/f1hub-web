// Driver page helpers, from the app's src/screens/Driver/Driver.tsx

import type { Career } from "@/lib/api/jolpica";

// 1 → "1st", 22 → "22nd", 13 → "13th"
export const ordinal = (n: number) => {
  const suffix = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffix[(v - 20) % 10] ?? suffix[v] ?? suffix[0]}`;
};

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

// The seasons someone raced: "1991–2012", or "2012" for one season
export const seasonSpan = (seasons: { season: string }[]) => {
  const first = seasons[0]?.season;
  const last = seasons.at(-1)?.season;
  return first === last ? (first ?? "") : `${first}–${last}`;
};

// A former driver's whole record, in place of the season they last raced
export const formerCareerStats = (
  career: Career,
  titles: number,
): { label: string; value: string | number }[] => [
  { label: "Titles", value: titles },
  { label: "Starts", value: career.starts },
  { label: "Wins", value: career.wins },
  { label: "Podiums", value: career.podiums },
  { label: "Poles", value: career.poles },
  { label: "Seasons", value: career.seasons.length },
  {
    label: "Teams",
    value: new Set(career.races.map((r) => r.Constructor.constructorId)).size,
  },
  {
    label: "Win rate",
    value: career.starts
      ? `${Math.round((career.wins / career.starts) * 100)}%`
      : "–",
  },
];

import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";

// Page metadata. Canonical and Open Graph URLs are paths, resolved against
// the production *.vercel.app address so preview deployments still point
// search engines at production.

export const SITE_NAME = "F1HUB";

export const SITE_DESCRIPTION =
  "Formula 1 calendar, live standings, race results, lap charts, tyre strategy, team radio and every season since 1950.";

const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
export const SITE_URL = productionHost
  ? `https://${productionHost}`
  : "http://localhost:3000";

// Previews and local builds stay out of search results
export const IS_PRODUCTION = process.env.VERCEL_ENV === "production";

export const NOINDEX = { index: false, follow: true } as const;

type PageMetadata = {
  // "Singapore Grand Prix 2026: schedule, results and analysis". The root
  // template adds " | F1HUB" to the <title>, but not to the social cards,
  // which show the site name on their own.
  title: string;
  description: string;
  // "/races/2026/singapore-grand-prix", without the query string
  path: string;
  // The opengraph-image route that draws the page's card, like
  // "/drivers/max_verstappen/opengraph-image". The default card otherwise.
  image?: string;
  noindex?: boolean;
};

export const DEFAULT_IMAGE = "/opengraph-image";

// The card's tags. A page's own `openGraph` replaces the parent's, file-based
// image included, so every page names its image itself. X gets the same PNG.
export const socialImage = (url: string, alt: string) => [
  { url, alt, width: 1200, height: 630, type: "image/png" },
];

// Title, description, canonical URL and social cards for one page. Nested
// fields replace the parent's rather than merging, so every page sets all of
// them. Keys stay out when unset, as an explicit undefined would replace the
// root's robots too (noindex on previews).
export const pageMetadata = ({
  title,
  description,
  path,
  image = DEFAULT_IMAGE,
  noindex,
}: PageMetadata): Metadata => {
  const images = socialImage(image, title);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      url: path,
      title,
      description,
      images,
    },
    twitter: { card: "summary_large_image", title, description, images },
    ...(noindex && { robots: NOINDEX }),
  };
};

// For the data-driven part of a description: a failed request shouldn't
// fail the page, so it falls back to the generic text
export const orFallback = async <T>(load: Promise<T>) => {
  try {
    return await load;
  } catch (error) {
    // Next's own signals (not found, prerender bail-outs) still go through
    unstable_rethrow(error);
    return null;
  }
};

// 1 → "1 win", 3 → "3 wins"
export const plural = (count: number, word: string, many = `${word}s`) =>
  `${count} ${count === 1 ? word : many}`;

// ["a", "b", "c"] → "a, b and c"
export const listOf = (items: string[]) =>
  items.length > 1
    ? `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`
    : (items[0] ?? "");

import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getSitemap, SITEMAP_IDS, type SitemapId } from "@/lib/sitemap";

// /sitemaps/sitemap/pages.xml, /sitemaps/sitemap/races.xml…, listed by the
// index at /sitemap.xml (app/sitemap.xml/route.ts), which can't share the
// root segment with a sitemap.ts

export async function generateSitemaps() {
  return SITEMAP_IDS.map((id) => ({ id }));
}

export default async function sitemap({
  id,
}: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  // Request time, like the search index, so the build doesn't fetch every
  // full list. The lists themselves are cached daily.
  await connection();
  // Next answers unknown ids with a 404 before calling this
  return getSitemap((await id) as SitemapId);
}

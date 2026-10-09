import { SITEMAP_IDS, sitemapUrl } from "@/lib/sitemap";

// The sitemap index search engines get from robots.txt. Next serves each
// sitemap from app/sitemap.ts, but has no index for them.
export function GET() {
  const sitemaps = SITEMAP_IDS.map(
    (id) => `  <sitemap>\n    <loc>${sitemapUrl(id)}</loc>\n  </sitemap>`,
  ).join("\n");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps}\n</sitemapindex>\n`,
    { headers: { "Content-Type": "application/xml" } },
  );
}

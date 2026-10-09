import type { MetadataRoute } from "next";
import { IS_PRODUCTION, SITE_URL } from "@/lib/metadata";

// Production lets crawlers in everywhere but the API, search results and
// settings. Preview deployments keep them out entirely.
export default function robots(): MetadataRoute.Robots {
  if (!IS_PRODUCTION) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/search", "/settings"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

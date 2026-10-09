import { NextResponse, type NextRequest } from "next/server";
import { isSeasonYear } from "@/lib/domain/routes";

// Season and race pages stream from their loading screens, which sends a 200
// before the page can call notFound(). Years that can't have a season get a
// real 404 here instead: before 1950, past next year (whose calendar can be
// out early) or not a year at all. Unknown race slugs need the API, so they
// still get the streamed not-found page, with its noindex tag.

export const config = {
  matcher: ["/seasons/:year/:path*", "/races/:year/:path*"],
};

export function proxy(request: NextRequest) {
  const year = request.nextUrl.pathname.split("/")[2];
  const nextYear = new Date().getUTCFullYear() + 1;
  if (isSeasonYear(year) && Number(year) <= nextYear) return;

  // No route matches this path, so it renders app/not-found.tsx with a 404
  return NextResponse.rewrite(new URL("/_not-found", request.url));
}

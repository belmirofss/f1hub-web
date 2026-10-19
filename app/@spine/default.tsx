import { CurrentSeasonSpine } from "@/components/layout/SpineSlot";

// The current season, for full page loads of URLs the other files here don't
// match (a 404). Every page has its own file, because default.tsx doesn't
// cover client navigations: an unmatched slot would keep showing the last
// season. Not a [...rest] catch-all: Next 16.4 prefetched its segment for
// some /drivers links in an endless loop, hundreds of requests a second.
export default CurrentSeasonSpine;

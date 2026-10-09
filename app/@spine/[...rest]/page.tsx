import { CurrentSeasonSpine } from "@/components/layout/SpineSlot";

// Every other page. default.tsx only covers full page loads: on a client
// navigation an unmatched slot would keep showing the last season.
export default CurrentSeasonSpine;

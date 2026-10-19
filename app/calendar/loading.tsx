import { CalendarSkeleton } from "@/components/calendar/Calendar";

// The view isn't known here, so it's the default one's. The page's own
// fallback matches the view once the URL is read.
export default function Loading() {
  return <CalendarSkeleton />;
}

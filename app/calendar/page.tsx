import { Suspense } from "react";
import type { Metadata } from "next";
import { Calendar, CalendarSkeleton } from "@/components/calendar/Calendar";

export const metadata: Metadata = {
  title: "Calendar",
  description:
    "Every round of the Formula 1 season: dates in your time zone, sprint weekends and the winner of each race.",
};

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <Calendar />
    </Suspense>
  );
}

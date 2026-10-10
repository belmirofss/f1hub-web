import { connection } from "next/server";
import { getSessionEnd, getSessions } from "@/lib/domain/sessions";
import { SITE_NAME, SITE_URL } from "@/lib/metadata";
import { getRaceWeekend, getWeekendName } from "@/lib/raceWeekend";

// The weekend's sessions as an iCalendar file, for the calendar's "Add to
// calendar" link: one event per session, at its UTC start and planned length

// 20261011T120000Z
const icsTime = (time: number) =>
  new Date(time).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");

// Commas, semicolons and backslashes are separators in text values
const icsText = (text: string) => text.replace(/([\\,;])/g, "\\$1");

export async function GET(
  _request: Request,
  { params }: RouteContext<"/races/[year]/[slug]/calendar.ics">,
) {
  // DTSTAMP is when the file was made
  await connection();
  const { year, slug } = await params;
  const { race, href } = await getRaceWeekend(year, slug);
  const { circuitName, Location } = race.Circuit;
  const location = icsText(
    `${circuitName}, ${Location.locality}, ${Location.country}`,
  );
  const url = `${SITE_URL}${href}`;
  const stamp = icsTime(Date.now());

  const events = getSessions(race).flatMap((session) => {
    // Without a time only the day is known: an all-day event
    const when = session.hasTime
      ? [
          `DTSTART:${icsTime(session.start.getTime())}`,
          `DTEND:${icsTime(getSessionEnd(session))}`,
        ]
      : [
          `DTSTART;VALUE=DATE:${session.start.toISOString().slice(0, 10).replace(/-/g, "")}`,
        ];
    return [
      "BEGIN:VEVENT",
      `UID:${race.season}-${race.round}-${session.key}@f1hub`,
      `DTSTAMP:${stamp}`,
      ...when,
      `SUMMARY:${icsText(`${race.raceName}: ${session.name}`)}`,
      `LOCATION:${location}`,
      `URL:${url}`,
      "END:VEVENT",
    ];
  });

  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${SITE_NAME}//Race weekend//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsText(getWeekendName(race))}`,
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(`${body}\r\n`, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-${year}.ics"`,
    },
  });
}

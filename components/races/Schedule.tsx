import { ExternalLink } from "lucide-react";
import { Columns } from "@/components/layout/Columns";
import { LocalTime, TrackTime, UtcOffset } from "@/components/time/LocalTime";
import { LinkCard } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { WeekendForecast } from "@/components/weather/WeekendForecast";
import { getRaceForecast } from "@/lib/api/openMeteo";
import type { Race } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { getCircuitLayout, getCircuitTimezone } from "@/lib/domain/circuits";
import { circuitHref } from "@/lib/domain/routes";
import {
  getRaceStart,
  getSessions,
  untimedLabel,
  type Session,
} from "@/lib/domain/sessions";
import { EXTERNAL_LINK } from "@/lib/links";
import { orFallback } from "@/lib/metadata";
import { getWeekendTabs } from "@/lib/raceWeekend";
import { WeekendTimeline } from "./WeekendTimeline";

// The weather is extra: if Open-Meteo is down the schedule still shows
const loadForecast = async (race: Race) => {
  try {
    return await getRaceForecast(race);
  } catch (error) {
    console.error(error);
    return null;
  }
};

const SessionRow = ({
  session,
  trackZone,
  over,
}: {
  session: Session;
  trackZone?: string;
  over: boolean;
}) => {
  const isRace = session.key === "race";

  return (
    <tr className="h-[54px] border-b border-line-soft">
      <th scope="row" className="text-left font-normal">
        <span
          className={cn(
            "block text-[15px] font-bold",
            isRace && "text-accent-ink",
          )}
        >
          {session.name}
        </span>
        <span className="block font-mono text-[11px] text-muted">
          {session.hasTime ? (
            <LocalTime value={session.start} format="day" />
          ) : (
            // Only the date is known, and the API gives it in UTC
            <TrackTime value={session.start} format="day" timeZone="UTC" />
          )}
        </span>
      </th>
      <td className="pl-2 text-right font-mono text-base font-bold">
        {session.hasTime ? (
          <LocalTime value={session.start} />
        ) : (
          untimedLabel(over)
        )}
      </td>
      {trackZone && (
        <td className="pl-2 text-right font-mono text-[13px] text-muted">
          {session.hasTime ? (
            <TrackTime value={session.start} timeZone={trackZone} />
          ) : (
            "—"
          )}
        </td>
      )}
    </tr>
  );
};

// Every session in the visitor's time and at the track. `over` once the
// weekend has results.
const SessionsTable = ({ race, over }: { race: Race; over: boolean }) => {
  const trackZone = getCircuitTimezone(race.Circuit.circuitId);

  return (
    <section aria-labelledby="sessions">
      <h2 id="sessions" className="sr-only">
        Sessions
      </h2>
      <table className="w-full">
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="pb-1.5 text-left font-normal">
              <Label>Session</Label>
            </th>
            <th scope="col" className="pb-1.5 pl-2 text-right font-normal">
              <Label className="whitespace-nowrap text-text">
                You · <UtcOffset at={getRaceStart(race)} />
              </Label>
            </th>
            {trackZone && (
              <th scope="col" className="pb-1.5 pl-2 text-right font-normal">
                <Label>Track</Label>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {getSessions(race).map((session) => (
            <SessionRow
              key={session.key}
              session={session}
              trackZone={trackZone}
              over={over}
            />
          ))}
        </tbody>
      </table>
    </section>
  );
};

const CircuitInfo = ({ race }: { race: Race }) => {
  const { circuitName, Location } = race.Circuit;
  const trackZone = getCircuitTimezone(race.Circuit.circuitId);
  const rows = [
    { label: "Circuit", value: circuitName },
    { label: "Location", value: `${Location.locality}, ${Location.country}` },
    ...(trackZone
      ? [
          {
            label: "Track time",
            value: <UtcOffset timeZone={trackZone} at={getRaceStart(race)} />,
          },
        ]
      : []),
  ];

  return (
    <dl>
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex justify-between gap-3 border-b border-line-soft py-2.5"
        >
          <dt className="text-muted">{row.label}</dt>
          <dd className="text-right font-semibold">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
};

// The Schedule tab: weekend timeline, forecast, session times and circuit
export const Schedule = async ({ race }: { race: Race }) => {
  const sessions = getSessions(race);
  // Results mean the weekend is over, without reading the clock per request
  const [forecast, tabs] = await Promise.all([
    loadForecast(race),
    orFallback(getWeekendTabs(race)),
  ]);
  const { circuitId, circuitName } = race.Circuit;
  const layout = getCircuitLayout(circuitId);

  return (
    <Columns
      asideLabel="Circuit"
      aside={
        <>
          <CircuitInfo race={race} />
          <LinkCard href={circuitHref(circuitId)}>
            <span className="text-[15px] font-bold">{circuitName}</span>
            <span className="font-mono text-[10px] text-muted">
              {layout &&
                `${layout.length.toFixed(3)} KM · ${layout.corners} CORNERS · `}
              TRACK MAP AND HISTORY
            </span>
          </LinkCard>
          <a
            href={race.url.replace(/^http:/, "https:")}
            {...EXTERNAL_LINK}
            className="flex min-h-11 items-center justify-between gap-3 rounded-md bg-surface px-3 text-sm font-semibold transition-colors hover:bg-surface-raised"
          >
            Race history on Wikipedia
            <ExternalLink aria-hidden size={16} strokeWidth={2} />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </>
      }
    >
      {sessions.length > 1 && sessions.every((s) => s.hasTime) && (
        <WeekendTimeline
          sessions={sessions.map((session) => ({
            key: session.key,
            short: session.short,
            start: session.start.toISOString(),
          }))}
        />
      )}
      {forecast && <WeekendForecast race={race} forecast={forecast} />}
      <SessionsTable race={race} over={!!tabs?.results} />
    </Columns>
  );
};

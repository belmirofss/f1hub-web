// Throwaway gallery of the shared UI primitives. Delete it in #28.
import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  ChartLine,
  ChevronLeft,
  CircleDot,
  Mic,
  Share,
  SlidersHorizontal,
} from "lucide-react";
import {
  Card,
  IconButton,
  InlineLink,
  LinkCard,
  TeamBar,
} from "@/components/ui/Card";
import { FormChip, FormChips, FormLegend } from "@/components/ui/FormChips";
import type { Form } from "@/components/ui/FormChips";
import { Label } from "@/components/ui/Label";
import { Segmented } from "@/components/ui/Segmented";
import {
  CardSkeleton,
  ListSkeleton,
  LoadingRegion,
  Skeleton,
} from "@/components/ui/Skeleton";
import { SplitBar } from "@/components/ui/SplitBar";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatRows } from "@/components/ui/StatRows";
import { EmptyState } from "@/components/ui/States";
import { Tabs } from "@/components/ui/Tabs";
import { Countdown } from "@/components/time/Countdown";
import { LocalTime, TrackTime, UtcOffset } from "@/components/time/LocalTime";
import type { TimeFormat } from "@/components/time/LocalTime";
import {
  SessionTime,
  TimeZoneModeProvider,
  TimeZoneToggle,
} from "@/components/time/TimeZoneMode";
import { getDriverCode, getDriverName, getTeamColor } from "@/lib/domain/teams";
import { RetryDemo } from "./Demos";

export const metadata: Metadata = {
  title: "UI primitives",
  robots: { index: false },
};

const COLORS = [
  ["background", "bg-background"],
  ["surface", "bg-surface"],
  ["surface-raised", "bg-surface-raised"],
  ["line", "bg-line"],
  ["line-soft", "bg-line-soft"],
  ["line-dashed", "bg-line-dashed"],
  ["text", "bg-text"],
  ["soft", "bg-soft"],
  ["muted", "bg-muted"],
  ["faint", "bg-faint"],
  ["subtle", "bg-subtle"],
  ["light-off", "bg-light-off"],
  ["accent", "bg-accent"],
  ["sprint", "bg-sprint"],
  ["purple", "bg-purple"],
  ["gain", "bg-gain"],
  ["loss", "bg-loss"],
  ["rain", "bg-rain"],
];

const TOP5: {
  driver: { code: string; familyName: string };
  team: string;
  form: Form;
  pts: number;
}[] = [
  {
    driver: { code: "ANT", familyName: "Antonelli" },
    team: "mercedes",
    form: [2, 1, 1, 5, 2],
    pts: 320,
  },
  {
    driver: { code: "RUS", familyName: "Russell" },
    team: "mercedes",
    form: [3, 2, 5, 1, 20],
    pts: 236,
  },
  {
    driver: { code: "HAM", familyName: "Hamilton" },
    team: "ferrari",
    form: [4, 6, 0, 6, 3],
    pts: 214,
  },
  {
    driver: { code: "LEC", familyName: "Leclerc" },
    team: "ferrari",
    form: [5, 0, 4, 4, 4],
    pts: 191,
  },
  {
    driver: { code: "HAD", familyName: "Hadjar" },
    team: "red_bull",
    form: [null, null, null, 3, 5],
    pts: 96,
  },
];

// Singapore 2026 as drawn in the prototype (track time is GMT+8)
const TRACK_ZONE = "Asia/Singapore";

const SESSIONS = [
  { name: "Practice 1", start: "2026-10-09T08:30:00Z" },
  { name: "Sprint Qualifying", start: "2026-10-09T12:30:00Z" },
  { name: "Sprint", start: "2026-10-10T09:00:00Z" },
  { name: "Qualifying", start: "2026-10-10T13:00:00Z" },
  { name: "Race", start: "2026-10-11T12:00:00Z" },
];

const RACE_START = new Date(SESSIONS[4].start);

const FORMATS: TimeFormat[] = [
  "clock",
  "day",
  "dayClock",
  "shortDate",
  "range",
];

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="flex flex-col gap-3">
    <h2 className="text-lg font-bold">{title}</h2>
    {children}
  </section>
);

export default function UiPage() {
  const mercedes = getTeamColor("mercedes");
  const cadillac = getTeamColor("cadillac");

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col gap-10 py-8">
      <header className="flex items-center justify-between">
        <h1 className="inline-block -skew-x-[10deg] text-[26px] font-black tracking-[-0.5px]">
          F1<span className="text-accent">HUB</span>
        </h1>
        <IconButton href="/dev/ui" label="Settings">
          <SlidersHorizontal size={18} />
        </IconButton>
      </header>

      <Section title="Tokens">
        <div className="grid grid-cols-3 gap-2">
          {COLORS.map(([name, bg]) => (
            <div key={name} className="flex flex-col gap-1">
              <div className={`h-10 rounded-md border border-line ${bg}`} />
              <Label className="text-[10px] normal-case">{name}</Label>
            </div>
          ))}
        </div>
        <p className="text-[15px]">
          Titillium <span className="font-semibold">600</span>{" "}
          <span className="font-bold">700</span>{" "}
          <span className="font-black">900</span> ·{" "}
          <span className="font-mono">Mono 500</span>{" "}
          <span className="font-mono font-bold">700</span>
        </p>
      </Section>

      <Section title="Card · Label · InlineLink · TeamBar · StatRows">
        <Card as="section" aria-label="Last race">
          <div className="flex items-center justify-between">
            <Label>Last race · Kuala Lumpur</Label>
            <InlineLink href="/dev/ui">Results</InlineLink>
          </div>
          <div className="flex items-center gap-3">
            <TeamBar color={getTeamColor("red_bull")} height={44} />
            <div className="flex-1">
              <div className="text-xs text-muted">
                Bahrain Grand Prix in Malaysia winner
              </div>
              <div className="text-xl font-bold">
                {getDriverName({ givenName: "Max", familyName: "Verstappen" })}
              </div>
            </div>
            <span className="font-mono text-[13px]">1:47:14.808</span>
          </div>
          <StatRows
            className="border-t border-line"
            stats={[
              { label: "Pole", who: "Max Verstappen", value: "1:35.130" },
              {
                label: "Fastest lap",
                labelClassName: "text-purple",
                who: "Max Verstappen",
                value: "1:38.220",
              },
              {
                label: "Top gainer",
                labelClassName: "text-gain",
                who: "Arvid Lindblad",
                value: "▲12 · P22→P10",
              },
              {
                label: "Retirements",
                labelClassName: "text-loss",
                who: "ALB · BOT",
              },
            ]}
          />
          <div className="flex gap-2">
            {[
              { icon: ChartLine, label: "Lap chart" },
              { icon: CircleDot, label: "Tyres" },
              { icon: Mic, label: "Radio" },
            ].map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
                className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-surface-raised text-[13px] font-bold"
              >
                <Icon size={16} aria-hidden />
                {label}
              </a>
            ))}
          </div>
        </Card>
      </Section>

      <Section title="FormChips · FormLegend">
        <Card as="section" aria-label="Top five drivers" className="gap-1">
          <div className="mb-1 flex items-center justify-between">
            <Label>Top 5 · last 5 races</Label>
            <InlineLink href="/dev/ui">All</InlineLink>
          </div>
          {TOP5.map((row, index) => (
            <a
              key={row.driver.code}
              href="#"
              className="flex min-h-11 items-center gap-2 border-t border-line-soft"
            >
              <span className="w-[18px] font-mono text-sm font-bold">
                {index + 1}
              </span>
              <TeamBar color={getTeamColor(row.team)} height={24} />
              <span className="flex-1 font-bold">
                {getDriverCode(row.driver)}
              </span>
              <FormChips form={row.form} />
              <span className="w-10 text-right font-mono text-sm font-bold">
                {row.pts}
              </span>
            </a>
          ))}
          <FormLegend className="border-t border-line-soft pt-2.5" />
        </Card>
        <div className="flex gap-[3px]">
          {[1, 2, 3, 4, 10, 11, 20, 0, null].map((position, index) => (
            <FormChip key={index} position={position} size={18} />
          ))}
        </div>
      </Section>

      <Section title="LinkCard · SplitBar">
        <LinkCard
          href="/dev/ui"
          aria-label="Closest teammate battle: Bottas 8, Pérez 8 in qualifying"
        >
          <Label>Closest teammate battle</Label>
          <span className="flex items-center gap-2.5">
            <TeamBar color={cadillac} height={36} />
            <span className="flex flex-1 flex-col gap-1.5">
              <span className="flex items-baseline justify-between">
                <span className="font-bold">Bottas</span>
                <span className="font-mono text-[10px] text-muted">
                  CADILLAC · QUALI
                </span>
                <span className="font-bold text-muted">Pérez</span>
              </span>
              <SplitBar a={8} b={8} color={cadillac} />
            </span>
            <span className="font-mono font-bold">8–8</span>
          </span>
        </LinkCard>
        <Card
          as="section"
          aria-label="Mercedes teammate battle"
          className="gap-3.5"
        >
          {[
            ["Qualifying", 8, 7],
            ["Race", 9, 5],
            ["Points", 320, 236],
            ["Podiums", 0, 8],
          ].map(([label, a, b]) => (
            <div key={label} className="flex flex-col gap-1.5">
              <div className="flex items-baseline">
                <span
                  className={`w-16 font-mono font-bold ${a > b ? "" : "text-muted"}`}
                >
                  {a}
                </span>
                <Label className="flex-1 text-center text-[10px]">
                  {label}
                </Label>
                <span
                  className={`w-16 text-right font-mono font-bold ${b > a ? "" : "text-muted"}`}
                >
                  {b}
                </span>
              </div>
              <SplitBar a={Number(a)} b={Number(b)} color={mercedes} />
            </div>
          ))}
        </Card>
      </Section>

      <Section title="StatGrid">
        <Card>
          <StatGrid
            stats={[
              { label: "Pts", value: 423 },
              { label: "Wins", value: 7, className: "text-accent" },
              { label: "Podiums", value: 18 },
              { label: "Poles", value: 5 },
            ]}
          />
        </Card>
      </Section>

      <Section title="Segmented">
        <Segmented
          label="Standings view"
          value="drivers"
          options={[
            { value: "drivers", label: "Drivers", href: "/dev/ui" },
            {
              value: "constructors",
              label: "Constructors",
              href: "/dev/ui?view=constructors",
            },
            {
              value: "teammates",
              label: "Teammates",
              href: "/dev/ui?view=teammates",
            },
          ]}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-[1px] text-muted">
            SESSIONS
          </span>
          <TimeZoneModeProvider trackTimeZone={TRACK_ZONE}>
            <TimeZoneToggle />
          </TimeZoneModeProvider>
        </div>
        <Segmented
          label="Season"
          value="2026"
          options={[
            { value: "2026", label: "2026", href: "/dev/ui" },
            { value: "2027", label: "2027", disabled: true },
          ]}
        />
      </Section>

      <Section title="LocalTime · TrackTime · UtcOffset · Countdown">
        <Card as="section" aria-label="Next race" className="gap-3.5">
          <Label>Next race · R17/23</Label>
          <Countdown target={RACE_START} />
          <TimeZoneModeProvider trackTimeZone={TRACK_ZONE}>
            <div className="flex flex-col">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-bold tracking-[1px] text-muted">
                  SESSIONS
                </span>
                <TimeZoneToggle />
              </div>
              {SESSIONS.map((session) => {
                const isRace = session.name === "Race";
                return (
                  <div
                    key={session.name}
                    className="flex min-h-10 items-center border-t border-line"
                  >
                    <SessionTime
                      value={session.start}
                      format="day"
                      className="w-16 font-mono text-xs text-muted"
                    />
                    <span
                      className={`flex-1 font-semibold ${isRace ? "text-accent" : ""}`}
                    >
                      {session.name}
                    </span>
                    <SessionTime
                      value={session.start}
                      className={`font-mono font-bold ${isRace ? "text-accent" : ""}`}
                    />
                  </div>
                );
              })}
            </div>
          </TimeZoneModeProvider>
        </Card>
        <Countdown target="2026-10-04T08:00:00Z" />
        <section aria-label="Sessions">
          <div className="flex border-b border-line pb-1.5">
            <Label className="flex-1">Session</Label>
            <Label className="w-[88px] text-right whitespace-nowrap text-text">
              You · <UtcOffset at={RACE_START} />
            </Label>
            <Label className="w-[72px] text-right">Track</Label>
          </div>
          {SESSIONS.map((session) => (
            <div
              key={session.name}
              className="flex min-h-[54px] items-center border-b border-line-soft"
            >
              <span className="flex-1">
                <span className="block font-bold">{session.name}</span>
                <LocalTime
                  value={session.start}
                  format="day"
                  className="block font-mono text-[11px] text-muted"
                />
              </span>
              <LocalTime
                value={session.start}
                className="w-[88px] text-right font-mono text-base font-bold"
              />
              <TrackTime
                value={session.start}
                timeZone={TRACK_ZONE}
                className="w-[72px] text-right font-mono text-[13px] text-muted"
              />
            </div>
          ))}
          <div className="flex justify-between gap-3 border-b border-line-soft py-2.5">
            <span className="text-muted">Track time</span>
            <UtcOffset
              timeZone={TRACK_ZONE}
              at={RACE_START}
              className="font-semibold"
            />
          </div>
        </section>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-[13px]">
          {FORMATS.map((format) => (
            <div key={format} className="contents">
              <dt className="text-muted">{format}</dt>
              <dd>
                <LocalTime
                  value={SESSIONS[0].start}
                  end={RACE_START}
                  format={format}
                />
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Tabs">
        <div className="-ml-2.5 flex items-center">
          <IconButton href="/dev/ui" label="Back" bordered={false}>
            <ChevronLeft size={18} />
          </IconButton>
          <Label className="text-xs">R16 · MYS · 04 OCT</Label>
          <IconButton label="Share" bordered={false} className="ml-auto">
            <Share size={18} />
          </IconButton>
        </div>
        <Tabs
          label="Weekend sections"
          value="/dev/ui"
          className="-mx-4 px-1"
          tabs={[
            { href: "/dev/ui?tab=schedule", label: "Schedule" },
            { href: "/dev/ui", label: "Race" },
            { href: "/dev/ui?tab=sprint", label: "Sprint", disabled: true },
            { href: "/dev/ui?tab=qualifying", label: "Qualifying" },
            { href: "/dev/ui?tab=analysis", label: "Analysis" },
            { href: "/dev/ui?tab=radio", label: "Radio" },
          ]}
        />
      </Section>

      <Section title="EmptyState · ErrorState">
        <Card>
          <EmptyState>No results yet. Check back after the race.</EmptyState>
        </Card>
        <Card>
          <RetryDemo />
        </Card>
      </Section>

      <Section title="Skeletons">
        <LoadingRegion className="flex flex-col gap-3.5">
          <Skeleton className="h-11 w-full rounded-lg" />
          <CardSkeleton />
          <ListSkeleton rows={4} />
        </LoadingRegion>
      </Section>
    </div>
  );
}

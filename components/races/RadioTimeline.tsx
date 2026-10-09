"use client";

// Ported from the app's src/screens/RaceWeekend/RadioTab.tsx. The timeline
// comes built from the server; this filters it and plays the clips through
// one <audio> element shared by every row, so only one clip plays at a time.
import { memo, useCallback, useRef, useState } from "react";
import { LoaderCircle, Pause, Play } from "lucide-react";
import { LocalTime } from "@/components/time/LocalTime";
import { TeamBar } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import { EmptyState } from "@/components/ui/States";
import { cn } from "@/lib/cn";

export type TimelineItem =
  | {
      kind: "radio";
      time: number;
      lap: number | null;
      url: string;
      name: string;
      color: string;
    }
  | {
      kind: "control";
      time: number;
      lap: number | null;
      label: string;
      labelClassName: string;
      // Undefined when the message isn't a flag, which shows an empty swatch
      flagClassName?: string;
      message: string;
    };

export type RadioSummary = {
  yellows: number;
  safetyCars: number;
  deleted: number;
};

type RadioItem = Extract<TimelineItem, { kind: "radio" }>;
type ControlItem = Extract<TimelineItem, { kind: "control" }>;

type Filter = "all" | "radio" | "control";

// "0:06"
const formatDuration = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

const Summary = ({ summary }: { summary: RadioSummary }) => (
  <dl className="grid grid-cols-3 gap-2">
    {[
      {
        value: summary.yellows,
        label: "Yellow flags",
        className: "text-sprint-ink",
      },
      { value: summary.safetyCars, label: "Safety cars" },
      { value: summary.deleted, label: "Laps deleted", className: "text-loss" },
    ].map((stat) => (
      <div
        key={stat.label}
        className="flex min-w-0 flex-col-reverse justify-end gap-0.5 rounded-[10px] border border-line bg-surface px-2.5 py-2.5"
      >
        <dt className="font-mono text-[10px] font-medium tracking-[1px] text-muted uppercase">
          {stat.label}
        </dt>
        <dd className={cn("font-mono text-xl font-bold", stat.className)}>
          {stat.value}
        </dd>
      </div>
    ))}
  </dl>
);

type RadioRowProps = {
  item: RadioItem;
  // This row's clip is the one loaded in the player
  active: boolean;
  // Playing, or about to: the button turns into Pause
  playing: boolean;
  loading: boolean;
  position: number;
  duration: number;
  failed: boolean;
  onToggle: (url: string) => void;
};

// Rows are memoised: the player ticks a few times a second, and only the
// row it's playing needs to follow
const RadioRow = memo(function RadioRow({
  item,
  active,
  playing,
  loading,
  position,
  duration,
  failed,
  onToggle,
}: RadioRowProps) {
  const progress = active && duration ? Math.min(position / duration, 1) : 0;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border bg-surface py-2 pr-2 pl-3",
        playing ? "border-line-dashed" : "border-line",
      )}
    >
      <TeamBar color={item.color} height={30} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="min-w-0 truncate text-[15px] font-bold">
            {item.name}
          </span>
          {/* Phones drop the tag so the name has room */}
          <span className="shrink-0 font-mono text-[10px] text-muted">
            <span className="max-sm:sr-only">TEAM RADIO · </span>
            <LocalTime value={item.time} />
          </span>
        </div>
        <div className="flex h-3 items-center gap-2">
          <div
            aria-hidden
            className="h-1 min-w-0 flex-1 overflow-hidden rounded-[2px] bg-light-off"
          >
            <div
              className="h-full rounded-[2px] bg-accent transition-[width] duration-250 ease-linear"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          {failed ? (
            <span role="status" className="font-mono text-[10px] text-loss">
              Couldn&apos;t play
            </span>
          ) : (
            active &&
            duration > 0 && (
              <span className="font-mono text-[10px] text-muted tabular-nums">
                <span className="sr-only">Played </span>
                {formatDuration(position)}
                <span aria-hidden> / </span>
                <span className="sr-only"> of </span>
                {formatDuration(duration)}
              </span>
            )
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onToggle(item.url)}
        aria-label={`${playing ? "Pause" : "Play"} radio from ${item.name}`}
        aria-busy={loading}
        className={cn(
          "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors",
          playing
            ? "bg-accent text-on-accent"
            : "bg-surface-raised text-text hover:bg-line",
        )}
      >
        {loading ? (
          <LoaderCircle
            aria-hidden
            size={18}
            strokeWidth={2.5}
            className="motion-safe:animate-spin"
          />
        ) : playing ? (
          <Pause aria-hidden size={16} fill="currentColor" strokeWidth={0} />
        ) : (
          <Play aria-hidden size={16} fill="currentColor" strokeWidth={0} />
        )}
      </button>
    </div>
  );
});

const ControlRow = memo(function ControlRow({ item }: { item: ControlItem }) {
  return (
    <div className="flex gap-2.5 rounded-lg border border-dashed border-line-dashed px-3 py-2.5">
      <span
        aria-hidden
        className={cn(
          "mt-0.5 size-3.5 shrink-0 rounded-[3px]",
          item.flagClassName ?? "border border-subtle",
        )}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "font-mono text-[10px] tracking-[1px]",
            item.labelClassName,
          )}
        >
          {item.label} · <LocalTime value={item.time} />
        </span>
        <p className="font-mono text-xs leading-[18px] break-words text-soft">
          {item.message}
        </p>
      </div>
    </div>
  );
});

export const RadioTimeline = ({
  items,
  summary,
}: {
  items: TimelineItem[];
  summary: RadioSummary;
}) => {
  const [filter, setFilter] = useState<Filter>("all");

  const audioRef = useRef<HTMLAudioElement>(null);
  // The clip last given to the player (audio.src comes back normalised)
  const loadedRef = useRef<string | null>(null);
  // The clip in the player, until it ends
  const [current, setCurrent] = useState<string | null>(null);
  // Play was tapped and not paused since
  const [wantsPlay, setWantsPlay] = useState(false);
  // Sound is coming out. Between the tap and this the clip is buffering,
  // since it's streamed.
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState<string | null>(null);

  const stop = useCallback(() => {
    setCurrent(null);
    setWantsPlay(false);
    setPlaying(false);
  }, []);

  // The next tap on the clip loads it again
  const fail = useCallback(
    (url: string | null) => {
      loadedRef.current = null;
      setFailed(url);
      stop();
    },
    [stop],
  );

  const toggle = useCallback(
    (url: string) => {
      const audio = audioRef.current;
      if (!audio) return;
      setFailed(null);

      if (loadedRef.current !== url) {
        loadedRef.current = url;
        audio.src = url;
        setPosition(0);
        setDuration(0);
        setPlaying(false);
      } else if (!audio.paused) {
        audio.pause();
        setWantsPlay(false);
        return;
      }

      // play() has to start inside the tap for iOS Safari to allow sound
      setCurrent(url);
      setWantsPlay(true);
      audio.play().catch((error: unknown) => {
        // Another clip (or a pause) took over before this one started
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        fail(url);
      });
    },
    [fail],
  );

  const shown = items
    .map((item, index) => ({ item, key: index }))
    .filter(
      ({ item }) =>
        filter === "all" || (filter === "radio") === (item.kind === "radio"),
    );

  return (
    <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-5">
      {/* First in the page so the filter comes before the list, and beside
          it on desktop, where it stays in view while the list scrolls */}
      <div className="flex flex-col gap-3.5 lg:sticky lg:top-5 lg:col-start-2 lg:row-start-1">
        <Segmented
          label="Show"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "radio", label: "Radio" },
            { value: "control", label: "Race control" },
          ]}
        />
        <Summary summary={summary} />
      </div>

      <div className="flex min-w-0 flex-col gap-3.5 lg:col-start-1 lg:row-start-1">
        {shown.length ? (
          <ol aria-label="Timeline, newest first">
            {shown.map(({ item, key }) => {
              const active = item.kind === "radio" && item.url === current;
              return (
                <li key={key} className="flex gap-3">
                  <div className="flex w-10 shrink-0 flex-col items-center">
                    <span className="pt-3.5 font-mono text-[11px] font-bold text-muted">
                      {item.lap ? (
                        <>
                          <span aria-hidden>L{item.lap}</span>
                          <span className="sr-only">Lap {item.lap}</span>
                        </>
                      ) : (
                        <span aria-hidden>–</span>
                      )}
                    </span>
                    <span aria-hidden className="mt-1.5 w-px flex-1 bg-line" />
                  </div>
                  <div className="min-w-0 flex-1 pb-2.5">
                    {item.kind === "radio" ? (
                      <RadioRow
                        item={item}
                        active={active}
                        playing={active && wantsPlay}
                        loading={active && wantsPlay && !playing}
                        position={active ? position : 0}
                        duration={active ? duration : 0}
                        failed={failed === item.url}
                        onToggle={toggle}
                      />
                    ) : (
                      <ControlRow item={item} />
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyState>Nothing here for this race.</EmptyState>
        )}
        <p className="text-xs leading-[18px] text-muted">
          Radio clips and race control messages come from OpenF1 and appear
          after the session.
        </p>
      </div>

      <audio
        ref={audioRef}
        preload="none"
        onPlaying={() => setPlaying(true)}
        onPause={(event) => {
          setPlaying(false);
          // Paused from outside the page too (another app took the audio,
          // headphones unplugged). A late event from the previous clip
          // comes while the new one is already playing, so it's skipped.
          if (event.currentTarget.paused) setWantsPlay(false);
        }}
        onWaiting={() => setPlaying(false)}
        onEnded={stop}
        onError={() => fail(current)}
        onTimeUpdate={(event) => setPosition(event.currentTarget.currentTime)}
        onDurationChange={(event) => {
          const { duration } = event.currentTarget;
          setDuration(Number.isFinite(duration) ? duration : 0);
        }}
      />
    </div>
  );
};

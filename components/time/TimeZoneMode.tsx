"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Segmented } from "@/components/ui/Segmented";
import { LocalTime, TrackTime } from "./LocalTime";
import type { TimeProps } from "./LocalTime";

type Mode = "mine" | "track";

type TimeZoneMode = {
  mode: Mode;
  setMode: (mode: Mode) => void;
  trackTimeZone?: string;
};

const TimeZoneModeContext = createContext<TimeZoneMode>({
  mode: "mine",
  setMode: () => {},
});

// Shares the "My time | Track" choice between a toggle and the session times
// under it. Without a track zone (a circuit missing from the map) it stays on
// the viewer's time.
export const TimeZoneModeProvider = ({
  trackTimeZone,
  children,
}: {
  trackTimeZone?: string;
  children: ReactNode;
}) => {
  const [mode, setMode] = useState<Mode>("mine");

  const value = useMemo<TimeZoneMode>(
    () => ({ mode: trackTimeZone ? mode : "mine", setMode, trackTimeZone }),
    [mode, trackTimeZone],
  );

  return <TimeZoneModeContext value={value}>{children}</TimeZoneModeContext>;
};

// Hidden when there's no track zone to switch to
export const TimeZoneToggle = ({ className }: { className?: string }) => {
  const { mode, setMode, trackTimeZone } = useContext(TimeZoneModeContext);
  if (!trackTimeZone) return null;

  return (
    <Segmented
      label="Time zone"
      size="small"
      value={mode}
      onChange={setMode}
      className={className}
      options={[
        { value: "mine", label: "My time" },
        { value: "track", label: "Track" },
      ]}
    />
  );
};

// The zone the toggle has picked: the track's, or undefined for the viewer's
export const useSessionTimeZone = () => {
  const { mode, trackTimeZone } = useContext(TimeZoneModeContext);
  return mode === "track" ? trackTimeZone : undefined;
};

// A session time in the zone the toggle has picked
export const SessionTime = (props: TimeProps) => {
  const timeZone = useSessionTimeZone();

  return timeZone ? (
    <TrackTime {...props} timeZone={timeZone} />
  ) : (
    <LocalTime {...props} />
  );
};

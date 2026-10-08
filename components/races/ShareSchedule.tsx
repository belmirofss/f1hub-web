"use client";

import { useEffect, useState } from "react";
import { Check, Share } from "lucide-react";
import { useSettings } from "@/components/settings/SettingsProvider";
import { cn } from "@/lib/cn";
import { formatClock, formatDay } from "@/lib/domain/time";

export type SharedSession = {
  name: string;
  start: string; // ISO, UTC
  hasTime: boolean;
};

// Shares the weekend's sessions in the visitor's time zone and clock:
// "FRI 09 05:30 · Practice 1". Uses the system share sheet where there is
// one, otherwise copies the text and link.
export const ShareSchedule = ({
  title,
  sessions,
  className,
}: {
  // "Singapore Grand Prix 2026"
  title: string;
  sessions: SharedSession[];
  className?: string;
}) => {
  const { clock24 } = useSettings();
  const [status, setStatus] = useState<string>();

  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(undefined), 3000);
    return () => clearTimeout(timer);
  }, [status]);

  const share = async () => {
    const lines = sessions.map((session) => {
      const start = new Date(session.start);
      const time = session.hasTime ? ` ${formatClock(start, clock24)}` : "";
      // Without a time only the UTC date is known
      const day = formatDay(start, session.hasTime ? undefined : "UTC");
      return `${day}${time} · ${session.name}`;
    });
    const text = `${title}\n${lines.join("\n")}`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        // Closing the share sheet isn't a failure
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      setStatus("Schedule copied");
    } catch {
      setStatus("Couldn't copy the schedule");
    }
  };

  const Icon = status === "Schedule copied" ? Check : Share;

  return (
    <>
      {/* Read out, and shown next to the button on desktop */}
      <span
        aria-live="polite"
        className="font-mono text-xs text-muted max-lg:sr-only"
      >
        {status}
      </span>
      <button
        type="button"
        onClick={share}
        aria-label="Share schedule"
        className={cn(
          "flex size-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md transition-colors hover:bg-surface-raised lg:size-auto lg:min-h-10 lg:bg-surface-raised lg:px-3.5 lg:text-sm lg:font-semibold lg:hover:bg-line",
          className,
        )}
      >
        <Icon aria-hidden size={18} strokeWidth={2} className="lg:size-4" />
        <span aria-hidden className="max-lg:hidden">
          Share
        </span>
      </button>
    </>
  );
};

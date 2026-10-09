"use client";

import { useEffect, useState } from "react";
import { Check, Share } from "lucide-react";
import { useSettings } from "@/components/settings/SettingsProvider";
import { showToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { formatClock, formatDay } from "@/lib/domain/time";
import { share } from "@/lib/share";

export type SharedSession = {
  name: string;
  start: string; // ISO, UTC
  hasTime: boolean;
};

// Shares the weekend's sessions in the visitor's time zone and clock:
// "FRI 09 05:30 · Practice 1". Uses the system share sheet where there is
// one, otherwise copies the text and link and says so in a toast.
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 3000);
    return () => clearTimeout(timer);
  }, [copied]);

  const onClick = async () => {
    const lines = sessions.map((session) => {
      const start = new Date(session.start);
      const time = session.hasTime ? ` ${formatClock(start, clock24)}` : "";
      // Without a time only the UTC date is known
      const day = formatDay(start, session.hasTime ? undefined : "UTC");
      return `${day}${time} · ${session.name}`;
    });
    const text = `${title}\n${lines.join("\n")}`;
    const url = window.location.href;

    const result = await share({ title, text, url, copy: `${text}\n\n${url}` });
    if (result === "copied") {
      setCopied(true);
      showToast("Schedule copied");
    } else if (result === "failed") {
      showToast("Couldn't copy the schedule");
    }
  };

  const Icon = copied ? Check : Share;

  return (
    <button
      type="button"
      onClick={onClick}
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
  );
};

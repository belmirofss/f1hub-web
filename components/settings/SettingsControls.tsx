"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Share } from "lucide-react";
import { Label } from "@/components/ui/Label";
import { Segmented } from "@/components/ui/Segmented";
import { ACCENT_OPTIONS } from "@/lib/settings";
import { useSettings } from "./SettingsProvider";
import { SettingsRow } from "./SettingsRow";

// Real radio buttons (arrow keys move between them), hidden behind swatch
// cards that take the colour's border when selected
export const AccentPicker = () => {
  const { accent, setAccent } = useSettings();

  return (
    <fieldset>
      <legend className="mb-2">
        <Label>Accent colour</Label>
      </legend>
      <div className="grid grid-cols-4 gap-2">
        {ACCENT_OPTIONS.map((option) => (
          <label
            key={option.value}
            style={{ "--swatch": option.value } as CSSProperties}
            className="flex cursor-pointer flex-col items-center gap-1.5 rounded-[10px] border-2 border-line bg-surface py-2.5 text-xs font-semibold transition-colors not-has-checked:hover:border-line-dashed has-checked:border-(--swatch) has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-text"
          >
            <input
              type="radio"
              name="accent"
              value={option.value}
              checked={option.value === accent}
              onChange={() => setAccent(option.value)}
              className="sr-only"
            />
            <span
              aria-hidden
              className="size-7 rounded-full"
              style={{ backgroundColor: option.value }}
            />
            {option.name}
          </label>
        ))}
      </div>
    </fieldset>
  );
};

export const ClockSetting = () => {
  const { clock24, setClock24 } = useSettings();

  return (
    <div className="flex flex-col gap-2">
      <Label aria-hidden>Clock</Label>
      <Segmented
        label="Clock"
        value={clock24 ? "24" : "12"}
        onChange={(value) => setClock24(value === "24")}
        options={[
          { value: "24", label: "24-hour" },
          { value: "12", label: "12-hour" },
        ]}
      />
      <p className="text-xs text-muted">
        Session times follow your device&apos;s time zone. Race weekends also
        show the local track time.
      </p>
    </div>
  );
};

const SHARE_TEXT = "Formula 1 calendar, results and standings";

// The system share sheet where there is one, otherwise the link is copied
export const ShareRow = () => {
  const [status, setStatus] = useState<string>();

  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(undefined), 3000);
    return () => clearTimeout(timer);
  }, [status]);

  const share = async () => {
    const url = `${window.location.origin}/`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "F1HUB", text: SHARE_TEXT, url });
        return;
      } catch (error) {
        // Closing the share sheet isn't a failure
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setStatus("Link copied");
    } catch {
      setStatus("Couldn't copy the link");
    }
  };

  return (
    <SettingsRow
      as="button"
      onClick={share}
      icon={<Share aria-hidden size={18} strokeWidth={2} />}
      label="Share F1HUB"
      value={<span aria-live="polite">{status}</span>}
    />
  );
};

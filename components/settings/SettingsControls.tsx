"use client";

import type { CSSProperties } from "react";
import { Download, Share } from "lucide-react";
import { useInstallPrompt } from "@/components/install/useInstallPrompt";
import { Label } from "@/components/ui/Label";
import { Segmented } from "@/components/ui/Segmented";
import { showToast } from "@/components/ui/Toast";
import { ACCENT_OPTIONS } from "@/lib/settings";
import { share } from "@/lib/share";
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
// and a toast says so
export const ShareRow = () => {
  const onClick = async () => {
    const url = `${window.location.origin}/`;
    const result = await share({
      title: "F1HUB",
      text: SHARE_TEXT,
      url,
      copy: url,
    });
    if (result === "copied") showToast("Link copied");
    else if (result === "failed") showToast("Couldn't copy the link");
  };

  return (
    <SettingsRow
      as="button"
      onClick={onClick}
      icon={<Share aria-hidden size={18} strokeWidth={2} />}
      label="Share F1HUB"
    />
  );
};

// Opens the same install flow as the automatic prompt. Hidden once F1HUB is
// installed, or when it's already running as the installed app.
export const InstallRow = () => {
  const { ready, standalone, installed, openPrompt } = useInstallPrompt();
  if (ready && (standalone || installed)) return null;

  return (
    <SettingsRow
      as="button"
      highlight
      onClick={openPrompt}
      icon={<Download aria-hidden size={18} strokeWidth={2} />}
      label="Install F1HUB on this device"
    />
  );
};

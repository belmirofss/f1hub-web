// Visitor preferences, ported from the app's src/settings/SettingsContext.tsx
// and ACCENT_OPTIONS in src/theme.ts. Shared by SettingsProvider and the
// inline <head> script, which both read the same localStorage entry.

import { contrastRatio } from "@/lib/color";

export const SETTINGS_KEY = "F1HUB_SETTINGS";

export const ACCENT_OPTIONS = [
  { name: "F1 red", value: "#FF1E00" },
  { name: "Papaya", value: "#FF8000" },
  { name: "Teal", value: "#27F4D2" },
  { name: "Blue", value: "#3671C6" },
];

export type StoredSettings = {
  accent: string;
  clock24: boolean;
};

export const DEFAULT_SETTINGS: StoredSettings = {
  accent: ACCENT_OPTIONS[0].value,
  clock24: true,
};

const DARK = "#0B0B0D";
const WHITE = "#FFFFFF";

// Text colour on top of the accent: whichever of white and the background
// contrasts more. White on F1 red is only 3.9:1, so red, papaya and teal get
// dark text (5.1:1 and up) and blue keeps white (4.9:1).
export const onAccent = (hex: string) =>
  contrastRatio(hex, DARK) >= contrastRatio(hex, WHITE) ? DARK : WHITE;

const isAccent = (value: unknown): value is string =>
  ACCENT_OPTIONS.some((option) => option.value === value);

// Anything that isn't a known accent or a boolean falls back to the default,
// so a stale or hand-edited entry can't break the page
export const parseSettings = (raw: string | null): StoredSettings => {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const stored = JSON.parse(raw) as Partial<StoredSettings> | null;
    return {
      accent: isAccent(stored?.accent)
        ? stored.accent
        : DEFAULT_SETTINGS.accent,
      clock24:
        typeof stored?.clock24 === "boolean"
          ? stored.clock24
          : DEFAULT_SETTINGS.clock24,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const applyAccent = (accent: string) => {
  const style = document.documentElement.style;
  style.setProperty("--accent", accent);
  style.setProperty("--on-accent", onAccent(accent));
};

// Runs in <head> while the HTML is parsed, so the saved accent is in place
// before the first paint. The text colours are worked out here at build time,
// and only a known accent is applied.
const ON_ACCENT = Object.fromEntries(
  ACCENT_OPTIONS.map((option) => [option.value, onAccent(option.value)]),
);

export const ACCENT_SCRIPT = `try{var a=JSON.parse(localStorage.getItem(${JSON.stringify(SETTINGS_KEY)})).accent,o=${JSON.stringify(ON_ACCENT)};if(typeof o[a]=="string"){var s=document.documentElement.style;s.setProperty("--accent",a);s.setProperty("--on-accent",o[a])}}catch(e){}`;

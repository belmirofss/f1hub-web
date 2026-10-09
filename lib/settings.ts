// Visitor preferences, ported from the app's src/settings/SettingsContext.tsx.
// Read and written by SettingsProvider.

export const SETTINGS_KEY = "F1HUB_SETTINGS";

export type StoredSettings = {
  clock24: boolean;
};

export const DEFAULT_SETTINGS: StoredSettings = {
  clock24: true,
};

// Anything that isn't a boolean falls back to the default, so a stale or
// hand-edited entry can't break the page. Keys F1HUB no longer uses (the
// accent colour from before the Programme theme) are dropped, and go from
// storage the next time a setting changes.
export const parseSettings = (raw: string | null): StoredSettings => {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const stored = JSON.parse(raw) as Partial<StoredSettings> | null;
    return {
      clock24:
        typeof stored?.clock24 === "boolean"
          ? stored.clock24
          : DEFAULT_SETTINGS.clock24,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

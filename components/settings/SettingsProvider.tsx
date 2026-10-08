"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  applyAccent,
  onAccent,
  parseSettings,
} from "@/lib/settings";
import type { StoredSettings } from "@/lib/settings";

type Settings = StoredSettings & {
  // Text colour that stays readable on top of the accent colour
  onAccent: string;
  setAccent: (accent: string) => void;
  setClock24: (clock24: boolean) => void;
};

// The settings live outside React so every reader shares them. If storage is
// blocked (some private windows), changes still apply until the tab closes.
let current: StoredSettings | undefined;
const listeners = new Set<() => void>();

const getSnapshot = () => {
  if (!current) {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(SETTINGS_KEY);
    } catch {}
    current = parseSettings(raw);
  }
  return current;
};

// The server and the first client render use the defaults, then React
// re-renders with the saved settings, so hydration never mismatches
const getServerSnapshot = () => DEFAULT_SETTINGS;

const subscribe = (listener: () => void) => {
  // Another tab changed the settings (a null key means storage was cleared)
  const onStorage = (event: StorageEvent) => {
    if (event.key !== SETTINGS_KEY && event.key !== null) return;
    current = parseSettings(event.newValue);
    applyAccent(current.accent);
    listener();
  };

  listeners.add(listener);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};

const update = (patch: Partial<StoredSettings>) => {
  const previous = getSnapshot();
  current = { ...previous, ...patch };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
  } catch {}
  if (current.accent !== previous.accent) applyAccent(current.accent);
  listeners.forEach((listener) => listener());
};

const SettingsContext = createContext<Settings>({
  ...DEFAULT_SETTINGS,
  onAccent: onAccent(DEFAULT_SETTINGS.accent),
  setAccent: () => {},
  setClock24: () => {},
});

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const settings = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  // The <head> script has already set the saved accent. In development React
  // remounts once and clears the style it put on <html>, so set it again.
  useLayoutEffect(() => applyAccent(getSnapshot().accent), []);

  const value = useMemo<Settings>(
    () => ({
      ...settings,
      onAccent: onAccent(settings.accent),
      setAccent: (accent) => update({ accent }),
      setClock24: (clock24) => update({ clock24 }),
    }),
    [settings],
  );

  return <SettingsContext value={value}>{children}</SettingsContext>;
};

export const useSettings = () => useContext(SettingsContext);

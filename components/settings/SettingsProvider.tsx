"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import { DEFAULT_SETTINGS, SETTINGS_KEY, parseSettings } from "@/lib/settings";
import type { StoredSettings } from "@/lib/settings";

type Settings = StoredSettings & {
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
  current = { ...getSnapshot(), ...patch };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
  } catch {}
  listeners.forEach((listener) => listener());
};

const SettingsContext = createContext<Settings>({
  ...DEFAULT_SETTINGS,
  setClock24: () => {},
});

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const settings = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const value = useMemo<Settings>(
    () => ({
      ...settings,
      setClock24: (clock24) => update({ clock24 }),
    }),
    [settings],
  );

  return <SettingsContext value={value}>{children}</SettingsContext>;
};

export const useSettings = () => useContext(SettingsContext);

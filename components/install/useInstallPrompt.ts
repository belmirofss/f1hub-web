"use client";

import { useSyncExternalStore } from "react";
import {
  DISMISS_MS,
  DISMISSED_KEY,
  INSTALLED_KEY,
  PAGE_VIEWS_KEY,
  detectPlatform,
  isPhone,
  isStandalone,
  readStorage,
  writeStorage,
} from "@/lib/install";
import type {
  BeforeInstallPromptEvent,
  IosBrowser,
  Platform,
} from "@/lib/install";

type InstallState = {
  // False on the server and until the browser has been checked
  ready: boolean;
  platform?: Platform;
  iosBrowser?: IosBrowser;
  standalone: boolean;
  // Installed from this browser (appinstalled, or an accepted prompt)
  installed: boolean;
  // Chromium handed over its install event, so Install can call prompt()
  canPrompt: boolean;
  open: boolean;
  // Opened by the automatic check rather than the Settings row, so closing
  // it counts as "Not now"
  auto: boolean;
};

const SERVER_STATE: InstallState = {
  ready: false,
  standalone: false,
  installed: false,
  canPrompt: false,
  open: false,
  auto: false,
};

// One store for the whole page, like the settings: the prompt in the layout
// and the Settings row read the same state
let state = SERVER_STATE;
let installEvent: BeforeInstallPromptEvent | undefined;
let started = false;
// Storage can be blocked, so the session also remembers in memory
let autoShown = false;
let pageViews = 0;
let lastPath: string | undefined;
const listeners = new Set<() => void>();

const set = (patch: Partial<InstallState>) => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};

const keepEvent = (event: BeforeInstallPromptEvent) => {
  installEvent = event;
  // Chromium only offers the install when the app isn't installed, so an
  // earlier install has since been removed
  writeStorage("local", INSTALLED_KEY, null);
  set({ canPrompt: true, installed: false });
};

const forgetEvent = () => {
  installEvent = undefined;
  window.__installEvent = undefined;
};

const start = () => {
  if (started) return;
  started = true;

  const standaloneQuery = window.matchMedia("(display-mode: standalone)");
  state = {
    ...state,
    ...detectPlatform(),
    ready: true,
    standalone: isStandalone(),
    installed: readStorage("local", INSTALLED_KEY) === "1",
  };
  if (window.__installEvent) keepEvent(window.__installEvent);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    keepEvent(event as BeforeInstallPromptEvent);
  });
  window.addEventListener("appinstalled", () => {
    forgetEvent();
    writeStorage("local", INSTALLED_KEY, "1");
    set({ installed: true, canPrompt: false, open: false });
  });
  standaloneQuery.addEventListener("change", () =>
    set({ standalone: isStandalone() }),
  );
};

const subscribe = (listener: () => void) => {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => state;
const getServerSnapshot = () => SERVER_STATE;

// Called on every route change. The count lives in sessionStorage so a full
// reload or a link opened from the offline page still adds up.
export const countPageView = (pathname: string) => {
  // React runs effects twice in development
  if (pathname === lastPath) return;
  lastPath = pathname;
  const stored = Number(readStorage("session", PAGE_VIEWS_KEY)) || 0;
  pageViews = Math.max(stored, pageViews) + 1;
  writeStorage("session", PAGE_VIEWS_KEY, String(pageViews));
};

const recentlyDismissed = () => {
  const dismissedAt = Number(readStorage("local", DISMISSED_KEY));
  return dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_MS;
};

// Phones only, from the second page view, and never once installed or after
// "Not now" in the last 14 days
export const maybeOpenAutomatically = () => {
  if (!state.ready || state.open || autoShown) return;
  if (state.standalone || state.installed || pageViews < 2) return;
  if (!isPhone() || recentlyDismissed()) return;

  const { platform } = state;
  const supported =
    platform === "chromium"
      ? state.canPrompt
      : platform === "ios" || platform === "other";
  if (!supported) return;

  autoShown = true;
  set({ open: true, auto: true });
};

const dismiss = () => {
  autoShown = true;
  writeStorage("local", DISMISSED_KEY, String(Date.now()));
};

// The Settings row: the same flow, on any device
const openPrompt = () => set({ open: true, auto: false });

const closePrompt = () => {
  if (!state.open) return;
  if (state.auto) dismiss();
  set({ open: false });
};

// Chromium's own install dialog. The event works once, so it's dropped
// whatever the answer; appinstalled follows an accepted install.
const install = async () => {
  const event = installEvent;
  if (!event) return;
  forgetEvent();
  set({ canPrompt: false });

  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "accepted") {
      writeStorage("local", INSTALLED_KEY, "1");
      set({ installed: true, open: false });
      return;
    }
    dismiss();
  } catch (error) {
    console.error("Install prompt", error);
  }
  set({ open: false });
};

export const useInstallPrompt = () => {
  const current = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return {
    ...current,
    openPrompt,
    closePrompt,
    install,
  };
};

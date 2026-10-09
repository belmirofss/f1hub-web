// Install prompt helpers shared by the inline <head> script and
// useInstallPrompt(). Everything here runs in the browser only.

export const DISMISSED_KEY = "F1HUB_INSTALL_DISMISSED";
export const INSTALLED_KEY = "F1HUB_INSTALLED";
export const PAGE_VIEWS_KEY = "F1HUB_PAGE_VIEWS";

// "Not now" keeps the prompt away for two weeks
export const DISMISS_MS = 14 * 24 * 60 * 60 * 1000;

// Chromium's install event. Not in TypeScript's DOM types.
export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __installEvent?: BeforeInstallPromptEvent;
  }
}

// Chromium can fire beforeinstallprompt before React hydrates, so the <head>
// keeps it for useInstallPrompt(). preventDefault() stops Chrome's own
// mini-infobar on Android: the custom sheet replaces it.
export const INSTALL_SCRIPT = `addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__installEvent=e});`;

// Which install flow this browser gets:
// - "chromium": install API, the bottom sheet once beforeinstallprompt fires
// - "ios": Share → Add to Home Screen (Safari, and Chrome / Firefox / Edge on
//   iOS 16.4+)
// - "ios-other": an iOS browser that can't add to the Home Screen (old iOS,
//   in-app browsers), so the visitor has to open Safari
// - "other": no install API (Firefox on Android…), the browser menu does it
// - "webview": an Android in-app browser, which can't install at all
export type Platform = "chromium" | "ios" | "ios-other" | "other" | "webview";

export type IosBrowser = "safari" | "chrome" | "firefox" | "edge";

export const detectPlatform = (): {
  platform: Platform;
  iosBrowser?: IosBrowser;
} => {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac, but Macs have no touch screen
  const ios =
    /iPhone|iPad|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);

  if (ios) {
    const version = ua.match(/OS (\d+)_(\d+)/);
    const major = version ? Number(version[1]) : 0;
    const minor = version ? Number(version[2]) : 0;
    const shareSheet = major > 16 || (major === 16 && minor >= 4);
    const thirdParty = /CriOS/.test(ua)
      ? "chrome"
      : /FxiOS/.test(ua)
        ? "firefox"
        : /EdgiOS/.test(ua)
          ? "edge"
          : undefined;

    if (thirdParty) {
      return shareSheet
        ? { platform: "ios", iosBrowser: thirdParty }
        : { platform: "ios-other" };
    }
    // In-app browsers (Instagram, Facebook, Gmail…) leave "Safari" out of
    // their user agent or add their own name
    const safari =
      /Safari\//.test(ua) && !/FBAN|FBAV|Instagram|Line\/|GSA\//.test(ua);
    return safari
      ? { platform: "ios", iosBrowser: "safari" }
      : { platform: "ios-other" };
  }

  if (/Android/.test(ua) && /; wv\)/.test(ua)) return { platform: "webview" };
  if ("BeforeInstallPromptEvent" in window) return { platform: "chromium" };
  return { platform: "other" };
};

// The app opened from the home screen, not a browser tab
export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as { standalone?: boolean }).standalone === true;

// Phones only: a touch screen and the mobile layout. Never on desktop.
export const isPhone = () =>
  window.matchMedia("(pointer: coarse) and (max-width: 767px)").matches;

// Storage can be blocked (some private windows), so every access is guarded
export const readStorage = (storage: "local" | "session", key: string) => {
  try {
    return (storage === "local" ? localStorage : sessionStorage).getItem(key);
  } catch {
    return null;
  }
};

export const writeStorage = (
  storage: "local" | "session",
  key: string,
  value: string | null,
) => {
  try {
    const target = storage === "local" ? localStorage : sessionStorage;
    if (value === null) target.removeItem(key);
    else target.setItem(key, value);
  } catch {}
};

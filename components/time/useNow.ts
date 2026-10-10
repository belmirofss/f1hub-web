"use client";

import { useCallback, useSyncExternalStore } from "react";
import { clockNow } from "@/lib/clock";

const noSubscribe = () => () => {};

// False on the server and while hydrating, true from then on (and straight
// away on client-side navigations), so client-only text can't mismatch
export const useHydrated = () =>
  useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );

// The current time rounded down to `interval` ms, updated on each boundary.
// Null on the server and while hydrating: the server's clock (and the time
// the HTML was cached) isn't the viewer's.
export const useNow = (interval = 1000) => {
  const subscribe = useCallback(
    (listener: () => void) => {
      let timer: ReturnType<typeof setTimeout>;
      const tick = () => {
        listener();
        timer = setTimeout(tick, interval - (Date.now() % interval));
      };
      timer = setTimeout(tick, interval - (Date.now() % interval));
      return () => clearTimeout(timer);
    },
    [interval],
  );

  return useSyncExternalStore<number | null>(
    subscribe,
    () => {
      const now = clockNow();
      return now - (now % interval);
    },
    () => null,
  );
};

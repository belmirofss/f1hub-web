"use client";

import { useEffect, useSyncExternalStore } from "react";

type Toast = { id: number; message: string };

// One toast at a time: a new message replaces the one on screen
let current: Toast | null = null;
let nextId = 0;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// "Link copied". Callable from any client code; <Toaster /> shows it.
export const showToast = (message: string) => {
  current = { id: nextId++, message };
  emit();
};

const DURATION = 3000;

// Mounted once in the root layout. Sits above the tab bar on phones and the
// home indicator in the installed app.
export const Toaster = () => {
  const toast = useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      if (current?.id !== toast.id) return;
      current = null;
      emit();
    }, DURATION);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    // The live region stays mounted so screen readers announce each message
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(64px+max(12px,env(safe-area-inset-bottom)))] z-30 flex justify-center px-4 md:bottom-[calc(24px+env(safe-area-inset-bottom))]"
    >
      {toast && (
        <p
          key={toast.id}
          className="rounded-[22px] border border-line bg-surface-raised px-4 py-2.5 text-sm font-semibold shadow-[0_6px_18px_rgba(0,0,0,0.5)]"
        >
          {toast.message}
        </p>
      )}
    </div>
  );
};

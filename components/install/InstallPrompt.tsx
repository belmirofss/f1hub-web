"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowDown,
  Calendar,
  Download,
  Share,
  Smartphone,
  SquarePlus,
  X,
} from "lucide-react";
import { AppMark } from "@/components/layout/Wordmark";
import {
  primaryButton,
  secondaryButton,
} from "@/components/layout/StatusScreen";
import { cn } from "@/lib/cn";
import type { IosBrowser } from "@/lib/install";
import {
  countPageView,
  maybeOpenAutomatically,
  useInstallPrompt,
} from "./useInstallPrompt";

// Waits a moment after the page changes, so the sheet doesn't land on top
// of a page that is still drawing
const AUTO_OPEN_DELAY = 1500;

// Mounted once in the root layout. Counts page views, opens the prompt when
// it's time, and draws whichever flow this browser supports.
export const InstallPrompt = () => {
  const pathname = usePathname();
  const prompt = useInstallPrompt();
  const { ready, canPrompt } = prompt;

  useEffect(() => countPageView(pathname), [pathname]);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(maybeOpenAutomatically, AUTO_OPEN_DELAY);
    return () => clearTimeout(timer);
  }, [pathname, ready, canPrompt]);

  if (!prompt.open) return null;

  if (prompt.canPrompt) {
    return (
      <AndroidSheet onClose={prompt.closePrompt} onInstall={prompt.install} />
    );
  }
  if (prompt.platform === "ios") {
    return (
      <IosCard
        browser={prompt.iosBrowser ?? "safari"}
        onClose={prompt.closePrompt}
      />
    );
  }
  return (
    <MenuHint
      message={
        prompt.platform === "ios-other"
          ? "Open this page in Safari, then tap Share and Add to Home Screen."
          : prompt.platform === "webview"
            ? "Open this page in your browser, like Chrome or Firefox, then install it from the browser's menu."
            : "Open your browser's menu and choose Install or Add to Home screen."
      }
      onClose={prompt.closePrompt}
    />
  );
};

// A native modal <dialog>: the rest of the page is inert, so focus stays
// inside, and Escape closes it. Focus goes back to where it was.
const Dialog = ({
  labelledBy,
  onClose,
  className,
  children,
}: {
  labelledBy: string;
  onClose: () => void;
  className: string;
  children: ReactNode;
}) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previous = document.activeElement;
    const root = document.documentElement;
    const overflow = root.style.overflow;

    dialog.showModal();
    // The page behind doesn't scroll while the prompt is up
    root.style.overflow = "hidden";

    return () => {
      dialog.close();
      root.style.overflow = overflow;
      if (previous instanceof HTMLElement)
        previous.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-modal="true"
      aria-labelledby={labelledBy}
      // Escape, or the browser's own close (Android back gesture). The close
      // event is queued, so skip it if the dialog has been shown again since
      // (React runs effects twice in development).
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
      // A tap on the dimmed backdrop
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "inset-x-0 m-0 mt-auto h-fit max-h-[calc(100dvh-24px-env(safe-area-inset-top))] w-full max-w-none overflow-y-auto overscroll-contain text-text backdrop:bg-text/50",
        className,
      )}
    >
      {children}
    </dialog>
  );
};

const CloseButton = ({ onClose }: { onClose: () => void }) => (
  <button
    type="button"
    onClick={onClose}
    aria-label="Close"
    className="-mr-2 flex size-11 shrink-0 cursor-pointer items-center justify-center text-muted transition-colors hover:bg-surface-raised hover:text-text"
  >
    <X aria-hidden size={20} strokeWidth={2} />
  </button>
);

// Bottom sheet on phones, a centred card when opened from Settings on a
// larger screen. A heavy ink rule on top, like a Card.
const sheetClasses =
  "border-t-2 border-text bg-surface pt-2.5 pr-[max(20px,env(safe-area-inset-right))] pl-[max(20px,env(safe-area-inset-left))] pb-[max(28px,calc(env(safe-area-inset-bottom)+16px))] md:m-auto md:max-w-[420px] md:border-x md:border-b md:border-x-line md:border-b-line md:pb-6";

// The sheets' headline, in the display face
const title = "display-title text-[34px]";

const Handle = () => (
  <span
    aria-hidden
    className="mx-auto block h-1 w-10 rounded-full bg-line-dashed md:hidden"
  />
);

const BENEFITS = [
  { icon: Calendar, text: "Countdown and session times in your time zone" },
  { icon: Smartphone, text: "Full screen, no browser bars" },
  { icon: Download, text: "Pages you've opened still load offline" },
];

const AndroidSheet = ({
  onClose,
  onInstall,
}: {
  onClose: () => void;
  onInstall: () => void;
}) => {
  const titleId = useId();

  return (
    <Dialog labelledBy={titleId} onClose={onClose} className={sheetClasses}>
      <div className="flex flex-col gap-[18px]">
        <Handle />
        <div className="flex items-center gap-3.5">
          <AppMark size="lg" />
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className={title}>
              Install F1HUB
            </h2>
            <p className="truncate text-[13px] text-muted">
              {window.location.host}
            </p>
          </div>
          <CloseButton onClose={onClose} />
        </div>
        <p className="leading-[22px] text-soft">
          Add F1HUB to your home screen. It opens like an app, full screen,
          straight to the next session.
        </p>
        <ul className="flex flex-col gap-3">
          {BENEFITS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center bg-surface-raised text-accent-ink">
                <Icon aria-hidden size={18} strokeWidth={2} />
              </span>
              <span className="text-sm font-semibold">{text}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className={cn(secondaryButton, "min-h-12 flex-1 font-bold")}
          >
            Not now
          </button>
          <button
            type="button"
            onClick={onInstall}
            className={cn(primaryButton, "min-h-12 flex-2 gap-2")}
          >
            <Download aria-hidden size={18} strokeWidth={2} />
            Install
          </button>
        </div>
      </div>
    </Dialog>
  );
};

const BROWSER_NAMES: Record<IosBrowser, string> = {
  safari: "Safari",
  chrome: "Chrome",
  firefox: "Firefox",
  edge: "Edge",
};

// A key cap for a button the visitor has to find: "Share", "Add"
const Key = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 border border-line bg-background px-2 py-0.5 align-middle text-[13px] leading-[18px] font-bold whitespace-nowrap",
      className,
    )}
  >
    {children}
  </span>
);

const ShareKey = () => (
  <Key>
    <Share aria-hidden size={14} strokeWidth={2} className="text-rain" />
    Share
  </Key>
);

// iOS has no install API: three taps through the share sheet. Safari, Firefox
// and Edge keep Share (or the ••• menu) in the bottom toolbar, so an arrow
// points down at it. Chrome has it in the address bar.
const IosCard = ({
  browser,
  onClose,
}: {
  browser: IosBrowser;
  onClose: () => void;
}) => {
  const titleId = useId();
  const name = BROWSER_NAMES[browser];

  const firstStep =
    browser === "safari" ? (
      <>
        Tap <ShareKey /> in Safari&apos;s toolbar (or <Key>•••</Key> then Share)
      </>
    ) : browser === "chrome" ? (
      <>
        Tap <ShareKey /> in the address bar
      </>
    ) : (
      <>
        Open the <Key>•••</Key> menu and tap <ShareKey />
      </>
    );

  const steps = [
    firstStep,
    <>
      Choose{" "}
      <Key>
        <SquarePlus aria-hidden size={14} strokeWidth={2} />
        Add to Home Screen
      </Key>
    </>,
    <>
      Tap <Key className="text-rain">Add</Key> in the top corner
    </>,
  ];

  return (
    <Dialog
      labelledBy={titleId}
      onClose={onClose}
      className="bg-transparent pr-[max(12px,env(safe-area-inset-right))] pb-[max(14px,env(safe-area-inset-bottom))] pl-[max(12px,env(safe-area-inset-left))] md:m-auto md:max-w-[420px] md:pb-3"
    >
      <div className="flex flex-col gap-3.5 border border-t-2 border-line border-t-text bg-surface px-4 pt-4 pb-[18px]">
        <div className="flex items-center gap-3">
          <AppMark size="md" />
          <h2 id={titleId} className="flex-1 display-title text-[28px]">
            Add F1HUB to your Home Screen
          </h2>
          <CloseButton onClose={onClose} />
        </div>
        <p className="text-sm leading-5 text-soft">
          {name} can install F1HUB as an app. It takes three taps:
        </p>
        <ol className="flex flex-col border-t border-line">
          {steps.map((step, index) => (
            <li
              key={index}
              className="flex items-center gap-3 border-b border-line py-3"
            >
              <span
                aria-hidden
                className="flex size-6 shrink-0 items-center justify-center bg-accent font-mono text-xs font-bold text-on-accent"
              >
                {index + 1}
              </span>
              <span className="text-sm leading-[22px]">{step}</span>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={onClose}
          className={cn(secondaryButton, "min-h-12 font-bold")}
        >
          Maybe later
        </button>
      </div>
      {browser !== "chrome" && (
        <div
          aria-hidden
          className="flex flex-col items-center gap-0.5 pt-4 text-accent-ink md:hidden"
        >
          <span className="bg-background px-2 py-0.5 font-mono text-[10px] tracking-[1px]">
            {browser === "safari" ? "SAFARI TOOLBAR" : "TOOLBAR"}
          </span>
          <ArrowDown
            size={22}
            strokeWidth={2}
            className="motion-safe:animate-bounce"
          />
        </div>
      )}
    </Dialog>
  );
};

// Browsers without an install API: point at the browser's own menu
const MenuHint = ({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => {
  const titleId = useId();

  return (
    <Dialog labelledBy={titleId} onClose={onClose} className={sheetClasses}>
      <div className="flex flex-col gap-[18px]">
        <Handle />
        <div className="flex items-center gap-3.5">
          <AppMark size="lg" />
          <h2 id={titleId} className={cn(title, "flex-1")}>
            Install F1HUB
          </h2>
          <CloseButton onClose={onClose} />
        </div>
        <p className="leading-[22px] text-soft">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className={cn(secondaryButton, "min-h-12 font-bold")}
        >
          Got it
        </button>
      </div>
    </Dialog>
  );
};

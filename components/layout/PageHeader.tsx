import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { BackButton } from "./BackButton";

type Props = {
  title: ReactNode;
  // Small mono line: "2026 · 16/23" next to a tab title, "R17 · SGP · 11 OCT"
  // above a detail title
  meta?: ReactNode;
  // Makes it a detail page header with a Back button. This is where Back
  // goes when the visitor didn't come from another F1HUB page.
  back?: string;
  // Buttons: share, circuit link, a Segmented switch
  actions?: ReactNode;
  // Under the title: weekend tabs, view switches
  children?: ReactNode;
  className?: string;
  // A smaller title where the content needs the room: "lg:text-5xl"
  titleClassName?: string;
};

// The app's screen header. Tab pages: big title with the meta on its
// baseline. Detail pages: Back + meta on one row and the title under it.
// Desktop has the browser's back button, so there the meta sits above the
// title and the actions move to its right. The installed app has no browser
// bar, so it keeps Back at every width.
export const PageHeader = ({
  title,
  meta,
  back,
  actions,
  children,
  className,
  titleClassName,
}: Props) => {
  if (!back) {
    return (
      <header
        className={cn("flex flex-col gap-3 pt-[18px] lg:pt-6", className)}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* The meta drops under the title where both don't fit: "AFTER
              R18 · 6 TO GO" beside "STANDINGS" at 360px */}
          <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 lg:flex-none lg:flex-col lg:flex-nowrap lg:items-start lg:gap-0.5">
            <h1 className="page-title break-words">{title}</h1>
            {meta && (
              <p className="shrink-0 font-mono text-xs tracking-[0.14em] text-muted">
                {meta}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
        {children}
      </header>
    );
  }

  return (
    <header className={cn("flex flex-col gap-3 pt-2 lg:pt-6", className)}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 [grid-template-areas:'meta_actions'_'title_title'] lg:items-end lg:gap-y-1.5 lg:[grid-template-areas:'meta_meta'_'title_actions']">
        <div className="-ml-2.5 flex min-h-11 min-w-0 items-center [grid-area:meta] lg:ml-0 lg:min-h-0 standalone:-ml-2.5">
          <BackButton
            fallbackHref={back}
            className="lg:hidden standalone:flex"
          />
          {meta && (
            <p className="truncate font-mono text-xs tracking-[0.14em] text-muted">
              {meta}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 [grid-area:actions]">
            {actions}
          </div>
        )}
        <h1
          className={cn(
            "page-title break-words [grid-area:title]",
            titleClassName,
          )}
        >
          {title}
        </h1>
      </div>
      {children}
    </header>
  );
};

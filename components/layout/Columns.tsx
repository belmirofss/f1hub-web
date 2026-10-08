import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Main column + sidebar. They sit side by side once both fit (about 940px of
// content), and the aside drops under the main column on narrower screens.
export const Columns = ({
  children,
  aside,
  asideLabel,
  asideClassName,
  className,
}: {
  children: ReactNode;
  aside?: ReactNode;
  // Accessible name for the aside landmark when a page has more than one
  asideLabel?: string;
  // Lets a page move the aside above the main column or hide it on phones
  asideClassName?: string;
  className?: string;
}) => (
  <div className={cn("flex flex-wrap items-start gap-3.5 lg:gap-5", className)}>
    <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-3.5 lg:gap-5">
      {children}
    </div>
    {aside && (
      <aside
        aria-label={asideLabel}
        className={cn(
          "flex min-w-0 flex-[1_1_340px] flex-col gap-3.5 lg:gap-5",
          asideClassName,
        )}
      >
        {aside}
      </aside>
    )}
  </div>
);

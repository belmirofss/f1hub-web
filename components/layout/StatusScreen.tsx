import type { ReactNode } from "react";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/cn";

// Full-page message for 404, errors and offline: a row of start lights,
// a label, a big slanted title, a line of text and some ways out.
export const StatusScreen = ({
  lit,
  label,
  title,
  children,
  actions,
}: {
  // How many of the five start lights are on
  lit: number;
  label: string;
  title: string;
  children: ReactNode;
  actions: ReactNode;
}) => (
  <div className="flex w-full max-w-xl flex-1 flex-col justify-center gap-[18px] py-10">
    <div aria-hidden className="flex gap-1">
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-2 flex-1 rounded-[2px]",
            index < lit ? "bg-accent" : "bg-light-off",
          )}
        />
      ))}
    </div>
    <Label className="text-accent">{label}</Label>
    <h1 className="-skew-x-6 text-[30px] leading-[34px] font-black">{title}</h1>
    <p className="text-[15px] leading-[22px] text-soft">{children}</p>
    <div className="flex flex-wrap gap-2">{actions}</div>
  </div>
);

export const primaryButton =
  "flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-accent px-4 font-bold text-on-accent";

export const secondaryButton =
  "flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-surface-raised px-4 font-semibold transition-colors hover:bg-line";

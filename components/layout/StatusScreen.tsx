import type { ReactNode } from "react";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/cn";

// Full-page message for 404, errors and offline: a row of start lights,
// a label, a big headline, a line of text, optional details and some ways
// out.
export const StatusScreen = ({
  lit,
  label,
  title,
  children,
  details,
  actions,
}: {
  // How many of the five start lights are on
  lit: number;
  label: string;
  title: string;
  children: ReactNode;
  details?: ReactNode;
  actions: ReactNode;
}) => (
  <div className="flex w-full max-w-xl flex-1 flex-col justify-center gap-[18px] py-10">
    <div aria-hidden className="flex gap-1">
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-2 flex-1",
            index < lit ? "bg-accent" : "bg-light-off",
          )}
        />
      ))}
    </div>
    <Label className="text-accent-ink">{label}</Label>
    <h1 className="page-title">{title}</h1>
    <p className="text-[15px] leading-[22px] text-soft">{children}</p>
    {details}
    <div className="flex flex-wrap gap-2">{actions}</div>
  </div>
);

export const primaryButton =
  "flex min-h-11 cursor-pointer items-center justify-center bg-accent px-4 font-bold text-on-accent transition-colors hover:bg-accent-ink";

export const secondaryButton =
  "flex min-h-11 cursor-pointer items-center justify-center border border-line px-4 font-semibold transition-colors hover:border-text";

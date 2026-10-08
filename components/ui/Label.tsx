import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

// Small monospaced caps label used above sections: "NEXT RACE · R18/24"
export const Label = ({
  className,
  ...props
}: ComponentPropsWithoutRef<"span">) => (
  <span
    className={cn(
      "font-mono text-[11px] font-medium tracking-[1px] text-muted uppercase",
      className,
    )}
    {...props}
  />
);

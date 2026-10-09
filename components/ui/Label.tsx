import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

// Small monospaced caps label used above sections: "NEXT RACE · R18/24"
export const Label = ({
  className,
  ...props
}: ComponentPropsWithoutRef<"span">) => (
  <span className={cn("section-label", className)} {...props} />
);

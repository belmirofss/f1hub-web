"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { onRadioKeyDown } from "./radioKeys";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  // Makes the option a link (route switches like Drivers | Constructors)
  href?: string;
  disabled?: boolean;
};

type Props<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  // For options without an href (state toggles like My time | Track)
  onChange?: (value: T) => void;
  size?: "regular" | "small";
  // Accessible name for the group: "Standings view", "Time zone"
  label: string;
  className?: string;
};

// Filled pill switch: "Drivers | Constructors | Teammates", "My time | Track".
// Options with an href render as links (aria-current), the rest as a radio
// group that the arrow keys move through.
export const Segmented = <T extends string>({
  options,
  value,
  onChange,
  size = "regular",
  label,
  className,
}: Props<T>) => {
  const small = size === "small";
  const isNav = options.some((option) => option.href);
  const Group = isNav ? "nav" : "div";
  // The radio that takes Tab: the selected one, or the first if none is
  const focusable = options.some((o) => o.value === value && !o.disabled)
    ? value
    : options.find((o) => !o.disabled)?.value;

  return (
    <Group
      aria-label={label}
      role={isNav ? undefined : "radiogroup"}
      onKeyDown={isNav ? undefined : onRadioKeyDown}
      className={cn(
        "flex border border-line",
        small
          ? "overflow-hidden rounded-md"
          : "gap-1 rounded-md bg-surface p-[3px]",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const classes = cn(
          "flex items-center justify-center transition-colors",
          small
            ? "min-h-[30px] px-2.5 text-xs"
            : "min-h-[38px] flex-1 rounded-sm px-2 text-sm",
          selected
            ? "bg-text font-bold text-background"
            : "font-semibold text-muted",
          !selected && !option.disabled && "hover:text-text",
          option.disabled && "opacity-35",
        );

        if (option.disabled) {
          return (
            <span
              key={option.value}
              role={isNav ? undefined : "radio"}
              aria-checked={isNav ? undefined : false}
              aria-disabled="true"
              className={classes}
            >
              {option.label}
            </span>
          );
        }

        if (option.href) {
          return (
            <Link
              key={option.value}
              href={option.href}
              aria-current={selected ? "page" : undefined}
              className={classes}
            >
              {option.label}
            </Link>
          );
        }

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={option.value === focusable ? 0 : -1}
            onClick={() => onChange?.(option.value)}
            className={cn(classes, "cursor-pointer")}
          >
            {option.label}
          </button>
        );
      })}
    </Group>
  );
};

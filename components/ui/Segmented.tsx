"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { LinkPending } from "./LinkPending";
import { onRadioKeyDown } from "./radioKeys";
import { ShallowLink } from "./ShallowLink";

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
  // The hrefs are other states of the page on screen: they change the URL in
  // place without asking the server (see ShallowLink)
  shallow?: boolean;
  size?: "regular" | "small";
  // Accessible name for the group: "Standings view", "Time zone"
  label: string;
  className?: string;
};

// Ink pill switch: "Drivers | Constructors | Teammates", "My time | Track".
// Options with an href render as links (aria-current), the rest as a radio
// group that the arrow keys move through.
export const Segmented = <T extends string>({
  options,
  value,
  onChange,
  shallow,
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
        "flex rounded-full border border-line",
        small ? "overflow-hidden" : "gap-1 bg-surface p-[3px]",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const classes = cn(
          "flex items-center justify-center transition-colors",
          "rounded-full",
          small
            ? "min-h-[30px] px-3 text-xs"
            : "min-h-[38px] flex-1 px-3 text-sm",
          selected
            ? "bg-text font-bold text-background"
            : "font-semibold text-muted",
          !selected && !option.disabled && "hover:text-text",
          option.disabled && "text-subtle",
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

        if (option.href && shallow) {
          return (
            <ShallowLink
              key={option.value}
              href={option.href}
              aria-current={selected ? "page" : undefined}
              className={classes}
            >
              {option.label}
            </ShallowLink>
          );
        }

        if (option.href) {
          return (
            <Link
              key={option.value}
              href={option.href}
              aria-current={selected ? "page" : undefined}
              className={cn(classes, "relative")}
            >
              {option.label}
              <LinkPending />
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

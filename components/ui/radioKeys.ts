import type { KeyboardEvent } from "react";

const STEPS: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

// Keyboard for a role="radiogroup" of buttons: only the checked radio is in
// the tab order, and the arrow keys (plus Home and End) move the selection,
// like native radio buttons. Put it on the group's onKeyDown.
export const onRadioKeyDown = (event: KeyboardEvent<HTMLElement>) => {
  const radios = [
    ...event.currentTarget.querySelectorAll<HTMLElement>(
      '[role="radio"]:not([aria-disabled="true"])',
    ),
  ];
  const index = radios.indexOf(event.target as HTMLElement);
  if (index < 0) return;

  const step = STEPS[event.key];
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? radios.length - 1
        : step
          ? (index + step + radios.length) % radios.length
          : -1;
  if (next < 0) return;

  event.preventDefault();
  radios[next].focus();
  radios[next].click();
};

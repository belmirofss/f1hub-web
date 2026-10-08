"use client";

import type { ComponentPropsWithoutRef, MouseEvent } from "react";

type Props = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  // id of the element to scroll to
  target: string;
};

// An in-page link that glides to its target (or jumps, for visitors who
// prefer reduced motion) and moves focus there, so keyboard users carry on
// from the row they landed on. Without JavaScript it's a plain #anchor.
export const JumpLink = ({ target, onClick, ...props }: Props) => {
  const jump = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    // Let new-tab clicks and the like through
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const element = document.getElementById(target);
    if (!element) return;

    event.preventDefault();
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    element.scrollIntoView({
      behavior: reduceMotion ? "instant" : "smooth",
      block: "start",
    });
    const focusable =
      element.querySelector<HTMLElement>("a, button") ?? element;
    focusable.focus({ preventScroll: true });
  };

  return <a href={`#${target}`} onClick={jump} {...props} />;
};

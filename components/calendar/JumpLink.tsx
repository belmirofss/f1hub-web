"use client";

import type { ComponentPropsWithoutRef, MouseEvent } from "react";

type Props = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  // id of the element to scroll to
  target: string;
};

// New-tab clicks and the like are left to the browser
export const isPlainClick = (event: MouseEvent<HTMLAnchorElement>) =>
  !event.defaultPrevented &&
  event.button === 0 &&
  !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);

// Glides to an element (or jumps, for visitors who prefer reduced motion)
// and moves focus there, so keyboard users carry on from the row they
// landed on
export const glideTo = (element: HTMLElement) => {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  element.scrollIntoView({
    behavior: reduceMotion ? "instant" : "smooth",
    block: "start",
  });
  const focusable = element.querySelector<HTMLElement>("a, button") ?? element;
  focusable.focus({ preventScroll: true });
};

// An in-page link that glides to its target. Without JavaScript it's a
// plain #anchor.
export const JumpLink = ({ target, onClick, ...props }: Props) => {
  const jump = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (!isPlainClick(event)) return;
    const element = document.getElementById(target);
    if (!element) return;

    event.preventDefault();
    glideTo(element);
  };

  return <a href={`#${target}`} onClick={jump} {...props} />;
};

"use client";

import type { ComponentProps, MouseEvent } from "react";
import Link from "next/link";
import { glideTo, isPlainClick } from "./JumpLink";

type Props = ComponentProps<typeof Link> & {
  round: string;
  // id of the selected round's details
  details: string;
};

// A link that picks a round on the timeline or the month grid and lands on
// its details. When they already show that round it glides there without
// asking the server for the same page again.
export const PickRoundLink = ({ round, details, onClick, ...props }: Props) => {
  const pick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (!isPlainClick(event)) return;
    const element = document.getElementById(details);
    if (element?.dataset.round !== round || !element.checkVisibility()) return;

    event.preventDefault();
    glideTo(element);
  };

  return <Link onClick={pick} {...props} />;
};

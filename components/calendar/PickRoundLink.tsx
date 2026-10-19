"use client";

import type { ComponentProps, MouseEvent } from "react";
import { ShallowLink } from "@/components/ui/ShallowLink";
import { glideTo, isPlainClick } from "./JumpLink";

type Props = ComponentProps<typeof ShallowLink> & {
  round: string;
  // id of the selected round's details
  details: string;
};

// A link that picks a round on the timeline or the month grid and lands on
// its details. When they already show that round it only glides there,
// rather than adding the same URL to the history again.
export const PickRoundLink = ({ round, details, onClick, ...props }: Props) => {
  const pick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (!isPlainClick(event)) return;
    const element = document.getElementById(details);
    if (element?.dataset.round !== round || !element.checkVisibility()) return;

    event.preventDefault();
    glideTo(element);
  };

  return <ShallowLink onClick={pick} {...props} />;
};

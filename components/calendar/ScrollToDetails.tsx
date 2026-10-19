"use client";

import { useEffect, useRef } from "react";
import { glideTo } from "./JumpLink";

// A #round-details link that picks another round (the next-race button, a
// round on the phone's timeline) should land on its details. They stream
// in after the navigation, too late for the router's own scroll to the
// hash, so this glides there once they're on screen. The hash is then
// dropped, so going back and forth through history doesn't scroll again.
export const ScrollToDetails = () => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const details = ref.current?.parentElement;
    if (!details?.id || window.location.hash !== `#${details.id}`) return;
    glideTo(details);
    const { pathname, search } = window.location;
    window.history.replaceState(window.history.state, "", pathname + search);
  }, []);

  return <span ref={ref} hidden />;
};

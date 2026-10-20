"use client";

import { useEffect } from "react";

// "Around now" opens at the next round: on a fresh load at the top of the
// page, the posters scroll so it's in view. Once only: the next round
// moving on, or the filter picked again, leaves the page where it is. A
// #hash, a restored scroll position or a reader already scrolling wins.
// Without JavaScript the page simply starts at the top.
export const ScrollToRound = ({ target }: { target: string }) => {
  useEffect(() => {
    if (window.location.hash || window.scrollY > 0) return;
    document.getElementById(target)?.scrollIntoView({ block: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

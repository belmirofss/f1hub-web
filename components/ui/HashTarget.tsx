"use client";

import { useEffect } from "react";

// Next scrolls to a #hash before a section behind Suspense has streamed in,
// so the section scrolls itself into view once it renders. Put it inside the
// element with that id.
export const HashTarget = ({ id }: { id: string }) => {
  useEffect(() => {
    if (window.location.hash === `#${id}`) {
      document.getElementById(id)?.scrollIntoView();
    }
  }, [id]);
  return null;
};

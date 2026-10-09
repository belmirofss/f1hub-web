"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The search page's field
export const SEARCH_INPUT_ID = "site-search";

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

// "/" (outside a text field) and Ctrl/Cmd+K jump to search from any page, or
// focus the field when search is already open. Mounted once in the root
// layout.
export const SearchShortcut = () => {
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey) return;
      const commandK =
        (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
      const slash =
        event.key === "/" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !isTyping(event.target);
      if (!commandK && !slash) return;

      event.preventDefault();
      const input = document.getElementById(SEARCH_INPUT_ID);
      if (input instanceof HTMLInputElement) {
        input.focus();
        input.select();
      } else {
        router.push("/search");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return null;
};

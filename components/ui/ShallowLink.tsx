"use client";

import type { ComponentProps } from "react";
import Link from "next/link";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

// A link to another state of the page already on screen, for views drawn
// from data the page has: the URL changes in place (history.pushState, which
// Next's router passes on to useSearchParams) without asking the server, so
// the click answers at once. It stays a real link: a new tab, a shared URL
// or a visit without JavaScript gets the server-rendered page.
export const ShallowLink = ({ href, onNavigate, ...props }: Props) => (
  <Link
    href={href}
    prefetch={false}
    scroll={false}
    onNavigate={(event) => {
      onNavigate?.(event);
      event.preventDefault();
      window.history.pushState(null, "", href);
    }}
    {...props}
  />
);

"use client";

import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, Calendar, House } from "lucide-react";
import { cn } from "@/lib/cn";

// The app's "podium" tab icon, which lucide doesn't have
const Podium = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 20v-8h5v8M9 20V6h6v14M15 20v-9h5v9M2 20h20" />
  </svg>
);

type Item = {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  // Sections that live under this tab: a race weekend belongs to Calendar
  match: (pathname: string) => boolean;
};

const under = (pathname: string, ...prefixes: string[]) =>
  prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

const ITEMS: Item[] = [
  { href: "/", label: "Home", Icon: House, match: (p) => p === "/" },
  {
    href: "/calendar",
    label: "Calendar",
    Icon: Calendar,
    match: (p) => under(p, "/calendar", "/races"),
  },
  {
    href: "/standings",
    label: "Standings",
    Icon: Podium,
    match: (p) => under(p, "/standings"),
  },
  {
    href: "/archive",
    label: "Archive",
    Icon: Archive,
    match: (p) => under(p, "/archive", "/seasons"),
  },
];

type Variant = "top" | "bottom";

// The four main sections, as text links in the desktop header or as the
// phone's bottom tab bar. Without a pathname nothing is highlighted: that's
// the Suspense fallback while the URL isn't known during prerendering.
export const NavItems = ({
  variant,
  pathname,
}: {
  variant: Variant;
  pathname?: string;
}) =>
  ITEMS.map(({ href, label, Icon, match }) => {
    const active = pathname ? match(pathname) : false;

    if (variant === "top") {
      return (
        <Link
          key={href}
          href={href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-2 font-semibold transition-colors",
            active
              ? "bg-surface text-text shadow-[inset_0_-2px_0_var(--accent)]"
              : "text-muted hover:text-text",
          )}
        >
          {label}
        </Link>
      );
    }

    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "-mt-px flex min-h-[51px] flex-1 flex-col items-center gap-[3px] border-t-2 pt-2 text-[11px] leading-4",
          active
            ? "border-accent font-bold text-accent"
            : "border-transparent font-semibold text-muted",
        )}
      >
        <Icon aria-hidden className="size-[23px]" />
        {label}
      </Link>
    );
  });

export const ActiveNavItems = ({ variant }: { variant: Variant }) => (
  <NavItems variant={variant} pathname={usePathname()} />
);

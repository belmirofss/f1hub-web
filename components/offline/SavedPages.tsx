"use client";

import { useEffect, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import {
  Archive,
  Calendar,
  FileText,
  Flag,
  House,
  Route,
  Search,
  Settings,
  User,
  Users,
} from "lucide-react";
import { Podium } from "@/components/layout/MainNav";
import { useSettings } from "@/components/settings/SettingsProvider";
import { SITE_NAME } from "@/lib/metadata";
import { formatClock, formatShortDate, startOfDay } from "@/lib/domain/time";

// Pages public/sw.js saved in its pages cache, newest first. Each copy keeps
// its title and the time it was saved in headers.
const PAGES_CACHE_PREFIX = "f1hub-pages-";

type SavedPage = { href: string; title: string; savedAt: number };

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const ICONS: [prefix: string, Icon][] = [
  ["/calendar", Calendar],
  ["/races", Flag],
  ["/standings", Podium],
  ["/archive", Archive],
  ["/seasons", Archive],
  ["/drivers", User],
  ["/teams", Users],
  ["/circuits", Route],
  ["/search", Search],
  ["/settings", Settings],
];

const iconFor = (href: string) => {
  const { pathname } = new URL(href, location.origin);
  if (pathname === "/") return House;
  return ICONS.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? FileText;
};

// "Max Verstappen: F1 stats, results and career | F1HUB" without the site
// name. Home's title is just "F1HUB". The title comes straight from the
// HTML, entities and all.
const cleanTitle = (raw: string | null, pathname: string) => {
  const html = raw ? decodeURIComponent(raw) : "";
  const text =
    new DOMParser().parseFromString(html, "text/html").documentElement
      .textContent ?? "";
  const title = text.replace(` | ${SITE_NAME}`, "").trim();
  if (pathname === "/" || title === SITE_NAME) return "Home";
  return title || pathname;
};

const loadSavedPages = async (): Promise<SavedPage[]> => {
  if (!("caches" in window)) return [];
  const names = (await caches.keys()).filter((name) =>
    name.startsWith(PAGES_CACHE_PREFIX),
  );

  const pages: SavedPage[] = [];
  for (const name of names) {
    const cache = await caches.open(name);
    for (const request of await cache.keys()) {
      const response = await cache.match(request);
      if (!response) continue;
      const url = new URL(request.url);
      pages.push({
        href: url.pathname + url.search,
        title: cleanTitle(response.headers.get("x-f1hub-title"), url.pathname),
        savedAt: Number(response.headers.get("x-f1hub-saved-at")) || 0,
      });
    }
  }
  return pages.sort((a, b) => b.savedAt - a.savedAt);
};

// "SAVED 14:02" today, "SAVED 07 OCT" before that
const savedLabel = (savedAt: number, clock24: boolean) =>
  `Saved ${
    savedAt >= startOfDay(Date.now())
      ? formatClock(savedAt, clock24)
      : formatShortDate(savedAt)
  }`;

export const SavedPages = () => {
  const { clock24 } = useSettings();
  // Null until the cache has been read
  const [pages, setPages] = useState<SavedPage[] | null>(null);

  useEffect(() => {
    loadSavedPages()
      .catch(() => [])
      .then(setPages);
  }, []);

  if (!pages) return null;

  if (pages.length === 0) {
    return (
      <p className="rounded-lg border border-line bg-surface p-3.5 text-[13px] leading-5 text-muted">
        Nothing is saved yet. Pages you open while online are kept on this
        device, so they work next time you lose the connection.
      </p>
    );
  }

  return (
    <ul
      aria-label="Saved pages"
      className="overflow-hidden rounded-lg border border-line bg-surface"
    >
      {pages.map(({ href, title, savedAt }) => {
        const Icon = iconFor(href);
        return (
          <li key={href} className="border-b border-line-soft last:border-b-0">
            {/* A full page load, which the service worker answers from its
                cache. A client-side navigation would need the network. */}
            <a
              href={href}
              className="flex min-h-[52px] items-center gap-3 px-3.5 py-2 transition-colors hover:bg-surface-raised"
            >
              <Icon aria-hidden className="size-[18px] shrink-0 text-muted" />
              <span className="line-clamp-2 min-w-0 flex-1 leading-5 font-semibold">
                {title}
              </span>
              <span className="shrink-0 font-mono text-[10px] text-muted uppercase">
                {savedLabel(savedAt, clock24)}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
};

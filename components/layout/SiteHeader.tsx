import { Suspense } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { IconButton } from "@/components/ui/Card";
import { ActiveNavItems, NavItems } from "./MainNav";
import { Wordmark } from "./Wordmark";

// Top navigation from 768px up. Phones get the bottom tab bar instead, and
// tablets get a search icon until there's room for the inline field.
export const SiteHeader = () => (
  <header className="hidden border-b border-line md:block">
    <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-6 gap-y-3 px-6 py-3">
      <Wordmark />
      <nav aria-label="Main" className="flex flex-wrap gap-1">
        <Suspense fallback={<NavItems variant="top" />}>
          <ActiveNavItems variant="top" />
        </Suspense>
      </nav>
      <div className="ml-auto flex flex-1 items-center justify-end gap-3">
        <Link
          href="/search"
          className="hidden max-w-[420px] min-w-0 flex-1 items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3 text-muted transition-colors hover:border-line-dashed lg:flex"
        >
          <Search aria-hidden size={18} className="shrink-0" strokeWidth={2} />
          <span className="min-h-10 flex-1 truncate leading-10">
            Search drivers, teams, circuits, races, years
          </span>
          <kbd
            aria-hidden
            className="rounded-sm border border-line px-1.5 font-mono text-[11px] text-faint"
          >
            /
          </kbd>
        </Link>
        <IconButton href="/search" label="Search" className="size-10 lg:hidden">
          <Search aria-hidden size={18} strokeWidth={2} />
        </IconButton>
        <IconButton href="/settings" label="Settings" className="size-10">
          <SlidersHorizontal aria-hidden size={18} strokeWidth={2} />
        </IconButton>
      </div>
    </div>
  </header>
);

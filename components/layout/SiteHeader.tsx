import { Suspense } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { IconButton } from "@/components/ui/Card";
import { ActiveNavItems, NavItems } from "./MainNav";
import { Wordmark } from "./Wordmark";

// The header at every width: wordmark, the four sections from 768px up
// (phones get the bottom tab bar), search and settings. The season spine
// sits right under it.
export const SiteHeader = () => (
  <header className="border-b-2 border-text">
    <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-6 pr-2 pl-4 md:px-6">
      <Wordmark />
      <nav aria-label="Main" className="flex self-stretch max-md:hidden">
        <Suspense fallback={<NavItems variant="top" />}>
          <ActiveNavItems variant="top" />
        </Suspense>
      </nav>
      <div className="ml-auto flex flex-1 items-center justify-end gap-1 md:gap-2">
        <Link
          href="/search"
          className="hidden h-10 max-w-[360px] min-w-0 flex-1 items-center gap-2.5 border border-line bg-surface px-3 text-sm text-muted transition-colors hover:border-line-dashed lg:flex"
        >
          <Search aria-hidden size={16} className="shrink-0" strokeWidth={2} />
          <span className="flex-1 truncate">Drivers, teams, races, years…</span>
          <kbd
            aria-hidden
            className="border border-line px-1.5 font-mono text-[11px] text-muted"
          >
            /
          </kbd>
        </Link>
        <IconButton
          href="/search"
          label="Search"
          bordered={false}
          className="lg:hidden"
        >
          <Search aria-hidden size={20} strokeWidth={2} />
        </IconButton>
        <IconButton href="/settings" label="Settings" bordered={false}>
          <SlidersHorizontal aria-hidden size={18} strokeWidth={2} />
        </IconButton>
      </div>
    </div>
  </header>
);

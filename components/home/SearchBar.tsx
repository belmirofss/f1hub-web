import Link from "next/link";
import { Search } from "lucide-react";

// Looks like a field but opens the search page, where the real input lives.
// Phones only: from 768px the header has search.
export const SearchBar = () => (
  <Link
    href="/search"
    aria-label="Search drivers, teams, circuits, races and seasons"
    className="flex min-h-[46px] items-center gap-2.5 rounded-lg border border-line bg-surface px-3.5 text-muted transition-colors hover:bg-surface-raised md:hidden"
  >
    <Search aria-hidden size={18} strokeWidth={2} className="shrink-0" />
    <span className="truncate text-faint">
      Drivers, teams, circuits, races, years
    </span>
  </Link>
);

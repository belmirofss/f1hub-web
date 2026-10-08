import { SlidersHorizontal } from "lucide-react";
import { Columns } from "@/components/layout/Columns";
import { Wordmark } from "@/components/layout/Wordmark";
import { Stub } from "@/components/Stub";
import { IconButton } from "@/components/ui/Card";

// Placeholder until the Home page (#8)
export default function Home() {
  return (
    <>
      {/* Phones have no top navigation, so Home carries the wordmark and settings */}
      <header className="flex items-center justify-between pt-[18px] md:hidden">
        <Wordmark />
        <IconButton href="/settings" label="Settings">
          <SlidersHorizontal aria-hidden size={18} strokeWidth={2} />
        </IconButton>
      </header>
      <h1 className="sr-only">F1HUB</h1>
      <Columns
        className="md:pt-5 lg:pt-6"
        aside={
          <Stub
            issue={8}
            links={[
              { href: "/standings", label: "Standings" },
              { href: "/drivers/antonelli", label: "Andrea Kimi Antonelli" },
            ]}
          >
            Top 5 with recent form and the closest teammate battle.
          </Stub>
        }
      >
        <Stub
          issue={8}
          links={[
            {
              href: "/races/2026/singapore-grand-prix/schedule",
              label: "Singapore Grand Prix",
            },
            { href: "/search", label: "Search" },
          ]}
        >
          The next race with its countdown and sessions, and the last
          race&apos;s results.
        </Stub>
      </Columns>
    </>
  );
}

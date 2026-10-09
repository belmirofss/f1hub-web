import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { seasonHref } from "@/lib/domain/routes";
import type { SeasonInfo } from "@/lib/season";

type View = "drivers" | "constructors" | "races" | "teammates";

export const SeasonHeader = ({
  season,
  value,
}: {
  season: SeasonInfo;
  value: View;
}) => {
  const base = seasonHref(season.year);
  const hrefs: Record<View, string> = {
    drivers: base,
    constructors: `${base}/constructors`,
    races: `${base}/races`,
    teammates: `${base}/teammates`,
  };

  return (
    <PageHeader
      back="/archive"
      meta={
        <>
          {/* Desktop has no Back button, so the meta leads to the archive */}
          <span className="max-lg:hidden">
            <Link href="/archive" className="hover:text-text">
              ARCHIVE
            </Link>
            {" / "}
          </span>
          {season.rounds > 0 && `${season.rounds} ROUNDS`}
        </>
      }
      title={`Season ${season.year}`}
    >
      <Tabs
        label="Season sections"
        value={hrefs[value]}
        className="-mx-4 px-1 md:mx-0 md:px-0"
        tabs={[
          { href: hrefs.drivers, label: "Drivers" },
          { href: hrefs.constructors, label: "Constructors" },
          { href: hrefs.races, label: "Races" },
          { href: hrefs.teammates, label: "Teammates" },
        ]}
      />
    </PageHeader>
  );
};

import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { Tabs } from "@/components/ui/Tabs";
import { seasonHref } from "@/lib/domain/routes";
import type { SeasonInfo } from "@/lib/season";
import { breadcrumbLd, seasonCrumbs } from "@/lib/structuredData";

type View = "drivers" | "constructors" | "races" | "teammates";

const LABELS: Record<View, string> = {
  drivers: "Drivers",
  constructors: "Constructors",
  races: "Races",
  teammates: "Teammates",
};

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

  // The drivers' standings are the season's own page
  const crumbs = seasonCrumbs(season.year);
  if (value !== "drivers")
    crumbs.push({ name: LABELS[value], path: hrefs[value] });

  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
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
          tabs={(Object.keys(hrefs) as View[]).map((view) => ({
            href: hrefs[view],
            label: LABELS[view],
          }))}
        />
      </PageHeader>
    </>
  );
};

import { Suspense } from "react";
import { Card, InlineLink } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import type { CareerRace } from "@/lib/api/jolpica";
import type { Driver } from "@/lib/api/types";
import { getWikipediaSummary } from "@/lib/api/wikipedia";
import { getDeathYear } from "@/lib/domain/drivers";
import { formatLongDate, toDate, yearsBetween } from "@/lib/domain/time";
import { getRequestTime } from "@/lib/requestTime";

// " · 20 years", worked out per request so the cached page doesn't age
const Age = async ({ dateOfBirth }: { dateOfBirth: string }) => {
  const now = await getRequestTime();
  return <> · {yearsBetween(dateOfBirth, now)} years</>;
};

// The Wikipedia summary, rendered on the server so it's in the HTML, and the
// facts: born, nationality, number, debut and titles
export const AboutCard = async ({
  driver,
  debut,
  titles,
}: {
  driver: Driver;
  debut?: CareerRace;
  titles: string[];
}) => {
  // The facts still show when Wikipedia is down
  const summary = await getWikipediaSummary(driver.url).catch(() => null);
  const died = getDeathYear(summary?.description);
  const born = formatLongDate(toDate(driver.dateOfBirth), "UTC");

  const facts = [
    {
      label: "Born",
      value: (
        <>
          <time dateTime={driver.dateOfBirth}>{born}</time>
          {/* Without Wikipedia there's no telling whether they're alive */}
          {summary && !died && (
            <Suspense fallback={null}>
              <Age dateOfBirth={driver.dateOfBirth} />
            </Suspense>
          )}
        </>
      ),
    },
    died && { label: "Died", value: died },
    { label: "Nationality", value: driver.nationality },
    driver.permanentNumber && {
      label: "Number",
      value: driver.permanentNumber,
    },
    debut && { label: "Debut", value: `${debut.season} ${debut.raceName}` },
    titles.length > 0 && { label: "Titles", value: titles.join(", ") },
  ].filter((fact) => !!fact);

  return (
    <Card as="section" aria-labelledby="about">
      <h2 id="about">
        <Label>About</Label>
      </h2>
      {summary && (
        <p className="text-[15px] leading-[22px] text-soft">
          {summary.extract}
        </p>
      )}
      <dl className="flex flex-col">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="flex min-h-9 items-center justify-between gap-3 border-t border-line-soft py-1"
          >
            <dt className="text-[13px] text-muted">{fact.label}</dt>
            <dd className="text-right text-sm font-semibold">{fact.value}</dd>
          </div>
        ))}
      </dl>
      <InlineLink
        href={driver.url.replace(/^http:/, "https:")}
        className="self-start"
      >
        Read on Wikipedia
      </InlineLink>
    </Card>
  );
};

export const AboutCardSkeleton = () => (
  <CardSkeleton lines={7} className="min-h-[360px]" />
);

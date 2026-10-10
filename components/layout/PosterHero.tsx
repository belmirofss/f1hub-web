import type { ReactNode } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/cn";
import type { TeamHero } from "@/lib/domain/teams";
import { BackButton } from "./BackButton";

// Headline sizes by length: "Verstappen" fills the block, "Alfa Romeo
// Racing" has to come down to fit a phone
const headlineSize = (text: string) =>
  text.length > 14
    ? "text-[38px] lg:text-[84px]"
    : text.length > 10
      ? "text-[46px] lg:text-[104px]"
      : "text-[56px] lg:text-[128px]";

// The "Livery Poster" header of the driver and team pages: a block in the
// team colour with a giant faint number, the mono meta line, the name as a
// huge headline and the title years as chips. Edge to edge on phones, where
// Back sits in its top corner.
export const PosterHero = ({
  hero,
  meta,
  kicker,
  headline,
  number,
  titles,
  titlesLabel,
  back,
}: {
  hero: TeamHero;
  // "DRIVER · RED BULL RACING · NLD"
  meta: ReactNode;
  // Above the headline: the driver's given name
  kicker?: string;
  headline: string;
  // The car number, drawn faintly behind the name
  number?: string;
  titles: string[];
  // "World titles" or "Constructors' titles", for screen readers
  titlesLabel: string;
  // Where Back goes when the visitor didn't come from another F1HUB page
  back: string;
}) => (
  <header
    className="relative -mx-4 flex min-h-[380px] flex-col overflow-hidden px-5 pt-1 pb-[22px] md:-mx-6 md:px-6 lg:mx-0 lg:mt-6 lg:min-h-[400px] lg:px-11 lg:pt-[30px] lg:pb-[30px] [&_a:focus-visible]:outline-current"
    style={{ backgroundColor: hero.background, color: hero.text }}
  >
    {number && (
      <span
        aria-hidden
        className="absolute -top-8 -right-2.5 font-display text-[340px] leading-none font-black opacity-20 select-none lg:-top-[90px] lg:right-[30px] lg:text-[560px]"
      >
        {number}
      </span>
    )}
    <div className="relative -ml-2.5 flex min-h-11 items-center lg:ml-0 lg:min-h-0 standalone:-ml-2.5">
      <BackButton
        fallbackHref={back}
        className="text-current hover:bg-current/15 lg:hidden standalone:flex"
      />
      <p className="truncate font-mono text-[10px] tracking-[0.14em] uppercase lg:text-xs lg:tracking-[0.16em]">
        {meta}
      </p>
    </div>
    <div className="relative mt-auto flex flex-col gap-1.5 pt-8">
      <h1 className="flex flex-col gap-1.5">
        {kicker && (
          <span className="text-xl font-medium lg:text-[30px] lg:leading-9">
            {kicker}
          </span>
        )}
        <span
          className={cn(
            "font-display leading-[0.85] font-black tracking-[0.005em] break-words uppercase lg:leading-[0.82]",
            headlineSize(headline),
          )}
        >
          {headline}
        </span>
      </h1>
      {titles.length > 0 && (
        <ul
          aria-label={titlesLabel}
          className="mt-3 flex flex-wrap gap-1.5 lg:mt-[18px] lg:gap-2"
        >
          {titles.map((year) => (
            <li
              key={year}
              className="flex h-7 items-center gap-1 rounded-full px-2.5 font-mono text-[11px] font-bold lg:h-[34px] lg:gap-1.5 lg:px-3.5 lg:text-[13px]"
              style={{ backgroundColor: hero.text, color: hero.background }}
            >
              <Star
                aria-hidden
                size={12}
                strokeWidth={2.5}
                className="fill-current"
              />
              {year}
            </li>
          ))}
        </ul>
      )}
    </div>
  </header>
);

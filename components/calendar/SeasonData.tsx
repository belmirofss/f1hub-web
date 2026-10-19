"use client";

import { createContext, Suspense, use, type ComponentProps } from "react";
import {
  PLACEHOLDER_OUTLINE,
  type TrackOutline as Outline,
} from "@/lib/domain/trackMap";
import { TrackOutline } from "./TrackOutline";

// What the calendar's views take from the server besides the rounds
export type SeasonData = {
  // Each circuit's outline by circuitId, a promise each: most ship with the
  // app and are ready at once, a new venue's comes from OpenF1 and streams
  // in when ready
  outlines: Record<string, Promise<Outline>>;
  // "SGP" for "Singapore", worked out on the server so the countries table
  // stays out of the browser
  countryCodes: Record<string, string>;
};

export const SeasonDataContext = createContext<SeasonData>({
  outlines: {},
  countryCodes: {},
});

// A circuit's country as three letters: "SGP", "USA"
export const CountryCode = ({ country }: { country: string }) =>
  use(SeasonDataContext).countryCodes[country] ??
  country.slice(0, 3).toUpperCase();

type OutlineProps = Omit<ComponentProps<typeof TrackOutline>, "outline"> & {
  circuitId: string;
};

const LoadedOutline = ({ circuitId, ...props }: OutlineProps) => {
  const outline = use(SeasonDataContext).outlines[circuitId];
  return (
    <TrackOutline
      outline={outline ? use(outline) : PLACEHOLDER_OUTLINE}
      {...props}
    />
  );
};

// A circuit's outline, with the placeholder loop standing in until it's
// loaded
export const SeasonOutline = (props: OutlineProps) => (
  <Suspense
    fallback={<TrackOutline outline={PLACEHOLDER_OUTLINE} {...props} />}
  >
    <LoadedOutline {...props} />
  </Suspense>
);

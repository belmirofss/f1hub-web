"use client";

import { createContext, Suspense, use, type ComponentProps } from "react";
import {
  PLACEHOLDER_OUTLINE,
  type TrackOutline as Outline,
} from "@/lib/domain/trackMap";
import { TrackOutline } from "./TrackOutline";

// The season's circuit outlines by circuitId, each a promise from the
// server: most ship with the app and are ready at once, a new venue's comes
// from OpenF1 and streams in when ready
export type SeasonOutlines = Record<string, Promise<Outline>>;

export const SeasonOutlinesContext = createContext<SeasonOutlines>({});

type Props = Omit<ComponentProps<typeof TrackOutline>, "outline"> & {
  circuitId: string;
};

const LoadedOutline = ({ circuitId, ...props }: Props) => {
  const outline = use(SeasonOutlinesContext)[circuitId];
  return (
    <TrackOutline
      outline={outline ? use(outline) : PLACEHOLDER_OUTLINE}
      {...props}
    />
  );
};

// A circuit's outline, with the placeholder loop standing in until it's
// loaded
export const SeasonOutline = (props: Props) => (
  <Suspense
    fallback={<TrackOutline outline={PLACEHOLDER_OUTLINE} {...props} />}
  >
    <LoadedOutline {...props} />
  </Suspense>
);

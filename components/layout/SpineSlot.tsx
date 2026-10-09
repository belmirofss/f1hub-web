import { Slot } from "@/components/ui/Slot";
import { SeasonSpine, SeasonSpineSkeleton } from "./SeasonSpine";

type Params = Promise<{ year?: string; slug?: string }>;

const FromParams = async ({ params }: { params: Params }) => {
  const { year, slug } = await params;
  return <SeasonSpine year={year} slug={slug} />;
};

// What the root layout's @spine slot renders. It streams in on its own, and
// a failure only drops the strip.
export const SeasonSpineSlot = ({ params }: { params?: Params }) => (
  <Slot fallback={<SeasonSpineSkeleton />}>
    {params ? <FromParams params={params} /> : <SeasonSpine />}
  </Slot>
);

export const CurrentSeasonSpine = () => <SeasonSpineSlot />;

// The race and season tabs in app/@spine: each URL needs a page there for
// the slot's layout (the spine) to render, but the page itself adds nothing
export const NoSpine = () => null;

// Ported from the app's src/helpers/results.ts (the rest arrives in #6).
import type { Result } from "@/lib/api/types";

// Finishers have a number; "R", "D", "W", "N", "E" mean retired, disqualified…
export const isClassified = (result: Pick<Result, "positionText">) =>
  /^\d+$/.test(result.positionText);

"use client";

import { useState } from "react";
import { ErrorState } from "@/components/ui/States";

export const RetryDemo = () => {
  const [tries, setTries] = useState(0);

  return (
    <ErrorState onRetry={() => setTries((count) => count + 1)}>
      Couldn&apos;t load this right now.
      {tries > 0 && ` (retried ${tries}×)`}
    </ErrorState>
  );
};

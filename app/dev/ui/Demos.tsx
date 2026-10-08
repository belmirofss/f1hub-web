"use client";

import { useState } from "react";
import { Segmented } from "@/components/ui/Segmented";
import { ErrorState } from "@/components/ui/States";

export const TimeZoneToggle = () => {
  const [zone, setZone] = useState<"mine" | "track">("mine");

  return (
    <Segmented
      label="Time zone"
      size="small"
      value={zone}
      onChange={setZone}
      options={[
        { value: "mine", label: "My time" },
        { value: "track", label: "Track" },
      ]}
    />
  );
};

export const RetryDemo = () => {
  const [tries, setTries] = useState(0);

  return (
    <ErrorState onRetry={() => setTries((count) => count + 1)}>
      Couldn&apos;t load this right now.
      {tries > 0 && ` (retried ${tries}×)`}
    </ErrorState>
  );
};

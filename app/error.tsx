"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  StatusScreen,
  primaryButton,
  secondaryButton,
} from "@/components/layout/StatusScreen";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusScreen
      lit={3}
      label="Red flag"
      title="Something went wrong"
      actions={
        <>
          <button type="button" onClick={retry} className={primaryButton}>
            Try again
          </button>
          <Link href="/" className={secondaryButton}>
            Go home
          </Link>
        </>
      }
    >
      This page couldn&apos;t load. The data sources may be busy, so try again
      in a moment.
    </StatusScreen>
  );
}

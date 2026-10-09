import type { Metadata } from "next";
import Link from "next/link";
import {
  StatusScreen,
  primaryButton,
  secondaryButton,
} from "@/components/layout/StatusScreen";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Offline",
  description: "You're offline. Pages you've opened before still work.",
  path: "/offline",
  noindex: true,
});

// Service worker fallback. #25 adds the saved pages and the retry.
export default function OfflinePage() {
  return (
    <StatusScreen
      lit={3}
      label="Red flag · no connection"
      title="You're offline"
      actions={
        <>
          <Link href="/calendar" className={primaryButton}>
            Calendar
          </Link>
          <Link href="/standings" className={secondaryButton}>
            Standings
          </Link>
        </>
      }
    >
      This page isn&apos;t saved on your device yet. Pages you&apos;ve opened
      before still work.
    </StatusScreen>
  );
}

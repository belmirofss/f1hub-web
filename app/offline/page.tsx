import type { Metadata } from "next";
import { StatusScreen } from "@/components/layout/StatusScreen";
import { SavedPages } from "@/components/offline/SavedPages";
import { TryAgainButton } from "@/components/offline/TryAgainButton";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Offline",
  description: "You're offline. Pages you've opened before still work.",
  path: "/offline",
  noindex: true,
});

// public/sw.js precaches this page and serves it for pages that aren't saved
// when there's no connection
export default function OfflinePage() {
  return (
    <StatusScreen
      lit={3}
      label="Red flag · no connection"
      title="You're offline"
      details={<SavedPages />}
      actions={<TryAgainButton />}
    >
      This page isn&apos;t saved on your device yet. Pages you&apos;ve opened
      before still work.
    </StatusScreen>
  );
}

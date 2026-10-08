import type { Metadata } from "next";
import Link from "next/link";
import {
  StatusScreen,
  primaryButton,
  secondaryButton,
} from "@/components/layout/StatusScreen";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <StatusScreen
      lit={5}
      label="404 · Off track"
      title="Page not found"
      actions={
        <>
          <Link href="/" className={primaryButton}>
            Go home
          </Link>
          <Link href="/calendar" className={secondaryButton}>
            Calendar
          </Link>
          <Link href="/search" className={secondaryButton}>
            Search
          </Link>
        </>
      }
    >
      There&apos;s nothing at this address. It may have moved, or the link has a
      typo.
    </StatusScreen>
  );
}

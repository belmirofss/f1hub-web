import { Suspense, type ReactNode } from "react";
import { CardBoundary, SilentBoundary } from "./CardBoundary";

// A card that loads on its own, so one slow or failing API only holds up (or
// breaks) its own card
export const Slot = ({
  label,
  fallback,
  children,
}: {
  // Shown on the card if it fails; omit to drop the card silently
  label?: string;
  fallback: ReactNode;
  children: ReactNode;
}) => {
  const content = <Suspense fallback={fallback}>{children}</Suspense>;
  return label ? (
    <CardBoundary label={label}>{content}</CardBoundary>
  ) : (
    <SilentBoundary>{content}</SilentBoundary>
  );
};

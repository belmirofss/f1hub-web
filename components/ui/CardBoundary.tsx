"use client";

import { catchError, type ErrorInfo } from "next/error";
import { Card } from "./Card";
import { Label } from "./Label";
import { ErrorState } from "./States";

// Keeps a failed card from taking the whole page down: the rest of the page
// stays, and this card offers to try again
export const CardBoundary = catchError(function CardError(
  { label }: { label?: string },
  { retry }: ErrorInfo,
) {
  return (
    <Card>
      {label && <Label>{label}</Label>}
      <ErrorState onRetry={retry} />
    </Card>
  );
});

// For extras that can just disappear when their data doesn't load
export const SilentBoundary = catchError(function Silent() {
  return null;
});

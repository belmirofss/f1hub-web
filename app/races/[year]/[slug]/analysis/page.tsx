import type { Metadata } from "next";
import { Stub } from "@/components/Stub";

export const metadata: Metadata = { title: "Race analysis" };

export default function AnalysisPage() {
  return (
    <Stub issue={14}>Lap chart, tyre strategy and the fastest pit stops.</Stub>
  );
}

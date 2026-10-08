import type { Metadata } from "next";
import { Stub } from "@/components/Stub";

export const metadata: Metadata = { title: "Qualifying" };

export default function QualifyingPage() {
  return <Stub issue={13}>Q3, out in Q2 and out in Q1, with gaps.</Stub>;
}

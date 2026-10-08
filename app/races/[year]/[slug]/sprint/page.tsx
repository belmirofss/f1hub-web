import type { Metadata } from "next";
import { Stub } from "@/components/Stub";

export const metadata: Metadata = { title: "Sprint results" };

export default function SprintPage() {
  return (
    <Stub issue={13}>Sprint classification with places gained and points.</Stub>
  );
}

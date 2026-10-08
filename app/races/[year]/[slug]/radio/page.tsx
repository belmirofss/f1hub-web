import type { Metadata } from "next";
import { Stub } from "@/components/Stub";

export const metadata: Metadata = { title: "Team radio" };

export default function RadioPage() {
  return <Stub issue={15}>Team radio and the race control timeline.</Stub>;
}

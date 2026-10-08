import type { Metadata } from "next";
import { Stub } from "@/components/Stub";

export const metadata: Metadata = { title: "Race weekend schedule" };

export default function RaceSchedulePage() {
  return (
    <Stub
      issue={12}
      links={[
        { href: "/circuits/marina_bay", label: "Marina Bay Street Circuit" },
      ]}
    >
      Weekend timeline, forecast, sessions in your time and track time, and
      circuit info.
    </Stub>
  );
}

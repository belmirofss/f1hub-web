import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Stub } from "@/components/Stub";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false },
};

export default function SettingsPage() {
  return (
    <>
      <PageHeader back="/" title="Settings" />
      <Stub issue={4}>Accent colour and 12/24-hour clock.</Stub>
    </>
  );
}

import type { Metadata } from "next";
import { Server, Star } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AppMark } from "@/components/layout/Wordmark";
import {
  ClockSetting,
  InstallRow,
  ShareRow,
} from "@/components/settings/SettingsControls";
import { SettingsRow } from "@/components/settings/SettingsRow";
import { ANDROID_APP_URL, JOLPICA_URL } from "@/lib/links";
import pkg from "@/package.json";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Settings",
  description:
    "Pick a 12 or 24-hour clock for F1HUB. Settings stay on this device.",
  path: "/settings",
  noindex: true,
});

export default function SettingsPage() {
  return (
    <>
      <PageHeader back="/" title="Settings" />
      <div className="flex w-full max-w-xl flex-col gap-[18px] pt-1">
        <div className="flex items-center gap-3.5">
          <AppMark />
          <div>
            <p className="-skew-x-[10deg] font-display text-[30px] leading-8 font-black">
              F1<span className="text-accent-ink">HUB</span>
            </p>
            <p className="font-mono text-xs tracking-[0.14em] text-muted">
              VERSION {pkg.version} · WEB
            </p>
          </div>
        </div>

        <ClockSetting />

        <div className="flex flex-col border-t-2 border-text">
          <InstallRow />
          <SettingsRow
            as="a"
            href={ANDROID_APP_URL}
            icon={<Star aria-hidden size={18} strokeWidth={2} />}
            label="Android app on Google Play"
          />
          <ShareRow />
          <SettingsRow
            as="a"
            href={JOLPICA_URL}
            icon={<Server aria-hidden size={18} strokeWidth={2} />}
            label="Data source"
            value="Jolpica F1 API"
          />
        </div>

        <p className="text-xs leading-[18px] text-muted">
          F1HUB never stores or collects information about you or your device.
          Settings stay in this browser. F1HUB is independent and has no
          relationship with Formula 1.
        </p>
      </div>
    </>
  );
}

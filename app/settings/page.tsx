import type { Metadata } from "next";
import { Download, Server, Star } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  AccentPicker,
  ClockSetting,
  ShareRow,
} from "@/components/settings/SettingsControls";
import { SettingsRow } from "@/components/settings/SettingsRow";
import { ANDROID_APP_URL, JOLPICA_URL } from "@/lib/links";
import pkg from "@/package.json";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false },
};

export default function SettingsPage() {
  return (
    <>
      <PageHeader back="/" title="Settings" />
      <div className="flex w-full max-w-xl flex-col gap-[18px] pt-1">
        <div className="flex items-center gap-3.5">
          <span
            aria-hidden
            className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-line bg-surface"
          >
            <span className="-skew-x-[10deg] font-black">
              F1<span className="text-accent">H</span>
            </span>
          </span>
          <div>
            <p className="text-xl font-black">
              F1<span className="text-accent">HUB</span>
            </p>
            <p className="font-mono text-xs text-muted">
              VERSION {pkg.version} · WEB
            </p>
          </div>
        </div>

        <AccentPicker />
        <ClockSetting />

        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          {/* #26 wires this to the install flow */}
          <SettingsRow
            as="button"
            disabled
            highlight
            icon={<Download aria-hidden size={18} strokeWidth={2} />}
            label="Install F1HUB on this device"
            value="Coming soon"
          />
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

import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { ImageResponse } from "next/og";
import { CACHE_LIFE, type CacheTier } from "@/lib/api/cacheTiers";

// Social cards (opengraph-image / twitter-image) in the Pit Wall style. Each
// route renders at request time from the cached API data and sends the PNG
// with the same cache tier as its page, so the CDN keeps it as long as the
// data behind it stays fresh.

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// Satori reads TTF, not the woff2 that next/font serves, so the fonts ship
// in assets/fonts. They don't depend on the request, so they load once.
const font = (file: string) =>
  readFile(join(process.cwd(), "assets/fonts", file));

const [regular, semiBold, bold, black, jetbrains] = await Promise.all([
  font("TitilliumWeb-Regular.ttf"),
  font("TitilliumWeb-SemiBold.ttf"),
  font("TitilliumWeb-Bold.ttf"),
  font("TitilliumWeb-Black.ttf"),
  font("JetBrainsMono-Bold.ttf"),
]);

const FONTS = [
  { name: "Titillium", data: regular, weight: 400, style: "normal" },
  { name: "Titillium", data: semiBold, weight: 600, style: "normal" },
  { name: "Titillium", data: bold, weight: 700, style: "normal" },
  { name: "Titillium", data: black, weight: 900, style: "normal" },
  { name: "Mono", data: jetbrains, weight: 700, style: "normal" },
] as const;

// The design tokens from globals.css. Social cards can't know the viewer's
// accent setting, so they use the default red.
export const OG_COLORS = {
  background: "#0B0B0D",
  surface: "#141417",
  raised: "#1C1C21",
  line: "#2A2A30",
  text: "#F4F4F5",
  soft: "#C9C9D0",
  muted: "#9A9AA3",
  lightOff: "#26262C",
  accent: "#FF1E00",
  sprint: "#FFD400",
  purple: "#B48CFF",
  rain: "#6FB7FF",
};

const cacheControl = (tier: CacheTier) => {
  const { stale, revalidate, expire } = CACHE_LIFE[tier];
  return `public, max-age=${stale}, s-maxage=${revalidate}, stale-while-revalidate=${expire - revalidate}`;
};

export const ogImage = (element: ReactElement, tier: CacheTier) =>
  new ImageResponse(element, {
    ...OG_SIZE,
    fonts: [...FONTS],
    headers: { "Cache-Control": cacheControl(tier) },
  });

const mono: CSSProperties = {
  fontFamily: "Mono",
  fontWeight: 700,
  textTransform: "uppercase",
};

// "F1HUB" in the slanted black weight, HUB in the accent
export const OgWordmark = ({ size = 48 }: { size?: number }) => (
  <div
    style={{
      display: "flex",
      fontSize: size,
      fontWeight: 900,
      letterSpacing: -1,
      transform: "skewX(-10deg)",
    }}
  >
    F1<span style={{ color: OG_COLORS.accent }}>HUB</span>
  </div>
);

// The mono kicker above titles and stats: "DRIVER · 2026"
export const OgLabel = ({
  children,
  size = 22,
  color = OG_COLORS.muted,
}: {
  children: ReactNode;
  size?: number;
  color?: string;
}) => (
  <div
    style={{
      ...mono,
      display: "flex",
      fontSize: size,
      letterSpacing: 2,
      color,
    }}
  >
    {children}
  </div>
);

// The page title in the slanted black weight. Long names step down a size
// so they stay on one or two lines.
export const OgTitle = ({
  children,
  size = 84,
}: {
  children: string;
  size?: number;
}) => {
  const fontSize =
    children.length > 26
      ? size * 0.7
      : children.length > 16
        ? size * 0.85
        : size;
  return (
    <div
      style={{
        display: "flex",
        flexShrink: 0,
        fontSize,
        lineHeight: 1.05,
        fontWeight: 900,
        textTransform: "uppercase",
        transform: "skewX(-6deg)",
        marginLeft: 6,
      }}
    >
      {children}
    </div>
  );
};

export const OgTeamBar = ({
  color,
  height,
  width = 10,
}: {
  color: string;
  height: number;
  width?: number;
}) => (
  <div
    style={{
      width,
      height,
      borderRadius: width / 2,
      background: color,
      flexShrink: 0,
    }}
  />
);

export type OgStat = { label: string; value: string | number };

// A row of stat tiles, like the app's StatGrid
export const OgStats = ({
  label,
  stats,
}: {
  label?: string;
  stats: OgStat[];
}) => (
  <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 12 }}>
    {label && <OgLabel size={18}>{label}</OgLabel>}
    <div style={{ display: "flex", width: "100%", gap: 12 }}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            flexBasis: 0,
            gap: 2,
            padding: "14px 16px",
            borderRadius: 12,
            border: `1px solid ${OG_COLORS.line}`,
            background: OG_COLORS.surface,
          }}
        >
          <div
            style={{
              ...mono,
              display: "flex",
              fontSize: 38,
              textTransform: "none",
            }}
          >
            {stat.value}
          </div>
          <OgLabel size={14}>{stat.label}</OgLabel>
        </div>
      ))}
    </div>
  </div>
);

// One line of a standings table or podium: position, team bar, the name
// beside a detail, and a value on the right. Compact rows fit five.
export const OgRow = ({
  position,
  color,
  name,
  detail,
  value,
  highlight,
  compact,
}: {
  position: string;
  color: string;
  name: string;
  detail?: string;
  value?: string;
  highlight?: boolean;
  compact?: boolean;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 20,
      height: compact ? 58 : 72,
      padding: "0 24px",
      borderRadius: 12,
      background: highlight ? OG_COLORS.raised : OG_COLORS.surface,
      border: `1px solid ${OG_COLORS.line}`,
    }}
  >
    <div
      style={{
        ...mono,
        display: "flex",
        width: 52,
        fontSize: 26,
        color: highlight ? OG_COLORS.accent : OG_COLORS.text,
      }}
    >
      {position}
    </div>
    <OgTeamBar color={color} height={compact ? 32 : 40} width={7} />
    <div style={{ display: "flex", flex: 1, alignItems: "baseline", gap: 14 }}>
      <div
        style={{
          display: "flex",
          fontSize: compact ? 28 : 32,
          fontWeight: 700,
        }}
      >
        {name}
      </div>
      {detail && (
        <div style={{ display: "flex", fontSize: 24, color: OG_COLORS.muted }}>
          {detail}
        </div>
      )}
    </div>
    {value && (
      <div style={{ ...mono, display: "flex", fontSize: 26 }}>{value}</div>
    )}
  </div>
);

// The card: an accent strip along the top, the wordmark beside the kicker,
// then the content
export const OgFrame = ({
  kicker,
  accent = OG_COLORS.accent,
  children,
}: {
  kicker?: string;
  // The strip's colour: the team's on driver and team cards
  accent?: string;
  children: ReactNode;
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      width: "100%",
      height: "100%",
      background: OG_COLORS.background,
      color: OG_COLORS.text,
      fontFamily: "Titillium",
    }}
  >
    <div style={{ display: "flex", height: 10, background: accent }} />
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        padding: "40px 64px 52px",
        gap: 28,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <OgWordmark />
        {kicker && <OgLabel>{kicker}</OgLabel>}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          gap: 28,
        }}
      >
        {children}
      </div>
    </div>
  </div>
);

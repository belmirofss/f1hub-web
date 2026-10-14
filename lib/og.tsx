import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { ImageResponse } from "next/og";
import { CACHE_LIFE, type CacheTier } from "@/lib/api/cacheTiers";
import type { TeamHero } from "@/lib/domain/teams";

// Social cards (opengraph-image / twitter-image) in the Programme style:
// paper, ink, Big Shoulders headlines, mono labels and hairline rules. Each
// route renders at request time from the cached API data and sends the PNG
// with the same cache tier as its page, so the CDN keeps it as long as the
// data behind it stays fresh.

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// Satori reads static TTF, not the variable woff2 that next/font serves, so
// the fonts ship in assets/fonts. They don't depend on the request, so they
// load once.
const font = (file: string) =>
  readFile(join(process.cwd(), "assets/fonts", file));

const [shoulders, regular, semiBold, bold, monoMedium, monoBold] =
  await Promise.all([
    font("BigShoulders-Black.ttf"),
    font("InstrumentSans-Regular.ttf"),
    font("InstrumentSans-SemiBold.ttf"),
    font("InstrumentSans-Bold.ttf"),
    font("JetBrainsMono-Medium.ttf"),
    font("JetBrainsMono-Bold.ttf"),
  ]);

const FONTS = [
  { name: "Display", data: shoulders, weight: 900, style: "normal" },
  { name: "Sans", data: regular, weight: 400, style: "normal" },
  { name: "Sans", data: semiBold, weight: 600, style: "normal" },
  { name: "Sans", data: bold, weight: 700, style: "normal" },
  { name: "Mono", data: monoMedium, weight: 500, style: "normal" },
  { name: "Mono", data: monoBold, weight: 700, style: "normal" },
] as const;

// The design tokens from globals.css
export const OG_COLORS = {
  background: "#F1ECE2",
  surface: "#FAF7F1",
  raised: "#E6DFD0",
  line: "#D3C9B5",
  text: "#1A1814",
  soft: "#3B372F",
  muted: "#655E51",
  accent: "#D83A1E",
  onAccent: "#FFFFFF",
  accentInk: "#B32E17",
  second: "#1F4FD1",
  sprintInk: "#7A5900",
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

export const ogMono: CSSProperties = {
  fontFamily: "Mono",
  fontWeight: 700,
};

const display: CSSProperties = {
  fontFamily: "Display",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.005em",
};

// "F1HUB" in the slanted display face, HUB in vermilion. On a team colour
// the whole mark takes the block's text colour, since vermilion could vanish
// into a red livery.
export const OgWordmark = ({
  size = 44,
  color,
}: {
  size?: number;
  color?: string;
}) => (
  <div
    style={{
      ...display,
      display: "flex",
      fontSize: size,
      lineHeight: 1,
      transform: "skewX(-10deg)",
    }}
  >
    F1<span style={{ color: color ?? OG_COLORS.accentInk }}>HUB</span>
  </div>
);

// The mono caps label above titles and stats: "DRIVER · 2026"
export const OgLabel = ({
  children,
  size = 20,
  color = OG_COLORS.muted,
}: {
  children: ReactNode;
  size?: number;
  color?: string;
}) => (
  <div
    style={{
      fontFamily: "Mono",
      fontWeight: 500,
      display: "flex",
      fontSize: size,
      letterSpacing: size * 0.14,
      textTransform: "uppercase",
      color,
    }}
  >
    {children}
  </div>
);

// The page title: tall condensed caps. Long names step down a size so they
// stay on one or two lines.
export const OgTitle = ({
  children,
  size = 110,
  color,
}: {
  children: string;
  size?: number;
  color?: string;
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
        ...display,
        display: "flex",
        flexShrink: 0,
        fontSize,
        lineHeight: 0.9,
        color,
      }}
    >
      {children}
    </div>
  );
};

export const OgTeamBar = ({
  color,
  height,
  width = 6,
}: {
  color: string;
  height: number;
  width?: number;
}) => <div style={{ width, height, background: color, flexShrink: 0 }} />;

export type OgStat = { label: string; value: string | number };

// A row of numbers like the app's StatRail: a heavy ink rule over each
// group, the label and then the value in the display face. A label may wrap;
// the values stay level at the bottom.
export const OgStats = ({
  label,
  stats,
  size = 60,
}: {
  label?: string;
  stats: OgStat[];
  // The values' size; smaller where four share a narrow column
  size?: number;
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      flex: 1,
      gap: 12,
      paddingTop: 14,
      borderTop: `3px solid ${OG_COLORS.text}`,
    }}
  >
    {label && <OgLabel size={16}>{label}</OgLabel>}
    <div style={{ display: "flex", width: "100%" }}>
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flexGrow: 1,
            flexBasis: 0,
            minWidth: 0,
            gap: 6,
            paddingLeft: index ? 18 : 0,
            borderLeft: index ? `1px solid ${OG_COLORS.line}` : "none",
          }}
        >
          <OgLabel size={14}>{stat.label}</OgLabel>
          <div
            style={{
              ...display,
              display: "flex",
              fontSize: size,
              lineHeight: 1,
            }}
          >
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// One line of a standings table or podium: position, team bar, the name
// beside a detail, and a value on the right, over a hairline. The winner's
// position is a vermilion square, like a win in the form chips. Compact
// rows fit five.
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
      height: compact ? 66 : 76,
      borderBottom: `1px solid ${OG_COLORS.line}`,
    }}
  >
    <div
      style={{
        ...ogMono,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 64,
        height: 44,
        fontSize: 24,
        background: highlight ? OG_COLORS.accent : "transparent",
        color: highlight ? OG_COLORS.onAccent : OG_COLORS.text,
      }}
    >
      {position}
    </div>
    <OgTeamBar color={color} height={compact ? 34 : 42} />
    <div style={{ display: "flex", flex: 1, alignItems: "baseline", gap: 16 }}>
      <div
        style={{
          display: "flex",
          fontSize: compact ? 30 : 34,
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
      <div style={{ ...ogMono, display: "flex", fontSize: 26 }}>{value}</div>
    )}
  </div>
);

// The rows of a list under a heavy ink rule
export const OgRows = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      borderTop: `3px solid ${OG_COLORS.text}`,
    }}
  >
    {children}
  </div>
);

// The wordmark beside the kicker. In a poster block both take the block's
// text colour, apart from HUB on the ink block.
const header = (kicker?: string, hero?: TeamHero) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <OgWordmark color={hero && (hero.team ? hero.text : OG_COLORS.accent)} />
    {kicker && (
      <OgLabel color={hero?.text ?? OG_COLORS.muted}>{kicker}</OgLabel>
    )}
  </div>
);

// The card: a vermilion strip along the top, the wordmark beside the
// kicker, then the content on paper
export const OgFrame = ({
  kicker,
  children,
}: {
  kicker?: string;
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
      fontFamily: "Sans",
    }}
  >
    <div
      style={{ display: "flex", height: 12, background: OG_COLORS.accent }}
    />
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        padding: "36px 64px 52px",
        gap: 28,
      }}
    >
      {header(kicker)}
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

// Headline sizes by length, like the page's PosterHero: "Verstappen" fills
// the block, "Brabham-Alfa Romeo" comes down to stay on one line
const posterSize = (text: string) =>
  text.length > 14 ? 100 : text.length > 10 ? 124 : 150;

// The driver and team cards, like the Livery Poster header of their pages:
// a block in the team colour with the wordmark, the kicker and a huge name,
// a faint number behind it, then the content on paper underneath
export const OgPosterFrame = ({
  hero,
  kicker,
  overline,
  headline,
  meta,
  number,
  children,
}: {
  hero: TeamHero;
  kicker: string;
  // Above the headline: the driver's given name
  overline?: string;
  headline: string;
  // Under the headline: "NLD · RED BULL · 4× WORLD CHAMPION"
  meta: string;
  // The car number, drawn faintly behind the name
  number?: string;
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
      fontFamily: "Sans",
    }}
  >
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: 380,
        padding: "36px 64px 32px",
        overflow: "hidden",
        background: hero.background,
        color: hero.text,
      }}
    >
      {number && (
        <div
          style={{
            ...display,
            position: "absolute",
            top: -110,
            right: 40,
            fontSize: 560,
            lineHeight: 1,
            opacity: 0.2,
          }}
        >
          {number}
        </div>
      )}
      {header(kicker, hero)}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {overline && (
          <div style={{ display: "flex", fontSize: 34, fontWeight: 600 }}>
            {overline}
          </div>
        )}
        <div
          style={{
            ...display,
            display: "flex",
            fontSize: posterSize(headline),
            lineHeight: 0.85,
          }}
        >
          {headline}
        </div>
        <OgLabel size={20} color={hero.text}>
          {meta}
        </OgLabel>
      </div>
    </div>
    <div
      style={{
        display: "flex",
        flex: 1,
        alignItems: "flex-end",
        gap: 40,
        padding: "0 64px 44px",
      }}
    >
      {children}
    </div>
  </div>
);

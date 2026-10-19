// Ported from the app's src/helpers/teams.ts. The driver arguments are
// structural so this doesn't depend on the API types (#5).

import { contrastRatio, readableOn, textOn } from "@/lib/color";

// Approximate team colours keyed by the API's constructorId.
const TEAM_COLORS: Record<string, string> = {
  mclaren: "#FF8000",
  red_bull: "#3671C6",
  mercedes: "#27F4D2",
  ferrari: "#E8002D",
  williams: "#1868DB",
  aston_martin: "#229971",
  alpine: "#0093CC",
  rb: "#6692FF",
  racing_bulls: "#6692FF",
  alphatauri: "#5E8FAA",
  toro_rosso: "#3355CC",
  haas: "#B6BABD",
  sauber: "#52E252",
  audi: "#A0A3A8",
  cadillac: "#C9A64B",
  alfa: "#B12039",
  racing_point: "#F596C8",
  force_india: "#F596C8",
  renault: "#F6B800",
  lotus_f1: "#B8A04A",
  brawn: "#D4F000",
  bmw_sauber: "#2B5BA8",
  toyota: "#C4161C",
  honda: "#E8E8E8",
  benetton: "#2BB673",
  jordan: "#F2D21B",
  ligier: "#3A7BD5",
  // Historical champions. Several raced in British green, so each gets its
  // own shade or a colour from its livery that sets it apart in the
  // archive's grid: Lotus yellow, BRM olive, Vanwall's darker green.
  maserati: "#2D5DA8",
  vanwall: "#0E3B2E",
  cooper: "#1F6E43",
  brm: "#4A5A3A",
  lotus: "#D9B300",
  team_lotus: "#D9B300",
  brabham: "#2F6F9F",
  matra: "#5B7FD6",
  tyrrell: "#1C2F6B",
};

// "lotus-climax", "cooper-climax" and "brabham-repco" are the chassis and
// engine of one team, so they take the chassis's colour
const knownColor = (constructorId: string): string | undefined =>
  TEAM_COLORS[constructorId] ?? TEAM_COLORS[constructorId.split("-")[0]];

const FALLBACK_COLORS = ["#8E8E96", "#A6A6AE", "#7A7A84", "#B4B4BC"];

export const getTeamColor = (constructorId?: string) => {
  if (!constructorId) return FALLBACK_COLORS[0];
  const known = knownColor(constructorId);
  if (known) return known;
  const hash = [...constructorId].reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
};

// The team colour as text on a chip (surface-raised): light ones like
// Mercedes teal, Haas grey and McLaren orange get darkened until they pass AA
// contrast. Only for short codes: names are never set in team colour.
export const getTeamTextColor = (constructorId?: string) =>
  readableOn(getTeamColor(constructorId), "#E6DFD0");

// Darker shades for the hero block, where the team colour is a mid tone that
// neither ink nor white text reaches 4.5:1 on. Red Bull's #3671C6 just
// passes with white, but the car's navy reads better as a whole block.
const HERO_COLORS: Record<string, string> = {
  red_bull: "#1E41A0",
  ligier: "#2C64B8",
};

export type TeamHero = {
  background: string;
  // Ink or white, whichever reads on the background
  text: string;
  // False for the neutral ink block of teams without a colour of their own
  team: boolean;
};

const INK_HERO: TeamHero = {
  background: "#1a1814",
  text: "#f1ece2",
  team: false,
};

// The colour block a driver or team page, a champion card or an archive
// cell takes: the team colour (or its darker shade above) with ink or white
// text. Teams without a known colour, like most privateers of the 1950s, get
// a neutral ink block.
export const getTeamHero = (constructorId?: string): TeamHero => {
  const color = constructorId && knownColor(constructorId);
  if (!color) return INK_HERO;
  let background = HERO_COLORS[constructorId] ?? color;
  // A colour added later without a shade still gets readable text
  if (contrastRatio(background, textOn(background)) < 4.5)
    background = readableOn(background, "#ffffff");
  return { background, text: textOn(background), team: true };
};

export const getDriverCode = (driver: { code?: string; familyName: string }) =>
  driver.code ?? driver.familyName.replace(/\s/g, "").slice(0, 3).toUpperCase();

export const getDriverName = (driver: {
  givenName: string;
  familyName: string;
}) => `${driver.givenName} ${driver.familyName}`;

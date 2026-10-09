// Ported from the app's src/helpers/teams.ts. The driver arguments are
// structural so this doesn't depend on the API types (#5).

import { readableOn } from "@/lib/color";

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
  tyrrell: "#1F4E9C",
  lotus: "#2E6B3A",
  brabham: "#2B5BA8",
  ligier: "#3A7BD5",
};

const FALLBACK_COLORS = ["#8E8E96", "#A6A6AE", "#7A7A84", "#B4B4BC"];

export const getTeamColor = (constructorId?: string) => {
  if (!constructorId) return FALLBACK_COLORS[0];
  const known = TEAM_COLORS[constructorId];
  if (known) return known;
  const hash = [...constructorId].reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
};

// The team colour as text on a chip (surface-raised): light ones like
// Mercedes teal, Haas grey and McLaren orange get darkened until they pass AA
// contrast. Only for short codes: names are never set in team colour.
export const getTeamTextColor = (constructorId?: string) =>
  readableOn(getTeamColor(constructorId), "#E6DFD0");

export const getDriverCode = (driver: { code?: string; familyName: string }) =>
  driver.code ?? driver.familyName.replace(/\s/g, "").slice(0, 3).toUpperCase();

export const getDriverName = (driver: {
  givenName: string;
  familyName: string;
}) => `${driver.givenName} ${driver.familyName}`;

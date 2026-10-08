// Ported from the app's src/helpers/circuits.ts.

// The API has no time zone for circuits, so map the ones on recent calendars.
const CIRCUIT_TIMEZONES: Record<string, string> = {
  albert_park: "Australia/Melbourne",
  shanghai: "Asia/Shanghai",
  suzuka: "Asia/Tokyo",
  bahrain: "Asia/Bahrain",
  jeddah: "Asia/Riyadh",
  miami: "America/New_York",
  imola: "Europe/Rome",
  monaco: "Europe/Monaco",
  villeneuve: "America/Toronto",
  catalunya: "Europe/Madrid",
  madring: "Europe/Madrid",
  red_bull_ring: "Europe/Vienna",
  silverstone: "Europe/London",
  spa: "Europe/Brussels",
  hungaroring: "Europe/Budapest",
  zandvoort: "Europe/Amsterdam",
  monza: "Europe/Rome",
  baku: "Asia/Baku",
  marina_bay: "Asia/Singapore",
  americas: "America/Chicago",
  rodriguez: "America/Mexico_City",
  interlagos: "America/Sao_Paulo",
  vegas: "America/Los_Angeles",
  losail: "Asia/Qatar",
  yas_marina: "Asia/Dubai",
  portimao: "Europe/Lisbon",
  istanbul: "Europe/Istanbul",
  sochi: "Europe/Moscow",
  ricard: "Europe/Paris",
  nurburgring: "Europe/Berlin",
  hockenheimring: "Europe/Berlin",
  mugello: "Europe/Rome",
  sepang: "Asia/Kuala_Lumpur",
  yeongam: "Asia/Seoul",
  buddh: "Asia/Kolkata",
};

export const getCircuitTimezone = (circuitId: string) =>
  CIRCUIT_TIMEZONES[circuitId];

// Current layouts of circuits on recent calendars: lap length (km) and corners
const CIRCUIT_LAYOUTS: Record<string, { length: number; corners: number }> = {
  albert_park: { length: 5.278, corners: 14 },
  americas: { length: 5.513, corners: 20 },
  bahrain: { length: 5.412, corners: 15 },
  baku: { length: 6.003, corners: 20 },
  catalunya: { length: 4.657, corners: 14 },
  hungaroring: { length: 4.381, corners: 14 },
  imola: { length: 4.909, corners: 19 },
  interlagos: { length: 4.309, corners: 15 },
  jeddah: { length: 6.174, corners: 27 },
  losail: { length: 5.419, corners: 16 },
  madring: { length: 5.474, corners: 22 },
  marina_bay: { length: 4.94, corners: 19 },
  miami: { length: 5.412, corners: 19 },
  monaco: { length: 3.337, corners: 19 },
  monza: { length: 5.793, corners: 11 },
  red_bull_ring: { length: 4.318, corners: 10 },
  rodriguez: { length: 4.304, corners: 17 },
  sepang: { length: 5.543, corners: 15 },
  shanghai: { length: 5.451, corners: 16 },
  silverstone: { length: 5.891, corners: 18 },
  spa: { length: 7.004, corners: 19 },
  suzuka: { length: 5.807, corners: 18 },
  vegas: { length: 6.201, corners: 17 },
  villeneuve: { length: 4.361, corners: 14 },
  yas_marina: { length: 5.281, corners: 16 },
  zandvoort: { length: 4.259, corners: 14 },
};

export const getCircuitLayout = (circuitId: string) =>
  CIRCUIT_LAYOUTS[circuitId];

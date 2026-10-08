// Ported from the app's src/types.ts. Jolpica (Ergast-compatible) returns
// every number as a string, so these mirror the API as it is.

export type Location = {
  lat: string;
  long: string;
  locality: string;
  country: string;
};

export type Circuit = {
  circuitId: string;
  url: string;
  circuitName: string;
  Location: Location;
};

export type FastestLap = {
  rank: string;
  lap: string;
  Time: {
    time: string;
  };
  AverageSpeed: {
    units: string;
    speed: string;
  };
};

export type Result = {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: Driver;
  Constructor: Constructor;
  grid: string;
  laps: string;
  status: string;
  Time?: {
    millis: string;
    time: string;
  };
  FastestLap?: FastestLap;
};

export type QualifyingResult = {
  number: string;
  position: string;
  points: string;
  Driver: Driver;
  Constructor: Constructor;
  grid: string;
  Q1?: string;
  Q2?: string;
  Q3?: string;
};

export type RaceBase = {
  season: string;
  round: string;
  url: string;
  raceName: string;
  Circuit: Circuit;
  date: string;
  time?: string;
};

export type SessionTime = {
  date: string;
  time?: string;
};

export type Race = RaceBase & {
  FirstPractice?: SessionTime;
  SecondPractice?: SessionTime;
  ThirdPractice?: SessionTime;
  SprintQualifying?: SessionTime;
  SprintShootout?: SessionTime;
  Sprint?: SessionTime;
  Qualifying?: SessionTime;
};

export type RaceResults = RaceBase & {
  Results?: Result[];
};

export type RaceSprintResults = RaceBase & { SprintResults?: Result[] };

export type QualifyingResults = RaceBase & {
  QualifyingResults?: QualifyingResult[];
};

export type Driver = {
  driverId: string;
  permanentNumber?: string;
  code?: string;
  url: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
};

export type Constructor = {
  constructorId: string;
  url: string;
  name: string;
  nationality: string;
};

export type DriverStanding = {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Driver: Driver;
  Constructors: Constructor[];
};

export type ConstructorStanding = {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Constructor: Constructor;
};

export type Season = {
  season: string;
  url: string;
};

export type StandingType = "drivers" | "constructors";

export type LapTiming = {
  driverId: string;
  position: string;
  time: string;
};

export type Lap = {
  number: string;
  Timings: LapTiming[];
};

export type RaceLaps = RaceBase & { Laps?: Lap[] };

export type PitStop = {
  driverId: string;
  lap: string;
  stop: string;
  time: string;
  duration: string;
};

export type RacePitStops = RaceBase & { PitStops?: PitStop[] };

// Standings lists carry the round they were computed after
export type Standings<T> = {
  season: string;
  round: string;
  standings: T[];
};

// OpenF1 (https://openf1.org), available from 2023

export type OpenF1Session = {
  session_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string;
  year: number;
};

export type OpenF1Driver = {
  driver_number: number;
  name_acronym: string;
  full_name: string;
  first_name: string;
  last_name: string;
  team_name: string;
  team_colour?: string;
};

export type Stint = {
  driver_number: number;
  stint_number: number;
  lap_start: number;
  lap_end: number;
  compound: string;
  tyre_age_at_start: number;
};

export type TeamRadio = {
  driver_number: number;
  date: string;
  recording_url: string;
};

export type RaceControlMessage = {
  date: string;
  lap_number: number | null;
  category: string;
  flag: string | null;
  scope: string | null;
  sector: number | null;
  driver_number: number | null;
  message: string;
};

export type OpenF1Lap = {
  driver_number: number;
  lap_number: number;
  date_start: string | null;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  is_pit_out_lap: boolean;
};

export type CarLocation = {
  date: string;
  x: number;
  y: number;
};

export type TrackPoint = { x: number; y: number; sector: 0 | 1 | 2 };

// Open-Meteo hourly forecast, one array entry per hour
export type Forecast = {
  time: number[]; // hour starts, ms since epoch (UTC)
  temperature: number[];
  rainChance: number[];
  rain: number[]; // mm
  code: number[]; // WMO weather code
  wind: number[]; // km/h
  humidity: number[];
};

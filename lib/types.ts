export type Intensity = "easy" | "moderate" | "hard";
export type WorkoutKind =
  | "recovery"
  | "endurance"
  | "progressive"
  | "hiit"
  | "threshold"
  | "hills"
  | "ladder"
  | "bonus";

export type Segment = {
  label: string;
  minutes: number;
  resistance: string;
  rpe: string;
  cadence?: string;
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  tagline: string;
  kind: WorkoutKind;
  duration: number;
  points: number;
  xp: number;
  intensity: Intensity;
  bonus?: boolean;
  description: string;
  segments: Segment[];
};

export type WeekTarget = {
  week: number;
  points: number;
  minutes: number;
  sessions: number;
  variety: number;
  maxHard: number;
};

export type TelemetrySample = {
  t: number;
  speedKmh?: number;
  cadenceRpm?: number;
  resistance?: number;
  powerW?: number;
  heartRate?: number;
  calories?: number;
  distanceKm?: number;
};

export type TimeAttackSplit = {
  km: number;
  elapsedSeconds: number;
};

export type ChallengeResult = {
  id: string;
  success: boolean;
  summary: string;
  xpBonus: number;
};

export type SessionMetrics = {
  source: "manual" | "ftms" | "mixed";
  voyage?: VoyagePortion;
  completedWorkout?: boolean;
  challenge?: ChallengeResult;
  completedRoute?: boolean;
  completedSegment?: boolean;
  elapsedSeconds?: number;
  timeAttack?: boolean;
  checkpointSplits?: TimeAttackSplit[];
  segmentAttackIndex?: number;
  distanceKm?: number;
  calories?: number;
  avgSpeedKmh?: number;
  avgCadenceRpm?: number;
  maxCadenceRpm?: number;
  avgPowerW?: number;
  maxPowerW?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  avgResistance?: number;
  samples?: TelemetrySample[];
};

export type CompletedSession = {
  id: string;
  templateId: string;
  routeId?: string;
  date: string;
  duration: number;
  points: number;
  xp: number;
  intensity: Intensity;
  kind: WorkoutKind;
  bonus: boolean;
  rpe?: number;
  note?: string;
  metrics?: SessionMetrics;
};

export type Measurement = {
  id: string;
  date: string;
  weight?: number;
  waist?: number;
  abdomen?: number;
};

export type Profile = {
  name: string;
  startDate: string;
  startWeight?: number;
  targetWeight?: number;
  startWaist?: number;
  targetWaist?: number;
};

export type Preferences = {
  soundCues: boolean;
  voiceCues: boolean;
  haptics: boolean;
  keepScreenAwake: boolean;
  keepTelemetryTrace: boolean;
  resistanceOffset: number;
  cueVolume?: number;
  cueFrequency?: "all" | "changes";
  announceUpcoming?: boolean;
  readerView?: "full" | "essential";
};

export type AppState = {
  profile: Profile;
  sessions: CompletedSession[];
  measurements: Measurement[];
  preferences?: Preferences;
  favoriteRouteIds?: string[];
  guidance?: Guidance;
  voyage?: { routeId: string; minutes: 15 | 30 | 45 | 60 };
};

export type VoyagePortion = {
  version: 1;
  startKm: number;
  endKm: number;
  routeDistanceKm: number;
  routeXp: number;
  completedPortion: boolean;
  positionSource: "simulation";
};

export type Guidance = {
  version: 1;
  status: "setup" | "active" | "dismissed";
  step: 0 | 1 | 2 | 3;
  experience: "beginner" | "regular";
  goal: "habit" | "endurance" | "explore";
  sessionMinutes: 15 | 25 | 30;
  weeklySessions: 2 | 3 | 4;
};

export type Badge = {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
  progress?: string;
};

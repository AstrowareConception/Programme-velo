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

export type CompletedSession = {
  id: string;
  templateId: string;
  date: string;
  duration: number;
  points: number;
  xp: number;
  intensity: Intensity;
  kind: WorkoutKind;
  bonus: boolean;
  rpe?: number;
  note?: string;
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

export type AppState = {
  profile: Profile;
  sessions: CompletedSession[];
  measurements: Measurement[];
};

export type Badge = {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
  progress?: string;
};

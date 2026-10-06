import type { TelemetrySample, TimeAttackSplit, VoyagePortion, WorkoutTemplate } from "./types";

export const ACTIVE_SESSION_KEY = "veloquest:active-session:v1";

export type ActiveSessionSnapshot = {
  version: 1;
  cadenceOffset?: number;
  savedAt: number;
  workoutId: string;
  routeId?: string;
  routeMode: "training" | "timeAttack" | "segmentAttack" | "voyage";
  voyage?: VoyagePortion;
  challengeId?: string;
  segmentAttackIndex?: number;
  segmentIndex: number;
  secondsLeft: number;
  running: boolean;
  sessionStarted: boolean;
  showFinish: boolean;
  timeAttackElapsedSeconds: number;
  timeAttackSplits: TimeAttackSplit[];
  pauseCount: number;
  sessionResistanceDelta: number;
  climbStartDistanceM?: number | null;
  telemetrySamples: TelemetrySample[];
  hadBikeConnection: boolean;
  cadenceSettingsKey?: string;
  cadenceSettingsChanged?: boolean;
  cadenceScore?: import("./effort").CadenceScore;
};

export function advanceWorkoutPosition(
  workout: WorkoutTemplate,
  segmentIndex: number,
  secondsLeft: number,
  elapsedSeconds: number
) {
  let index = Math.max(0, Math.min(workout.segments.length - 1, segmentIndex));
  let remaining = Math.max(0, secondsLeft);
  let elapsed = Math.max(0, elapsedSeconds);

  while (elapsed > 0 && index < workout.segments.length) {
    if (elapsed < remaining) {
      remaining -= elapsed;
      elapsed = 0;
      break;
    }

    elapsed -= remaining;
    index += 1;
    if (index >= workout.segments.length) {
      return { segmentIndex: workout.segments.length - 1, secondsLeft: 0, completed: true };
    }
    remaining = Math.round(workout.segments[index].minutes * 60);
  }

  return { segmentIndex: index, secondsLeft: Math.max(0, Math.ceil(remaining)), completed: false };
}

export function restoreSessionSnapshot(
  snapshot: ActiveSessionSnapshot,
  workout: WorkoutTemplate,
  now = Date.now()
): ActiveSessionSnapshot {
  const elapsedSinceSave = snapshot.running && snapshot.sessionStarted && !snapshot.showFinish
    ? Math.max(0, (now - snapshot.savedAt) / 1000)
    : 0;

  const advanced = elapsedSinceSave > 0
    ? advanceWorkoutPosition(workout, snapshot.segmentIndex, snapshot.secondsLeft, elapsedSinceSave)
    : { segmentIndex: snapshot.segmentIndex, secondsLeft: snapshot.secondsLeft, completed: false };

  return {
    ...snapshot,
    savedAt: now,
    segmentIndex: advanced.segmentIndex,
    secondsLeft: advanced.secondsLeft,
    running: advanced.completed ? false : snapshot.running,
    showFinish: snapshot.showFinish || advanced.completed,
    timeAttackElapsedSeconds: (snapshot.routeMode === "timeAttack" || snapshot.routeMode === "segmentAttack") && snapshot.running
      ? snapshot.timeAttackElapsedSeconds + Math.floor(elapsedSinceSave)
      : snapshot.timeAttackElapsedSeconds
  };
}

export function readActiveSessionSnapshot(): ActiveSessionSnapshot | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ActiveSessionSnapshot>;
    if (
      parsed.version !== 1 ||
      typeof parsed.workoutId !== "string" ||
      typeof parsed.segmentIndex !== "number" ||
      typeof parsed.secondsLeft !== "number" ||
      typeof parsed.savedAt !== "number"
    ) return null;
    return parsed as ActiveSessionSnapshot;
  } catch {
    return null;
  }
}

export function writeActiveSessionSnapshot(snapshot: ActiveSessionSnapshot) {
  if (typeof localStorage === "undefined") return false;
  try {
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}

export function clearActiveSessionSnapshot() {
  if (typeof localStorage === "undefined") return;
  try { localStorage.removeItem(ACTIVE_SESSION_KEY); } catch {}
}

import { defaultPreferences, emptyState, currentProgramWeek, normalizeWeeklyGoals } from "./data";
import type { AppState, Preferences } from "./types";
import type { ClimbChallenge } from "./routes";
import { normalizeGuidance } from "./onboarding";
import { validVoyagePortion } from "./voyage-progress";

type Backup = {
  format: "veloquest-backup-v3";
  exportedAt: string;
  state: AppState;
  customClimbs: ClimbChallenge[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function numberOrUndefined(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringOr(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function normalizePreferences(value: unknown): Preferences {
  const raw = isObject(value) ? value : {};
  const bool = (key: "soundCues" | "voiceCues" | "haptics" | "keepScreenAwake" | "keepTelemetryTrace" | "announceUpcoming" | "showRoutePhotos") =>
    typeof raw[key] === "boolean" ? raw[key] as boolean : (defaultPreferences[key] ?? false);
  return {
    soundCues: bool("soundCues"),
    voiceCues: bool("voiceCues"),
    haptics: bool("haptics"),
    keepScreenAwake: bool("keepScreenAwake"),
    keepTelemetryTrace: bool("keepTelemetryTrace"),
    resistanceOffset: Math.max(-4, Math.min(4, numberOrUndefined(raw.resistanceOffset) ?? defaultPreferences.resistanceOffset)),
    cadenceOffset: [-15, 0, 10].includes(Number(raw.cadenceOffset)) ? Number(raw.cadenceOffset) : -15,
    cueVolume: Math.max(0, Math.min(100, numberOrUndefined(raw.cueVolume) ?? 65)),
    cueFrequency: raw.cueFrequency === "changes" ? "changes" : "all",
    announceUpcoming: bool("announceUpcoming"),
    readerView: raw.readerView === "essential" ? "essential" : "full",
    showRoutePhotos: bool("showRoutePhotos")
  };
}

export function normalizeState(value: unknown): AppState {
  const base = emptyState();
  if (!isObject(value)) return base;

  const rawProfile = isObject(value.profile) ? value.profile : {};
  const profile = {
    name: stringOr(rawProfile.name, base.profile.name),
    startDate: stringOr(rawProfile.startDate, base.profile.startDate),
    startWeight: numberOrUndefined(rawProfile.startWeight),
    targetWeight: numberOrUndefined(rawProfile.targetWeight),
    startWaist: numberOrUndefined(rawProfile.startWaist),
    targetWaist: numberOrUndefined(rawProfile.targetWaist)
  };

  return {
    weeklyGoals: normalizeWeeklyGoals(value.weeklyGoals, currentProgramWeek(profile.startDate)),
    profile,
    guidance: normalizeGuidance(value.guidance),
    voyage: isObject(value.voyage) && typeof value.voyage.routeId === "string" && value.voyage.routeId.length > 0
      ? { routeId: value.voyage.routeId, minutes: [15, 30, 45, 60].includes(Number(value.voyage.minutes)) ? Number(value.voyage.minutes) as 15 | 30 | 45 | 60 : 30 }
      : undefined,
    sessions: Array.isArray(value.sessions) ? value.sessions.filter(isObject).map(session => {
      const metrics = isObject(session.metrics) ? session.metrics : undefined;
      if (!metrics || metrics.voyage === undefined || validVoyagePortion(metrics.voyage)) return session;
      // Do not turn corrupt Voyage data into a legacy whole-route completion.
      return { ...session, xp: 0, points: 0, metrics: { ...metrics, voyage: undefined,
        completedRoute: false, completedWorkout: false, completedSegment: false,
        timeAttack: undefined, segmentAttackIndex: undefined, challenge: undefined } };
    }) as AppState["sessions"] : [],
    measurements: Array.isArray(value.measurements) ? value.measurements.filter(isObject) as AppState["measurements"] : [],
    preferences: normalizePreferences(value.preferences),
    favoriteRouteIds: Array.isArray(value.favoriteRouteIds)
      ? value.favoriteRouteIds.filter((item): item is string => typeof item === "string")
      : []
  };
}

export function createBackup(state: AppState, customClimbs: ClimbChallenge[]): Backup {
  return {
    format: "veloquest-backup-v3",
    exportedAt: new Date().toISOString(),
    state: normalizeState(state),
    customClimbs
  };
}

export function parseBackup(text: string): { state: AppState; customClimbs: ClimbChallenge[] } {
  const parsed: unknown = JSON.parse(text);
  if (isObject(parsed) && (parsed.format === "veloquest-backup-v2" || parsed.format === "veloquest-backup-v3") && "state" in parsed) {
    return {
      state: normalizeState(parsed.state),
      customClimbs: Array.isArray(parsed.customClimbs) ? parsed.customClimbs.filter(isObject) as unknown as ClimbChallenge[] : []
    };
  }
  return { state: normalizeState(parsed), customClimbs: [] };
}

export function safeLocalStorageWrite(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function estimateLocalBytes(state: AppState, customClimbs: ClimbChallenge[]) {
  return new Blob([JSON.stringify(state), JSON.stringify(customClimbs)]).size;
}

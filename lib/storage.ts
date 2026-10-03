import { defaultPreferences, emptyState } from "./data";
import type { AppState, Preferences } from "./types";
import type { ClimbChallenge } from "./routes";

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
  const bool = (key: keyof Omit<Preferences, "resistanceOffset">) =>
    typeof raw[key] === "boolean" ? raw[key] as boolean : defaultPreferences[key];
  return {
    soundCues: bool("soundCues"),
    voiceCues: bool("voiceCues"),
    haptics: bool("haptics"),
    keepScreenAwake: bool("keepScreenAwake"),
    keepTelemetryTrace: bool("keepTelemetryTrace"),
    resistanceOffset: Math.max(-4, Math.min(4, numberOrUndefined(raw.resistanceOffset) ?? defaultPreferences.resistanceOffset))
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
    profile,
    sessions: Array.isArray(value.sessions) ? value.sessions.filter(isObject) as AppState["sessions"] : [],
    measurements: Array.isArray(value.measurements) ? value.measurements.filter(isObject) as AppState["measurements"] : [],
    preferences: normalizePreferences(value.preferences)
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

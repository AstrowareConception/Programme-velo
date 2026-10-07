import type { CalorieResult } from "./calorie-challenge";
import { evaluateRouteChallenge, type RouteChallenge } from "./challenges";
import { totalXp } from "./data";
import type { CadenceScore } from "./effort";
import type { ClimbChallenge } from "./routes";
import { compactTelemetry } from "./session";
import { personalBest, segmentPersonalBest } from "./time-attack";
import type {
  AppState,
  ChallengeResult,
  CompletedSession,
  TelemetrySample,
  TimeAttackSplit,
  VoyagePortion,
  WorkoutTemplate
} from "./types";
import { voyageProgress } from "./voyage";

export type SessionCompletionFormValues = {
  manualUsed: boolean;
  elapsedSeconds?: number;
  duration?: number;
  distanceKm?: number;
  calories?: number;
  avgSpeedKmh?: number;
  avgCadenceRpm?: number;
  avgPowerW?: number;
  avgHeartRate?: number;
  rpe?: number;
  note?: string;
};

export type SessionAutoMetrics = {
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
};

type SessionCompletionInput = {
  id: string;
  date: string;
  state: AppState;
  active: WorkoutTemplate;
  activeClimb: ClimbChallenge | null;
  routeMode: "training" | "timeAttack" | "segmentAttack" | "voyage";
  activeVoyage: VoyagePortion | null;
  activeChallenge: RouteChallenge | null;
  segmentAttackIndex: number | null;
  sessionStarted: boolean;
  sessionElapsedSeconds: number;
  totalSessionSeconds: number;
  timeAttackElapsedSeconds: number;
  timeAttackSplits: TimeAttackSplit[];
  pauseCount: number;
  distanceMeasuredByBike: boolean;
  currentRouteKm: number;
  raceCurrentKm: number;
  sessionProgressPercent: number;
  activeSegmentBounds?: { distanceKm: number };
  form: SessionCompletionFormValues;
  telemetrySamples: TelemetrySample[];
  autoMetrics: SessionAutoMetrics;
  calorieMode: boolean;
  calorieResult?: CalorieResult;
  cadenceScore: CadenceScore;
  comparisonKey?: string;
  cadenceRecordEligible: boolean;
  keepTelemetryTrace: boolean;
};

export type SessionCompletionResult = {
  session: CompletedSession;
  awardedXp: number;
  isPersonalBest: boolean;
  isSegmentAttack: boolean;
  isVoyage: boolean;
  completedPortion: boolean;
  voyageComplete: boolean;
  voyageXpEarned: number;
  challengeResult?: ChallengeResult;
  message: string;
};

export function buildSessionCompletion(input: SessionCompletionInput): SessionCompletionResult {
  const {
    id,
    date,
    state,
    active,
    activeClimb,
    routeMode,
    activeVoyage,
    activeChallenge,
    segmentAttackIndex,
    sessionStarted,
    sessionElapsedSeconds,
    totalSessionSeconds,
    timeAttackElapsedSeconds,
    timeAttackSplits,
    pauseCount,
    distanceMeasuredByBike,
    currentRouteKm,
    raceCurrentKm,
    sessionProgressPercent,
    activeSegmentBounds,
    form,
    telemetrySamples,
    autoMetrics,
    calorieMode,
    calorieResult,
    cadenceScore,
    comparisonKey,
    cadenceRecordEligible,
    keepTelemetryTrace
  } = input;

  const hasFtms = telemetrySamples.length > 0;
  const isTimeAttack = routeMode === "timeAttack" && Boolean(activeClimb);
  const isSegmentAttack = routeMode === "segmentAttack" && Boolean(activeClimb) && segmentAttackIndex !== null;
  const isRaceMode = isTimeAttack || isSegmentAttack;
  const isVoyage = routeMode === "voyage" && Boolean(activeVoyage);
  const completedPortion = Boolean(isVoyage && sessionStarted && sessionElapsedSeconds >= totalSessionSeconds - 0.01);
  const elapsedSeconds = isRaceMode
    ? (form.elapsedSeconds ?? timeAttackElapsedSeconds)
    : undefined;
  const duration = calorieMode
    ? sessionElapsedSeconds / 60
    : isVoyage
      ? sessionElapsedSeconds / 60
      : isRaceMode && elapsedSeconds !== undefined
        ? elapsedSeconds / 60
        : (form.duration ?? active.duration);

  const previousBest = isTimeAttack && activeClimb
    ? personalBest(state.sessions, activeClimb.id)
    : isSegmentAttack && activeClimb && segmentAttackIndex !== null
      ? segmentPersonalBest(state.sessions, activeClimb.id, segmentAttackIndex)
      : undefined;

  const candidatePersonalBest = Boolean(
    isRaceMode &&
    elapsedSeconds !== undefined &&
    (!previousBest?.metrics?.elapsedSeconds || elapsedSeconds < previousBest.metrics.elapsedSeconds)
  );

  const completedRoute = activeClimb
    ? (isSegmentAttack || isVoyage
        ? false
        : distanceMeasuredByBike
          ? currentRouteKm >= activeClimb.distanceKm * 0.98
          : sessionProgressPercent >= 98 ||
            (isTimeAttack && timeAttackSplits.some((split) => split.km >= activeClimb.distanceKm * 0.98)))
    : true;

  const completedSegment = isSegmentAttack && activeSegmentBounds
    ? (distanceMeasuredByBike
        ? raceCurrentKm >= activeSegmentBounds.distanceKm * 0.98
        : sessionProgressPercent >= 98)
    : undefined;

  const isPersonalBest = Boolean(
    candidatePersonalBest &&
    (isSegmentAttack ? completedSegment : completedRoute) &&
    (elapsedSeconds ?? 0) > 0
  );

  const challengeResult = activeChallenge && activeClimb
    ? evaluateRouteChallenge(activeChallenge, {
        route: activeClimb,
        completedRoute,
        pauseCount,
        avgCadenceRpm: form.avgCadenceRpm ?? autoMetrics.avgCadenceRpm,
        elapsedSeconds,
        pbBeforeSeconds: previousBest?.metrics?.elapsedSeconds,
        checkpointSplits: timeAttackSplits
      })
    : undefined;

  const awardedXp = active.xp + (isPersonalBest ? 50 : 0) + (challengeResult?.xpBonus ?? 0);

  const session: CompletedSession = {
    id,
    templateId: active.id,
    routeId: activeClimb?.id,
    date,
    duration,
    points: isVoyage && !completedPortion ? 0 : active.points,
    xp: awardedXp,
    intensity: active.intensity,
    kind: active.kind,
    bonus: Boolean(active.bonus),
    rpe: form.rpe,
    note: form.note,
    metrics: {
      voyage: isVoyage && activeVoyage ? { ...activeVoyage, completedPortion } : undefined,
      source: hasFtms && form.manualUsed ? "mixed" : hasFtms ? "ftms" : "manual",
      completedWorkout: activeClimb ? undefined : sessionStarted ? sessionProgressPercent >= 98 : true,
      elapsedSeconds,
      timeAttack: isTimeAttack || undefined,
      segmentAttackIndex: isSegmentAttack && segmentAttackIndex !== null ? segmentAttackIndex : undefined,
      checkpointSplits: isTimeAttack ? timeAttackSplits : undefined,
      challenge: challengeResult,
      completedRoute: activeClimb ? completedRoute : undefined,
      completedSegment,
      distanceKm: form.distanceKm ?? autoMetrics.distanceKm ??
        (isVoyage ? undefined : activeClimb ? (isSegmentAttack ? raceCurrentKm : currentRouteKm) : undefined),
      calories: calorieMode ? calorieResult?.kcal : form.calories ?? autoMetrics.calories,
      calorieChallenge: calorieResult,
      avgSpeedKmh: form.avgSpeedKmh ?? autoMetrics.avgSpeedKmh,
      avgCadenceRpm: form.avgCadenceRpm ?? autoMetrics.avgCadenceRpm,
      maxCadenceRpm: autoMetrics.maxCadenceRpm,
      avgPowerW: form.avgPowerW ?? autoMetrics.avgPowerW,
      maxPowerW: autoMetrics.maxPowerW,
      avgHeartRate: form.avgHeartRate ?? autoMetrics.avgHeartRate,
      maxHeartRate: autoMetrics.maxHeartRate,
      avgResistance: autoMetrics.avgResistance,
      cadenceScore: calorieMode ? undefined : cadenceScore,
      cadenceSettingsKey: calorieMode ? undefined : comparisonKey,
      cadenceRecordEligible: !calorieMode && cadenceRecordEligible,
      samples: hasFtms && keepTelemetryTrace ? compactTelemetry(telemetrySamples) : undefined
    }
  };

  const nextSessions = [...state.sessions, session];
  const voyageXpEarned = isVoyage ? totalXp({ ...state, sessions: nextSessions }) - totalXp(state) : 0;
  const voyageComplete = Boolean(isVoyage && activeClimb && voyageProgress(activeClimb, nextSessions).complete);

  const message = isVoyage
    ? (completedPortion
        ? `${voyageComplete ? "Voyage achevé" : "Portion enregistrée · la suite t’attend dans Quête"}${voyageXpEarned ? ` · +${voyageXpEarned} XP` : ""}`
        : "Séance enregistrée. Portion inachevée : aucun kilomètre validé dans le Voyage.")
    : challengeResult
      ? (challengeResult.success
          ? `Défi réussi · +${awardedXp} XP`
          : `Défi manqué · ${challengeResult.summary}`)
      : isPersonalBest
        ? `${isSegmentAttack ? "Nouveau record de secteur" : "Nouveau record personnel"} · +${awardedXp} XP`
        : `Quête validée · +${awardedXp} XP`;

  return {
    session,
    awardedXp,
    isPersonalBest,
    isSegmentAttack,
    isVoyage,
    completedPortion,
    voyageComplete,
    voyageXpEarned,
    challengeResult,
    message
  };
}

import { describe, expect, it } from "vitest";
import { emptyState, workouts } from "../lib/data";
import { emptyCadenceScore } from "../lib/effort";
import { climbs, climbToWorkout, routeSegmentWorkout } from "../lib/routes";
import { buildSessionCompletion } from "../lib/session-completion";
import type { CompletedSession, VoyagePortion, WorkoutTemplate } from "../lib/types";
import { voyageWorkout } from "../lib/voyage";

function baseInput(active: WorkoutTemplate) {
  return {
    id: "session-new",
    date: "2026-10-07T18:00:00.000Z",
    state: emptyState(),
    active,
    activeClimb: null,
    routeMode: "training" as const,
    activeVoyage: null,
    activeChallenge: null,
    segmentAttackIndex: null,
    sessionStarted: true,
    sessionElapsedSeconds: active.duration * 60,
    totalSessionSeconds: active.duration * 60,
    timeAttackElapsedSeconds: 0,
    timeAttackSplits: [],
    pauseCount: 0,
    distanceMeasuredByBike: false,
    currentRouteKm: 0,
    raceCurrentKm: 0,
    sessionProgressPercent: 100,
    activeSegmentBounds: undefined,
    form: { manualUsed: false },
    telemetrySamples: [],
    autoMetrics: {},
    calorieMode: false,
    calorieResult: undefined,
    cadenceScore: emptyCadenceScore(),
    comparisonKey: "settings",
    cadenceRecordEligible: false,
    keepTelemetryTrace: true
  };
}

describe("session completion", () => {
  it("preserves received measures and opt-in traces without mutating its input", () => {
    const active = workouts[0];
    const input = {
      ...baseInput(active),
      telemetrySamples: [{ t: 0, powerW: 100 }, { t: 10, powerW: 120 }],
      autoMetrics: { distanceKm: 2.5, avgPowerW: 110, avgHeartRate: 105 },
      keepTelemetryTrace: false
    };
    const before = structuredClone(input);
    const result = buildSessionCompletion(input);
    expect(result.session.metrics).toMatchObject({ source: "ftms", distanceKm: 2.5, avgPowerW: 110, avgHeartRate: 105 });
    expect(result.session.metrics?.samples).toBeUndefined();
    expect(buildSessionCompletion({ ...input, keepTelemetryTrace: true }).session.metrics?.samples).toEqual(input.telemetrySamples);
    expect(input).toEqual(before);
  });

  it("keeps explicitly entered zeroes and mixed provenance over automatic values", () => {
    const result = buildSessionCompletion({
      ...baseInput(workouts[0]),
      telemetrySamples: [{ t: 0, powerW: 80 }],
      autoMetrics: { distanceKm: 4, calories: 30, avgPowerW: 80 },
      form: { manualUsed: true, distanceKm: 0, calories: 0, avgPowerW: 0 }
    });
    expect(result.session.metrics).toMatchObject({ source: "mixed", distanceKm: 0, calories: 0, avgPowerW: 0 });
  });

  it("uses the calorie challenge result and elapsed duration rather than editable fields", () => {
    const result = buildSessionCompletion({
      ...baseInput(workouts[0]),
      calorieMode: true,
      calorieResult: { version: 1, durationSeconds: 300, source: "manual", kcal: 45, eligible: false },
      sessionElapsedSeconds: 120,
      form: { manualUsed: true, duration: 99, calories: 999 },
      cadenceRecordEligible: true
    });
    expect(result.session.duration).toBe(2);
    expect(result.session.metrics?.calories).toBe(45);
    expect(result.session.metrics?.calorieChallenge?.eligible).toBe(false);
    expect(result.session.metrics?.cadenceScore).toBeUndefined();
    expect(result.session.metrics?.cadenceRecordEligible).toBe(false);
  });

  it("does not validate a measured route from timer progress alone", () => {
    const route = climbs[0];
    const result = buildSessionCompletion({
      ...baseInput(climbToWorkout(route)), activeClimb: route, routeMode: "timeAttack",
      distanceMeasuredByBike: true, currentRouteKm: route.distanceKm / 2,
      timeAttackElapsedSeconds: 100, sessionProgressPercent: 100
    });
    expect(result.session.metrics?.completedRoute).toBe(false);
    expect(result.isPersonalBest).toBe(false);
    expect(result.session.xp).toBe(climbToWorkout(route).xp);
  });

  it("records a normal manual workout without changing its reward", () => {
    const active = workouts.find((workout) => workout.id === "recovery-30")!;
    const result = buildSessionCompletion({
      ...baseInput(active),
      form: {
        manualUsed: true,
        duration: 25,
        distanceKm: 9.4,
        rpe: 4,
        note: "Souple"
      }
    });

    expect(result.session.duration).toBe(25);
    expect(result.session.points).toBe(active.points);
    expect(result.session.xp).toBe(active.xp);
    expect(result.session.rpe).toBe(4);
    expect(result.session.note).toBe("Souple");
    expect(result.session.metrics?.source).toBe("manual");
    expect(result.session.metrics?.completedWorkout).toBe(true);
    expect(result.session.metrics?.distanceKm).toBe(9.4);
    expect(result.message).toBe(`Quête validée · +${active.xp} XP`);
  });

  it("awards the PB bonus only to a completed faster Time Attack", () => {
    const route = climbs[0];
    const active = climbToWorkout(route);
    const previous: CompletedSession = {
      id: "old",
      templateId: active.id,
      routeId: route.id,
      date: "2026-10-01T18:00:00.000Z",
      duration: 20,
      points: active.points,
      xp: active.xp,
      intensity: active.intensity,
      kind: active.kind,
      bonus: false,
      metrics: {
        source: "manual",
        completedRoute: true,
        timeAttack: true,
        elapsedSeconds: 1000
      }
    };

    const result = buildSessionCompletion({
      ...baseInput(active),
      state: { ...emptyState(), sessions: [previous] },
      activeClimb: route,
      routeMode: "timeAttack",
      timeAttackElapsedSeconds: 900,
      timeAttackSplits: [{ km: route.distanceKm, elapsedSeconds: 900 }],
      currentRouteKm: route.distanceKm,
      raceCurrentKm: route.distanceKm
    });

    expect(result.isPersonalBest).toBe(true);
    expect(result.session.metrics?.completedRoute).toBe(true);
    expect(result.session.metrics?.elapsedSeconds).toBe(900);
    expect(result.session.xp).toBe(active.xp + 50);
    expect(result.message).toContain("Nouveau record personnel");
  });

  it("does not create a segment record when the sector is incomplete", () => {
    const route = climbs[0];
    const active = routeSegmentWorkout(route, 0);
    const segmentDistance = route.distanceKm / 4;
    const result = buildSessionCompletion({
      ...baseInput(active),
      activeClimb: route,
      routeMode: "segmentAttack",
      segmentAttackIndex: 0,
      timeAttackElapsedSeconds: 300,
      sessionProgressPercent: 50,
      currentRouteKm: segmentDistance / 2,
      raceCurrentKm: segmentDistance / 2,
      activeSegmentBounds: { distanceKm: segmentDistance }
    });

    expect(result.isPersonalBest).toBe(false);
    expect(result.session.metrics?.completedSegment).toBe(false);
    expect(result.session.metrics?.segmentAttackIndex).toBe(0);
    expect(result.session.xp).toBe(active.xp);
  });

  it("keeps an unfinished Voyage portion unvalidated", () => {
    const route = climbs[0];
    const portion: VoyagePortion = {
      version: 1,
      startKm: 0,
      endKm: Math.min(route.distanceKm, 5),
      routeDistanceKm: route.distanceKm,
      routeXp: route.xp,
      completedPortion: false,
      positionSource: "simulation"
    };
    const active = voyageWorkout(route, portion);
    const result = buildSessionCompletion({
      ...baseInput(active),
      activeClimb: route,
      routeMode: "voyage",
      activeVoyage: portion,
      sessionElapsedSeconds: 120,
      totalSessionSeconds: 900,
      sessionProgressPercent: 13
    });

    expect(result.completedPortion).toBe(false);
    expect(result.session.points).toBe(0);
    expect(result.session.metrics?.voyage?.completedPortion).toBe(false);
    expect(result.voyageComplete).toBe(false);
    expect(result.message).toContain("Portion inachevée");
  });
});

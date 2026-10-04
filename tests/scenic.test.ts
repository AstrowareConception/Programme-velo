import { describe, expect, it } from "vitest";
import { badges, emptyState, totalXp, weeklyStats, workouts } from "../lib/data";
import { campaignBonusXp, campaignProgress, campaigns } from "../lib/campaigns";
import { scenicRouteIds, scenicRoutes } from "../lib/scenic-routes";
import { climbToWorkout, climbs, routeCategory, scenicResistanceForGrade } from "../lib/routes";
import { collectionProgress, progressionStats, routeCollections } from "../lib/progression";
import { createBackup, parseBackup } from "../lib/storage";
import { discoveryWorkouts } from "../lib/discovery-workouts";
import type { CompletedSession } from "../lib/types";

function completed(routeId: string, metrics: CompletedSession["metrics"] = { source: "manual", completedRoute: true }): CompletedSession {
  const route = scenicRoutes.find((r) => r.id === routeId)!;
  const workout = climbToWorkout(route);
  return { id: `${routeId}-${Math.random()}`, routeId, templateId: workout.id, date: new Date().toISOString(),
    duration: workout.duration, points: workout.points, xp: workout.xp, intensity: workout.intensity,
    kind: workout.kind, bonus: false, metrics };
}

describe("documented scenic catalogue", () => {
  it("adds seven distinct rides while preserving the fourteen earlier routes", () => {
    expect(scenicRoutes).toHaveLength(7);
    expect(climbs).toHaveLength(21);
    expect(new Set(climbs.map((r) => r.id)).size).toBe(climbs.length);
    expect(climbs.filter((r) => routeCategory(r) === "stage" && (r.difficulty ?? 5) <= 3)).toHaveLength(5);
    expect(climbs.find((r) => r.id === "ventoux-bedoin")?.distanceKm).toBe(21);
  });

  it("keeps geographic provenance, continuous distance and internally consistent terrain", () => {
    for (const route of scenicRoutes) {
      expect(route.provenance?.gpxSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(route.provenance?.gpxUrl.startsWith("https://")).toBe(true);
      expect(route.provenance?.altitudeSource).toMatch(/GPX officiel|IGN RGE ALTI/);
      expect(route.profile[0].km).toBe(0);
      expect(route.profile.at(-1)?.km).toBeCloseTo(route.distanceKm, 5);
      let gain = 0;
      route.profile.slice(1).forEach((point, index) => {
        const previous = route.profile[index];
        expect(point.km).toBeGreaterThan(previous.km);
        expect(point.grade).toBeCloseTo((point.elevation - previous.elevation) / ((point.km - previous.km) * 10), 2);
        gain += Math.max(0, point.elevation - previous.elevation);
      });
      expect(route.elevationGainM).toBe(Math.round(gain));
      expect(route.coordinates.length).toBeGreaterThan(40);
      expect(route.maxGrade).toBeLessThan(2);
    }
  });

  it("makes the full scenic ride genuinely easy without compressing its distance into a short session", () => {
    for (const route of scenicRoutes) {
      const workout = climbToWorkout(route);
      expect(route.difficulty).toBe(1);
      expect(workout.intensity).toBe("easy");
      expect(workout.kind).toBe("endurance");
      expect(Math.abs(workout.duration - route.distanceKm * 4)).toBeLessThan(1);
      workout.segments.forEach((s) => {
        expect(Number(s.resistance)).toBeGreaterThanOrEqual(4);
        expect(Number(s.resistance)).toBeLessThanOrEqual(10);
        expect(s.rpe).toBe("2–4");
      });
    }
    expect(climbToWorkout(scenicRoutes[0]).duration).toBeGreaterThan(130);
    expect(scenicResistanceForGrade(-20)).toBe(4);
    expect(scenicResistanceForGrade(20)).toBe(10);
    expect(climbToWorkout(climbs.find((r) => r.id === "ventoux-bedoin")!).intensity).toBe("hard");
  });
});

describe("discovery rewards and preserved history", () => {
  it("counts different complete rides, excluding repeats, unfinished attempts and sectors", () => {
    const state = emptyState();
    state.sessions = [completed(scenicRouteIds[0]), completed(scenicRouteIds[0]),
      completed(scenicRouteIds[1], { source: "manual", completedRoute: false }),
      completed(scenicRouteIds[2], { source: "manual", completedRoute: true, segmentAttackIndex: 0 })];
    expect(badges(state).find((b) => b.id === "scenic-first")?.unlocked).toBe(true);
    expect(badges(state).find((b) => b.id === "scenic-three")?.progress).toBe("1/3");
    expect(badges(state).find((b) => b.id === "scenic-all")?.unlocked).toBe(false);
    expect(badges(state).find((b) => b.id === "climb1")?.unlocked).toBe(false);
    expect(campaignBonusXp(state.sessions)).toBe(0);
    expect(weeklyStats(state, 1).hard).toBe(0);
  });

  it("awards each notebook bonus once and recalculates after removal and backup restore", () => {
    const state = emptyState();
    state.sessions = scenicRouteIds.map((id) => completed(id));
    const originalXp = totalXp(state);
    expect(campaignBonusXp(state.sessions)).toBe(750);
    expect(badges(state).find((b) => b.id === "scenic-all")?.unlocked).toBe(true);
    const collection = routeCollections.find((c) => c.id === "scenic-france")!;
    expect(collectionProgress(collection, progressionStats(state.sessions, climbs).completedRouteIds).unlocked).toBe(true);
    const repeated = completed("chambord-petit-tour");
    state.sessions.push(repeated);
    expect(campaignBonusXp(state.sessions)).toBe(750);
    expect(totalXp(state)).toBe(originalXp + repeated.xp);
    state.sessions = state.sessions.filter((s) => s.routeId !== "chambord-petit-tour");
    expect(campaignBonusXp(state.sessions)).toBe(450);
    expect(totalXp(state)).toBe(originalXp - repeated.xp - 300);
    const restored = parseBackup(JSON.stringify(createBackup(state, []))).state;
    expect(badges(restored).find((b) => b.id === "scenic-all")?.progress).toBe("6/7");
    const heritage = campaigns.find((c) => c.id === "quiet-heritage")!;
    expect(campaignProgress(heritage, restored.sessions).nextRouteId).toBe("chambord-petit-tour");
  });

  it("keeps the new micro-bonus within the shared weekly cap and the extra workouts coherent", () => {
    const state = emptyState();
    const bonus = workouts.find((w) => w.id === "bonus-soft-12")!;
    state.sessions = Array.from({ length: 6 }, (_, i) => ({ id: String(i), templateId: bonus.id,
      date: new Date().toISOString(), duration: bonus.duration, points: 0, xp: bonus.xp,
      intensity: bonus.intensity, kind: bonus.kind, bonus: true }));
    expect(totalXp(state)).toBe(60);
    expect(weeklyStats(state, 1).points).toBe(0);
    expect(weeklyStats(state, 1).sessions).toBe(0);
    discoveryWorkouts.forEach((w) => expect(w.segments.reduce((sum, s) => sum + s.minutes, 0)).toBe(w.duration));
  });
});

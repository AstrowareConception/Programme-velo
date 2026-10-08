import { describe, expect, it } from "vitest";
import { climbs } from "../lib/routes";
import { voyagePlan, voyageProgress, voyageWorkout } from "../lib/voyage";
import { allCompletedRouteIds, validVoyagePortion, voyageBonusXp, voyageRoutes } from "../lib/voyage-progress";
import { badges, emptyState, totalXp } from "../lib/data";
import { campaignProgress, campaigns } from "../lib/campaigns";
import { progressionStats } from "../lib/progression";
import { createBackup, normalizeState, parseBackup } from "../lib/storage";
import { personalBest, segmentPersonalBest } from "../lib/time-attack";
import { restoreSessionSnapshot, type ActiveSessionSnapshot } from "../lib/session-recovery";
import type { CompletedSession, VoyagePortion } from "../lib/types";

const route = climbs.find(r => r.id === "napoleon-golfe-grasse")!;
function session(startKm: number, endKm: number, extra: Partial<VoyagePortion> = {}, day = 5): CompletedSession {
  return { id: `${startKm}-${endKm}-${day}`, templateId: "voyage-test", routeId: route.id,
    date: `2026-10-${String(day).padStart(2, "0")}T12:00:00Z`, duration: (endKm - startKm) * 4,
    points: 0, xp: 0, intensity: "moderate", kind: "hills", bonus: false,
    metrics: { source: "manual", completedRoute: false, voyage: { version: 1, startKm, endKm,
      routeDistanceKm: route.distanceKm, routeXp: route.xp, completedPortion: true, positionSource: "simulation", ...extra } } };
}
const full = () => [session(0, route.distanceKm / 2), session(route.distanceKm / 2, route.distanceKm, {}, 6)];
const withSessions = (sessions: CompletedSession[]) => ({ ...emptyState(), sessions });

describe("Voyage coverage and rewards", () => {
  it("adds distinct trophies without changing the 67 historic goals", () => {
    const all = badges(emptyState());
    const old = all.filter(b => !["program-return-in-comfort", "program-steady-mastery", "program-manage-your-ride"].includes(b.id) && !b.id.startsWith("days-") && !b.id.startsWith("regular-weeks-") && !b.id.startsWith("voyage-") && !b.id.startsWith("alsace-") && !b.id.startsWith("campaign-alsace-"));
    expect(old).toHaveLength(67); expect(all).toHaveLength(83);
    for (const trophy of all.filter(b => b.id.startsWith("voyage-"))) expect(old.some(b => b.name === trophy.name)).toBe(false);
    expect(new Set(all.map(b => b.id)).size).toBe(83);
  });
  it("cuts a real distance at 15 km/h without shortening the parent route", () => {
    const before = JSON.stringify(route);
    const plan = voyagePlan(route, [], 30)!;
    expect(plan.startKm).toBe(0); expect(plan.endKm).toBe(7.5);
    const workout = voyageWorkout(route, plan);
    expect(workout.duration).toBeCloseTo(30, 1); expect(workout.xp).toBe(0);
    expect(workout.segments.at(-1)?.label).toContain("7.50 km");
    expect(JSON.stringify(route)).toBe(before);
    const next = voyagePlan(route, [session(0, 7.5)], 15)!;
    expect(next.startKm).toBe(7.5); expect(next.endKm).toBe(11.25);
  });

  it("supports every native profile and keeps the total distance across portions", () => {
    for (const r of climbs) {
      const sessions: CompletedSession[] = [];
      let travelled = 0;
      for (let i = 0; i < 200; i++) {
        const p = voyagePlan(r, sessions, 30);
        if (!p) break;
        const w = voyageWorkout(r, p);
        expect(w.segments.length, r.id).toBeGreaterThan(0);
        expect(w.duration, r.id).toBeLessThanOrEqual(30.1);
        travelled += p.endKm - p.startKm;
        sessions.push({ ...session(p.startKm, p.endKm), routeId: r.id, metrics: { source: "manual", completedRoute: false, voyage: { ...p, completedPortion: true } } });
      }
      expect(travelled, r.id).toBeCloseTo(r.distanceKm, 8);
      expect(voyageProgress(r, sessions).complete, r.id).toBe(true);
    }
  });

  it("does not complete a route for a partial or unfinished portion", () => {
    const s = [session(0, 5), session(5, route.distanceKm, { completedPortion: false })];
    expect(voyageProgress(route, s).coveredKm).toBe(5);
    expect(allCompletedRouteIds(s).size).toBe(0); expect(voyageBonusXp(s)).toBe(0);
    expect(campaignProgress(campaigns.find(c => c.id === "napoleon-paca")!, s).completedStages).toBe(0);
  });

  it("merges overlaps and out-of-order portions once, without bridging missing kilometres", () => {
    const s = [session(8, route.distanceKm), session(0, 5), session(2, 5)];
    expect(voyageProgress(route, s).nextStartKm).toBe(5);
    expect(voyagePlan(route, s, 60)?.endKm).toBe(8);
    expect(voyageProgress(route, s).complete).toBe(false);
    s.push(session(5, 8));
    expect(voyageProgress(route, s).complete).toBe(true);
    expect(voyageBonusXp([...s, ...s])).toBe(route.xp);
    expect(progressionStats([...s, ...s], climbs).totalRouteCompletions).toBe(1);
  });

  it("recalculates route, campaign, trophies, XP and missing position after deletion", () => {
    const s = full();
    expect(allCompletedRouteIds(s).has(route.id)).toBe(true);
    expect(totalXp(withSessions(s))).toBe(route.xp);
    expect(campaignProgress(campaigns.find(c => c.id === "napoleon-paca")!, s).completedStages).toBe(1);
    expect(badges(withSessions(s)).find(b => b.id === "voyage-complete")?.unlocked).toBe(true);
    const remaining = s.slice(1);
    expect(voyagePlan(route, remaining, 60)?.startKm).toBe(0);
    expect(allCompletedRouteIds(remaining).has(route.id)).toBe(false);
    expect(totalXp(withSessions(remaining))).toBe(0);
    expect(badges(withSessions(remaining)).find(b => b.id === "voyage-complete")?.unlocked).toBe(false);
    expect(progressionStats(remaining, climbs).virtualElevationGainM).toBe(0);
  });

  it("does not multiply route XP from duplicate portions or stored session XP", () => {
    const s = full().map(s => ({ ...s, xp: 999 }));
    expect(totalXp(withSessions([...s, ...s]))).toBe(route.xp);
    expect(voyagePlan(route, s, 30)).toBeNull();
  });

  it("preserves classic rewards, excludes a previous classic completion from the Voyage bonus", () => {
    const classic = { ...session(0, route.distanceKm, {}, 4), xp: route.xp, metrics: { source: "manual" as const, completedRoute: true } };
    expect(voyageBonusXp([classic, ...full()])).toBe(0);
    expect(totalXp(withSessions([classic, ...full()]))).toBe(route.xp);
    expect(voyageBonusXp(full())).toBe(route.xp);
    // A later classic training ride keeps its ordinary XP: it cannot revoke
    // the reward already earned when the Voyage was first completed.
    const later = { ...classic, date: "2026-10-07T12:00:00Z" };
    expect(totalXp(withSessions([...full(), later]))).toBe(route.xp * 2);
  });

  it("rejects invalid bounds, contradictory GPX metadata and race/challenge mixtures", () => {
    for (const patch of [{ startKm: -1 }, { endKm: route.distanceKm + 1 }, { endKm: 0 }, { routeXp: Infinity }, { positionSource: "ftms" }, { version: 2 }] as Partial<VoyagePortion>[]) {
      const s = session(0, route.distanceKm, patch);
      expect(validVoyagePortion(s.metrics?.voyage)).toBe(false);
      expect(allCompletedRouteIds([s]).size).toBe(0);
    }
    expect(voyageProgress(route, [session(0, 5), session(5, route.distanceKm, { routeXp: route.xp + 1 })]).coveredKm).toBe(5);
    const contradictory = [session(0, 5), session(5, route.distanceKm, { routeXp: route.xp + 1 })].map(s => ({ ...s, routeId: "gpx-contradictory" }));
    expect(voyageRoutes(contradictory)).toEqual([]);
    expect(allCompletedRouteIds([session(0, 1, { routeDistanceKm: 1 })]).size).toBe(0);
    for (const mix of [{ timeAttack: true, elapsedSeconds: 1 }, { segmentAttackIndex: 0, elapsedSeconds: 1 }, { challenge: { id: "x", success: true, summary: "", xpBonus: 999 } }]) {
      const s = session(0, route.distanceKm); s.metrics = { ...s.metrics!, ...mix, completedRoute: true, completedSegment: true };
      expect(allCompletedRouteIds([s]).size).toBe(0);
      expect(personalBest([s], route.id)).toBeUndefined();
      expect(segmentPersonalBest([s], route.id, 0)).toBeUndefined();
    }
  });

  it("exports selection and custom GPX history without changing backup version", () => {
    const custom = { ...route, id: "gpx-private" };
    const state = { ...withSessions(full().map(s => ({ ...s, routeId: custom.id }))), voyage: { routeId: custom.id, minutes: 45 as const } };
    const backup = createBackup(state, [custom]);
    expect(backup.format).toBe("veloquest-backup-v3");
    const restored = parseBackup(JSON.stringify(backup));
    expect(restored.state.voyage).toEqual(state.voyage); expect(restored.state.sessions).toEqual(state.sessions);
    expect(restored.customClimbs).toEqual([custom]);
    expect(voyageProgress(custom, restored.state.sessions).complete).toBe(true);
    expect(parseBackup(JSON.stringify(emptyState())).state.voyage).toBeUndefined();
  });

  it("resumes the portion rather than a whole route, and freezes its position while paused", () => {
    const p = voyagePlan(route, [session(0, 7.5)], 30)!;
    const w = voyageWorkout(route, p);
    const snapshot: ActiveSessionSnapshot = { version: 1, savedAt: 1000, workoutId: w.id, routeId: route.id, routeMode: "voyage", voyage: p,
      segmentIndex: 0, secondsLeft: 20, running: false, sessionStarted: true, showFinish: false,
      timeAttackElapsedSeconds: 0, timeAttackSplits: [], pauseCount: 1, sessionResistanceDelta: 0, telemetrySamples: [], hadBikeConnection: false };
    const restored = restoreSessionSnapshot(snapshot, w, 100000);
    expect(restored.voyage?.startKm).toBe(7.5); expect(restored.secondsLeft).toBe(20);
    const finished = restoreSessionSnapshot({ ...snapshot, running: true }, w, 10000000);
    expect(finished.showFinish).toBe(true); expect(finished.secondsLeft).toBe(0);
  });

  it("keeps malformed imported portions from crashing the journal or becoming legacy completions", () => {
    const s = session(0, route.distanceKm);
    for (const voyage of [null, "broken", { ...s.metrics!.voyage, startKm: "zero" }]) {
      const state = normalizeState({ ...withSessions([s]), sessions: [{ ...s, xp: 999, metrics: { source: "manual", voyage } }] });
      expect(state.sessions).toHaveLength(1);
      expect(state.sessions[0].metrics?.voyage).toBeUndefined();
      expect(allCompletedRouteIds(state.sessions).size).toBe(0);
      expect(totalXp(state)).toBe(0);
    }
  });
});

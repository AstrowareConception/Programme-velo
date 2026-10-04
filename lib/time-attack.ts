import { isRouteCompleted } from "./progression";
import type { CompletedSession, TelemetrySample, TimeAttackSplit } from "./types";

export function formatRaceTime(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2,"0")}:${String(secs).padStart(2,"0")}`
    : `${minutes}:${String(secs).padStart(2,"0")}`;
}

export function routeAttempts(sessions: CompletedSession[], routeId: string) {
  return sessions
    .filter((session) => session.routeId === routeId && isRouteCompleted(session) && session.metrics?.timeAttack && Number.isFinite(session.metrics.elapsedSeconds) && (session.metrics.elapsedSeconds ?? 0) > 0)
    .sort((a,b) => (a.metrics?.elapsedSeconds ?? Infinity) - (b.metrics?.elapsedSeconds ?? Infinity));
}

export function personalBest(sessions: CompletedSession[], routeId: string) {
  return routeAttempts(sessions, routeId)[0];
}

export function checkpointKilometers(distanceKm: number) {
  return [0.25,0.5,0.75,1].map((ratio) => Number((distanceKm * ratio).toFixed(2)));
}

export function captureSplits(
  existing: TimeAttackSplit[],
  checkpoints: number[],
  currentKm: number,
  elapsedSeconds: number
) {
  const seen = new Set(existing.map((split) => split.km));
  const added = checkpoints
    .filter((km) => !seen.has(km) && currentKm >= km)
    .map((km) => ({ km, elapsedSeconds }));
  return [...existing, ...added];
}

function normalizedTrace(samples?: TelemetrySample[]) {
  if (!samples?.length) return [];
  const firstTime = samples[0].t;
  const firstDistance = samples.find((s) => typeof s.distanceKm === "number")?.distanceKm;
  if (firstDistance === undefined) return [];
  return samples
    .filter((s) => typeof s.distanceKm === "number")
    .map((s) => ({
      elapsedSeconds: Math.max(0, (s.t - firstTime) / 1000),
      distanceKm: Math.max(0, (s.distanceKm ?? firstDistance) - firstDistance)
    }));
}

export function ghostElapsedAtDistance(best: CompletedSession | undefined, distanceKm: number, routeDistanceKm: number) {
  if (!best?.metrics?.elapsedSeconds) return undefined;
  const trace = normalizedTrace(best.metrics.samples);
  if (trace.length >= 2) {
    if (distanceKm <= trace[0].distanceKm) return trace[0].elapsedSeconds;
    for (let i=1;i<trace.length;i++) {
      const a=trace[i-1];
      const b=trace[i];
      if (distanceKm <= b.distanceKm) {
        const span=Math.max(0.0001,b.distanceKm-a.distanceKm);
        const ratio=Math.max(0,Math.min(1,(distanceKm-a.distanceKm)/span));
        return a.elapsedSeconds+(b.elapsedSeconds-a.elapsedSeconds)*ratio;
      }
    }
  }
  const progress = Math.max(0, Math.min(1, distanceKm / Math.max(0.001, routeDistanceKm)));
  return best.metrics.elapsedSeconds * progress;
}

export function ghostDeltaSeconds(best: CompletedSession | undefined, distanceKm: number, routeDistanceKm: number, elapsedSeconds: number) {
  const ghost = ghostElapsedAtDistance(best, distanceKm, routeDistanceKm);
  if (ghost === undefined) return undefined;
  return elapsedSeconds - ghost;
}


export function ghostDistanceAtElapsed(best: CompletedSession | undefined, elapsedSeconds: number, routeDistanceKm: number) {
  if (!best?.metrics?.elapsedSeconds) return undefined;
  const trace = normalizedTrace(best.metrics.samples);
  if (trace.length >= 2) {
    if (elapsedSeconds <= trace[0].elapsedSeconds) return trace[0].distanceKm;
    for (let i=1;i<trace.length;i++) {
      const a=trace[i-1];
      const b=trace[i];
      if (elapsedSeconds <= b.elapsedSeconds) {
        const span=Math.max(0.001,b.elapsedSeconds-a.elapsedSeconds);
        const ratio=Math.max(0,Math.min(1,(elapsedSeconds-a.elapsedSeconds)/span));
        return a.distanceKm+(b.distanceKm-a.distanceKm)*ratio;
      }
    }
    return Math.min(routeDistanceKm, trace.at(-1)?.distanceKm ?? routeDistanceKm);
  }
  const progress = Math.max(0, Math.min(1, elapsedSeconds / best.metrics.elapsedSeconds));
  return routeDistanceKm * progress;
}


export function segmentAttempts(sessions: CompletedSession[], routeId: string, segmentIndex: number) {
  return sessions
    .filter((session) =>
      session.routeId === routeId &&
      session.metrics?.segmentAttackIndex === segmentIndex &&
      session.metrics.completedSegment !== false &&
      Number.isFinite(session.metrics.elapsedSeconds) && (session.metrics.elapsedSeconds ?? 0) > 0
    )
    .sort((a,b) => (a.metrics?.elapsedSeconds ?? Infinity) - (b.metrics?.elapsedSeconds ?? Infinity));
}

export function segmentPersonalBest(sessions: CompletedSession[], routeId: string, segmentIndex: number) {
  return segmentAttempts(sessions, routeId, segmentIndex)[0];
}

export function segmentBounds(distanceKm: number, segmentIndex: number, segments = 4) {
  const index = Math.max(0, Math.min(segments - 1, segmentIndex));
  const size = distanceKm / segments;
  return {
    startKm: size * index,
    endKm: size * (index + 1),
    distanceKm: size,
    startRatio: index / segments,
    endRatio: (index + 1) / segments
  };
}

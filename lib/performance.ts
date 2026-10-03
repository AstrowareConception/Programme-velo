import type { CompletedSession, TelemetrySample } from "./types";
import type { ClimbChallenge } from "./routes";

export type SectorPerformance = {
  index: number;
  fromKm: number;
  toKm: number;
  durationSeconds?: number;
  avgPowerW?: number;
  avgCadenceRpm?: number;
  avgHeartRate?: number;
  avgSpeedKmh?: number;
};

function average(values: Array<number | undefined>) {
  const numbers = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : undefined;
}

function normalizedSamples(samples?: TelemetrySample[]) {
  if (!samples?.length) return [];
  const firstTime = samples[0].t;
  const firstDistance = samples.find((sample) => typeof sample.distanceKm === "number")?.distanceKm;
  return samples.map((sample) => ({
    ...sample,
    elapsedSeconds: Math.max(0, (sample.t - firstTime) / 1000),
    routeDistanceKm: firstDistance !== undefined && sample.distanceKm !== undefined
      ? Math.max(0, sample.distanceKm - firstDistance)
      : undefined
  }));
}

function splitSeconds(session: CompletedSession, ratio: number, route: ClimbChallenge) {
  if (ratio === 0) return 0;
  if (ratio === 1) return session.metrics?.elapsedSeconds;
  const splits = session.metrics?.checkpointSplits;
  if (!splits?.length) return undefined;
  const target = route.distanceKm * ratio;
  return [...splits].sort((a,b) => Math.abs(a.km-target) - Math.abs(b.km-target))[0]?.elapsedSeconds;
}

export function analyzeRouteSectors(session: CompletedSession, route: ClimbChallenge): SectorPerformance[] {
  const ratios = [0, .25, .5, .75, 1];
  const samples = normalizedSamples(session.metrics?.samples);

  return ratios.slice(1).map((ratio, index) => {
    const startRatio = ratios[index];
    const fromKm = route.distanceKm * startRatio;
    const toKm = route.distanceKm * ratio;
    const startSeconds = splitSeconds(session, startRatio, route);
    const endSeconds = splitSeconds(session, ratio, route);

    const sectorSamples = samples.filter((sample) => {
      if (sample.routeDistanceKm === undefined) return false;
      const isLast = index === ratios.length - 2;
      return sample.routeDistanceKm >= fromKm && (isLast ? sample.routeDistanceKm <= toKm : sample.routeDistanceKm < toKm);
    });

    return {
      index: index + 1,
      fromKm,
      toKm,
      durationSeconds: startSeconds !== undefined && endSeconds !== undefined ? Math.max(0, endSeconds - startSeconds) : undefined,
      avgPowerW: average(sectorSamples.map((sample) => sample.powerW)),
      avgCadenceRpm: average(sectorSamples.map((sample) => sample.cadenceRpm)),
      avgHeartRate: average(sectorSamples.map((sample) => sample.heartRate)),
      avgSpeedKmh: average(sectorSamples.map((sample) => sample.speedKmh))
    };
  });
}

export function compareSectorTimes(current: SectorPerformance[], reference: SectorPerformance[]) {
  return current.map((sector, index) => {
    const ref = reference[index];
    const deltaSeconds = sector.durationSeconds !== undefined && ref?.durationSeconds !== undefined
      ? sector.durationSeconds - ref.durationSeconds
      : undefined;
    return { ...sector, deltaSeconds };
  });
}

export function bestPowerForWindow(sessions: CompletedSession[], windowSeconds: number) {
  let best: { watts: number; sessionId: string; date: string } | undefined;

  sessions.forEach((session) => {
    const samples = normalizedSamples(session.metrics?.samples).filter((sample) => typeof sample.powerW === "number");
    if (samples.length < 2) return;

    for (let start = 0; start < samples.length; start++) {
      const windowEnd = samples[start].elapsedSeconds + windowSeconds;
      const inWindow = samples.slice(start).filter((sample) => sample.elapsedSeconds <= windowEnd);
      if (inWindow.length < 2) continue;
      const covered = inWindow.at(-1)!.elapsedSeconds - inWindow[0].elapsedSeconds;
      if (covered < windowSeconds * .8) continue;
      const watts = average(inWindow.map((sample) => sample.powerW));
      if (watts !== undefined && (!best || watts > best.watts)) {
        best = { watts, sessionId: session.id, date: session.date };
      }
    }
  });

  return best;
}

export function performanceRecords(sessions: CompletedSession[]) {
  const distances = sessions.map((session) => session.metrics?.distanceKm ?? 0);
  const durations = sessions.map((session) => session.duration ?? 0);
  const avgPowers = sessions.map((session) => session.metrics?.avgPowerW).filter((value): value is number => typeof value === "number");
  const maxCadences = sessions.map((session) => session.metrics?.maxCadenceRpm).filter((value): value is number => typeof value === "number");

  return {
    totalDistanceKm: distances.reduce((sum, value) => sum + value, 0),
    longestRideKm: distances.length ? Math.max(...distances) : 0,
    longestRideMinutes: durations.length ? Math.max(...durations) : 0,
    bestAveragePowerW: avgPowers.length ? Math.max(...avgPowers) : undefined,
    maxCadenceRpm: maxCadences.length ? Math.max(...maxCadences) : undefined,
    best5MinPower: bestPowerForWindow(sessions, 300),
    best20MinPower: bestPowerForWindow(sessions, 1200)
  };
}

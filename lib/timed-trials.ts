import type { CompletedSession } from "./types";

export type Trial = { id: string; name: string; kind: "time" | "distance"; target: number };
export const timedTrials: Trial[] = [
  { id: "distance-1min", name: "La minute express", kind: "time", target: 60 },
  { id: "distance-5min", name: "Les cinq minutes", kind: "time", target: 300 },
  { id: "distance-12min", name: "Les douze minutes", kind: "time", target: 720 },
  { id: "flying-1km", name: "Le kilomètre lancé", kind: "distance", target: 1000 },
  { id: "flying-5km", name: "La poursuite · 5 km", kind: "distance", target: 5000 },
  { id: "flying-10km", name: "Le contre-la-montre · 10 km", kind: "distance", target: 10000 }
];
export type TrialResult = {
  version: 1; trialId: string; source: "ftms" | "manual"; deviceName?: string;
  distanceM: number; elapsedSeconds: number; completed: boolean; eligible: boolean; reason?: string;
};
export type TrialRun = TrialResult & {
  id: string; phase: "countdown" | "armed" | "running" | "review";
  countdownEnd: number; start?: number; baseline?: number; last?: number; lastAt?: number;
};
export const TRIAL_SNAPSHOT_KEY = "veloquest:timed-trial:v1";
export function startTrial(trial: Trial, now: number, source: TrialResult["source"], deviceName?: string): TrialRun {
  return { version: 1, id: crypto.randomUUID(), trialId: trial.id, source, deviceName,
    distanceM: 0, elapsedSeconds: 0, completed: false, eligible: false, phase: "countdown", countdownEnd: now + 5000 };
}
export function stopTrial(run: TrialRun, reason = "Arrêt anticipé : hors record."): TrialRun {
  return { ...run, phase: "review", completed: false, eligible: false, reason };
}
export function tickTrial(run: TrialRun, now: number): TrialRun {
  if (run.phase === "review") return run;
  const trial = timedTrials.find(t => t.id === run.trialId)!;
  if (run.phase === "countdown" && now >= run.countdownEnd) {
    run = { ...run, phase: run.source === "manual" ? "running" : "armed", start: run.source === "manual" ? run.countdownEnd : undefined };
  }
  if (run.phase === "armed" && now - run.countdownEnd > 5000) return stopTrial(run, "Aucune mesure de départ : reconnecte le vélo avant une nouvelle tentative.");
  if (run.phase !== "running" || run.start === undefined) return run;
  const start = run.start;
  const elapsedSeconds = Math.max(0, (now - start) / 1000);
  run = { ...run, elapsedSeconds };
  if (run.source === "ftms" && (now - (run.lastAt ?? start) > 5000)) return stopTrial(run, "Télémétrie interrompue : hors record.");
  if (trial.kind === "time" && elapsedSeconds >= trial.target) {
    // Conservative endpoint: retain the final counter at/before the deadline; never count post-finish distance.
    const recent = run.lastAt !== undefined && run.lastAt >= start + trial.target * 1000 - 2000;
    return { ...run, elapsedSeconds: trial.target, phase: "review", completed: true, eligible: run.source === "ftms" && recent && run.distanceM > 0,
      reason: run.source === "ftms" && !recent ? "Mesure finale trop ancienne : hors record." : undefined };
  }
  if (elapsedSeconds >= 3600) return stopTrial(run, "Limite d’une heure atteinte : hors record.");
  return run;
}
export function sampleTrial(run: TrialRun, distanceM: number, now: number): TrialRun {
  run = tickTrial(run, now);
  if (run.source !== "ftms" || run.phase === "countdown" || run.phase === "review") return run;
  if (!Number.isFinite(distanceM) || distanceM < 0) return stopTrial(run, "Compteur invalide : hors record.");
  if (run.phase === "armed") return { ...run, phase: "running", start: now, baseline: distanceM, last: distanceM, lastAt: now };
  if (run.lastAt === undefined || now <= run.lastAt) return run;
  if (distanceM < (run.last ?? distanceM)) return stopTrial(run, "Le compteur du vélo a été remis à zéro : hors record.");
  const trial = timedTrials.find(t => t.id === run.trialId)!;
  const travelled = distanceM - run.baseline!;
  if (trial.kind === "distance" && travelled >= trial.target) {
    const fraction = (run.baseline! + trial.target - run.last!) / (distanceM - run.last!);
    const crossing = run.lastAt + fraction * (now - run.lastAt);
    return { ...run, distanceM: trial.target, elapsedSeconds: (crossing - run.start!) / 1000,
      last: distanceM, lastAt: now, phase: "review", completed: true, eligible: true };
  }
  return { ...run, distanceM: travelled, last: distanceM, lastAt: now };
}
export function declareTrial(run: TrialRun, distanceM: number): TrialResult {
  const trial = timedTrials.find(t => t.id === run.trialId)!;
  const valid = Number.isFinite(distanceM) && distanceM > 0 && run.elapsedSeconds > 0;
  const completed = trial.kind === "time" ? run.completed && valid : run.completed && valid && distanceM >= trial.target;
  return { version: 1, trialId: run.trialId, source: "manual", distanceM: trial.kind === "distance" ? (completed ? trial.target : run.distanceM) : (valid ? distanceM : 0),
    elapsedSeconds: run.elapsedSeconds, completed, eligible: completed, reason: completed ? undefined : run.reason };
}
export function bestTrial(sessions: CompletedSession[], trialId: string, source: TrialResult["source"], deviceName?: string) {
  const trial = timedTrials.find(t => t.id === trialId);
  if (!trial) return undefined;
  return sessions.map(s => s.metrics?.timedTrial).filter((r): r is TrialResult => Boolean(r && r.version === 1 && r.eligible && r.completed && r.trialId === trialId && r.source === source && (source === "manual" || r.deviceName === deviceName) && r.distanceM > 0 && r.elapsedSeconds > 0 && Number.isFinite(r.distanceM) && Number.isFinite(r.elapsedSeconds)))
    .reduce<TrialResult | undefined>((best, r) => !best || (trial.kind === "time" ? r.distanceM > best.distanceM : r.elapsedSeconds < best.elapsedSeconds) ? r : best, undefined);
}
export function trialValue(result: TrialResult) {
  const trial = timedTrials.find(t => t.id === result.trialId);
  return trial?.kind === "time" ? `${(result.distanceM / 1000).toFixed(3)} km` : `${result.elapsedSeconds.toFixed(1)} s`;
}
export function trialSession(run: TrialRun, result: TrialResult): CompletedSession {
  return { id: run.id, templateId: run.trialId, date: new Date().toISOString(), duration: result.elapsedSeconds / 60,
    points: result.completed ? (result.elapsedSeconds < 600 ? .5 : 1) : 0, xp: result.completed ? 15 : 0,
    intensity: "hard", kind: "hiit", bonus: false,
    metrics: { source: result.source, completedWorkout: result.completed, elapsedSeconds: result.elapsedSeconds,
      distanceKm: result.distanceM / 1000, timedTrial: result } };
}

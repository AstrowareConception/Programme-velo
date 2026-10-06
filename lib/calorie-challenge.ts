import type { CompletedSession, WorkoutTemplate } from "./types";
export const calorieWorkouts: WorkoutTemplate[] = [5, 10].map(minutes => ({
  id: `calories-${minutes}`, name: `Défi calories · ${minutes} min`, tagline: "Cadence libre, résistance libre : ton record en kcal sur un temps fixe.",
  kind: "hiit", intensity: "hard", duration: minutes, points: minutes < 10 ? 0.5 : 1, xp: minutes === 5 ? 15 : 25,
  description: "Choisis ton rythme et ta résistance. Le chrono est continu ; un arrêt anticipé ne valide pas de record. Prépare-toi avant de lancer l’épreuve. Les calories sont une estimation de la console, pas une mesure physiologique exacte. Ce défi compte comme séance intense.",
  segments: [{ label: "Défi calories", minutes, resistance: "libre", cadence: "libre", rpe: "à ton choix" }]
}));
export function isCalorieWorkout(id?: string) { return id === "calories-5" || id === "calories-10"; }
export type CalorieAttempt = { start: number; end: number; baseline?: number; last?: number; lastAt: number; kcal?: number; valid: boolean; deviceName?: string };
export type CalorieResult = { version: 1; durationSeconds: number; source: "ftms" | "manual"; deviceName?: string; kcal: number; eligible: boolean };
export function startCalories(now: number, seconds: number, reading?: { kcal: number; at: number }, deviceName?: string): CalorieAttempt {
  const baseline = reading && now - reading.at <= 5000 && now >= reading.at && Number.isFinite(reading.kcal) && reading.kcal >= 0 ? reading.kcal : undefined;
  return { start: now, end: now + seconds * 1000, baseline, last: baseline, lastAt: reading?.at ?? now, kcal: baseline === undefined ? undefined : 0, valid: baseline !== undefined, deviceName };
}
export function sampleCalories(attempt: CalorieAttempt, kcal: number, now: number): CalorieAttempt {
  if (now > attempt.end || now < attempt.start) return attempt;
  if (!Number.isFinite(kcal) || kcal < 0) return { ...attempt, valid: false };
  const valid = attempt.valid && attempt.last !== undefined && kcal >= attempt.last && now - attempt.lastAt <= 10000;
  return { ...attempt, last: kcal, lastAt: now, valid, kcal: attempt.baseline === undefined ? undefined : Math.max(0, kcal - attempt.baseline) };
}
export function measuredCaloriesEligible(attempt?: CalorieAttempt) { return Boolean(attempt?.valid && attempt.kcal !== undefined && attempt.lastAt >= attempt.end - 5000); }
export function bestCalorieAttempt(sessions: CompletedSession[], templateId: string, source: CalorieResult["source"], deviceName?: string) {
  return sessions.filter(s => s.templateId === templateId && s.metrics?.calorieChallenge?.eligible && s.metrics.calorieChallenge.source === source && (!deviceName || s.metrics.calorieChallenge.deviceName === deviceName))
    .reduce<CompletedSession | undefined>((best, s) => Number.isFinite(s.metrics!.calorieChallenge!.kcal) && s.metrics!.calorieChallenge!.kcal >= 0 && (!best || s.metrics!.calorieChallenge!.kcal > best.metrics!.calorieChallenge!.kcal) ? s : best, undefined);
}

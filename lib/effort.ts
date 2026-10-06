import type { Segment } from "./types";

export function numericRange(text?: string): [number, number] | undefined {
  if (!text || !/^\s*\d+(?:[.,]\d+)?(?:\s*[–−—-]\s*\d+(?:[.,]\d+)?)?\s*$/.test(text)) return undefined;
  const values = text.match(/\d+(?:[.,]\d+)?/g)!.map(value => Number(value.replace(",", ".")));
  return [Math.min(...values), Math.max(...values)];
}

// One ascent and descent per segment; at least five seconds per plateau.
export function resistanceTarget(segment: Segment, elapsed: number, offset = 0) {
  const range = numericRange(segment.resistance);
  if (!range) return undefined;
  const low = Math.max(1, Math.min(32, Math.round(range[0] + offset)));
  const high = Math.max(low, Math.min(32, Math.round(range[1] + offset)));
  const width = high - low;
  const duration = Math.max(1, segment.minutes * 60);
  const steps = Math.min(width, Math.max(0, Math.floor((duration / 5 - 1) / 2)));
  if (!steps) return low;
  const position = Math.min(2 * steps, Math.floor(Math.max(0, elapsed) / duration * (2 * steps + 1)));
  return low + Math.round(Math.min(position, 2 * steps - position) / steps * width);
}

export type CadenceBucket = { eligibleSeconds: number; measuredSeconds: number; onTargetSeconds: number };
export type CadenceScore = { version: 1; segments: CadenceBucket[]; comboSeconds: number; bestComboSeconds: number; points: number };
export const emptyCadenceScore = (): CadenceScore => ({ version: 1, segments: [], comboSeconds: 0, bestComboSeconds: 0, points: 0 });

export function addCadenceInterval(score: CadenceScore, index: number, target: string | undefined, seconds: number, rpm?: number): CadenceScore {
  const range = numericRange(target);
  const free = target?.trim().toLowerCase() === "libre";
  if ((!range && !free) || seconds <= 0 || !Number.isFinite(seconds)) return score;
  const measured = typeof rpm === "number" && Number.isFinite(rpm) && rpm >= 0;
  const success = measured && (free || Boolean(range && rpm >= range[0] && rpm <= range[1]));
  const comboSeconds = success ? score.comboSeconds + seconds : 0;
  // Integrate across multiplier boundaries, independent of packet frequency.
  let points = score.points;
  if (success) {
    let position = score.comboSeconds;
    while (position < comboSeconds) {
      const multiplier = Math.min(4, 1 + Math.floor(position / 10));
      const end = multiplier === 4 ? comboSeconds : Math.min(comboSeconds, multiplier * 10);
      points += (end - position) * 10 * multiplier;
      position = end;
    }
  }
  const segments = score.segments.slice();
  const previous = segments[index] ?? { eligibleSeconds: 0, measuredSeconds: 0, onTargetSeconds: 0 };
  segments[index] = {
    eligibleSeconds: previous.eligibleSeconds + seconds,
    measuredSeconds: previous.measuredSeconds + (measured ? seconds : 0),
    onTargetSeconds: previous.onTargetSeconds + (success ? seconds : 0)
  };
  return { version: 1, segments, comboSeconds, bestComboSeconds: Math.max(score.bestComboSeconds, comboSeconds), points };
}

export function cadenceSummary(score?: CadenceScore) {
  const total = (score?.segments ?? []).filter(Boolean).reduce((sum, row) => ({ eligibleSeconds: sum.eligibleSeconds + row.eligibleSeconds, measuredSeconds: sum.measuredSeconds + row.measuredSeconds, onTargetSeconds: sum.onTargetSeconds + row.onTargetSeconds }), { eligibleSeconds: 0, measuredSeconds: 0, onTargetSeconds: 0 });
  const percent = total.measuredSeconds ? 100 * total.onTargetSeconds / total.measuredSeconds : undefined;
  const coverage = total.eligibleSeconds ? 100 * total.measuredSeconds / total.eligibleSeconds : 0;
  const grade = percent === undefined ? "—" : percent >= 99.999 ? "S" : percent >= 95 ? "A+" : percent >= 90 ? "A" : percent >= 85 ? "A−" : percent >= 80 ? "B+" : percent >= 75 ? "B" : percent >= 70 ? "B−" : percent >= 60 ? "C" : percent >= 40 ? "D" : "E";
  return { ...total, percent, coverage, grade, provisional: coverage < 80 || total.measuredSeconds < 60 };
}

export function effortSettingsKey(workoutId: string, segments: Segment[], offset: number, mode: string) {
  return JSON.stringify([1, workoutId, mode, offset, segments.map(segment => [segment.minutes, segment.resistance, segment.cadence ?? null])]);
}

export function bestCadenceAttempt(sessions: import("./types").CompletedSession[], key?: string) {
  if (!key) return undefined;
  return sessions.filter(session => session.metrics?.cadenceRecordEligible && session.metrics?.cadenceSettingsKey === key)
    .reduce<import("./types").CompletedSession | undefined>((best, session) => {
      const candidate = cadenceSummary(session.metrics?.cadenceScore);
      if (candidate.provisional || candidate.percent === undefined) return best;
      const previous = cadenceSummary(best?.metrics?.cadenceScore).percent;
      return previous === undefined || candidate.percent > previous ? session : best;
    }, undefined);
}

/** Apply before starting; the resulting cadence is also the scoring target. */
export function withCadenceOffset(workout: import("./types").WorkoutTemplate, offset: number) {
  const safe = Number.isFinite(offset) ? Math.max(-25, Math.min(10, Math.round(offset / 5) * 5)) : 0;
  return { ...workout, segments: workout.segments.map(segment => {
    const range = numericRange(segment.cadence);
    if (!range || !safe) return { ...segment };
    return { ...segment, cadence: range.map(value => Math.max(40, value + safe)).join("–") };
  }) };
}

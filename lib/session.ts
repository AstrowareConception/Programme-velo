import type { TelemetrySample } from "./types";
export { cueSegment } from "./session-cues";

export function compactTelemetry(samples: TelemetrySample[], maxSamples = 180) {
  if (samples.length <= maxSamples) return samples;
  const step = (samples.length - 1) / (maxSamples - 1);
  return Array.from({ length: maxSamples }, (_, i) => samples[Math.round(i * step)]);
}

export function formatClock(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

// Device energy is a cumulative counter, not necessarily reset at session start.
export function counterDelta(values: Array<number | undefined>) {
  const known = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (known.length < 2) return undefined;
  return known.slice(1).reduce((sum, value, index) => sum + Math.max(0, value - known[index]), 0);
}

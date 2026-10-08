import type { BikeTelemetry } from "./bike-adapters";

const fields = ["speedKmh", "cadenceRpm", "powerW", "heartRate"] as const;
type Field = typeof fields[number];
export type BikeLiveMetrics = Partial<Record<Field, { value?: number; at: number }>>;

/** Timestamp each field: a distance-only or heart-rate packet must not revive old speed. */
export function sampleBikeLiveMetrics(previous: BikeLiveMetrics, packet: BikeTelemetry, at: number): BikeLiveMetrics {
  const next = { ...previous };
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(packet, field)) continue;
    const value = packet[field];
    next[field] = { at, value: typeof value === "number" && Number.isFinite(value) && value >= 0 && (field !== "heartRate" || value > 0) ? value : undefined };
  }
  return next;
}

export function currentBikeMetric(metrics: BikeLiveMetrics, field: Field, now: number, connected: boolean): number | undefined {
  const sample = metrics[field];
  const maxAge = field === "heartRate" ? 10_000 : 5_000;
  return connected && sample && now >= sample.at && now - sample.at <= maxAge ? sample.value : undefined;
}

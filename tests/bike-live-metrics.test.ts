import { describe, expect, it } from "vitest";
import { currentBikeMetric, sampleBikeLiveMetrics } from "../lib/bike-live-metrics";

describe("fresh live bike metrics", () => {
  it("preserves a real zero speed and expires each metric independently", () => {
    const values = sampleBikeLiveMetrics({}, { speedKmh: 0, cadenceRpm: 60, powerW: 0, heartRate: 130 }, 1000);
    expect(currentBikeMetric(values, "speedKmh", 6000, true)).toBe(0);
    expect(currentBikeMetric(values, "powerW", 6000, true)).toBe(0);
    expect(currentBikeMetric(values, "cadenceRpm", 6001, true)).toBeUndefined();
    expect(currentBikeMetric(values, "heartRate", 11000, true)).toBe(130);
    expect(currentBikeMetric(values, "heartRate", 11001, true)).toBeUndefined();
  });
  it("does not refresh an old speed with distance or heart-rate packets", () => {
    const initial = sampleBikeLiveMetrics({}, { speedKmh: 25.3, cadenceRpm: 75 }, 1000);
    const distance = sampleBikeLiveMetrics(initial, { distanceM: 1500 }, 4000);
    const heart = sampleBikeLiveMetrics(distance, { heartRate: 145 }, 6500);
    expect(currentBikeMetric(heart, "speedKmh", 6500, true)).toBeUndefined();
    expect(currentBikeMetric(heart, "heartRate", 6500, true)).toBe(145);
    expect(initial).toEqual({ speedKmh: { value: 25.3, at: 1000 }, cadenceRpm: { value: 75, at: 1000 } });
  });
  it("clears explicit invalid measurements without displaying an invented zero", () => {
    const initial = sampleBikeLiveMetrics({}, { speedKmh: 20, heartRate: 130 }, 1000);
    const invalid = sampleBikeLiveMetrics(initial, { speedKmh: NaN, heartRate: 0, cadenceRpm: -10, powerW: Infinity }, 2000);
    for (const field of ["speedKmh", "heartRate", "cadenceRpm", "powerW"] as const) {
      expect(currentBikeMetric(invalid, field, 2000, true)).toBeUndefined();
    }
    expect(currentBikeMetric(sampleBikeLiveMetrics(initial, { speedKmh: undefined }, 2000), "speedKmh", 2000, true)).toBeUndefined();
  });
  it("hides telemetry after disconnect or a backward clock change", () => {
    const values = sampleBikeLiveMetrics({}, { speedKmh: 25 }, 1000);
    expect(currentBikeMetric(values, "speedKmh", 1500, false)).toBeUndefined();
    expect(currentBikeMetric(values, "speedKmh", 999, true)).toBeUndefined();
    expect(currentBikeMetric({}, "speedKmh", 1500, true)).toBeUndefined();
  });
});

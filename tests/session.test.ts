import { describe, expect, it } from "vitest";
import { compactTelemetry, formatClock } from "../lib/session";

describe("session helpers", () => {
  it("compacts telemetry while preserving endpoints", () => {
    const samples = Array.from({ length: 1000 }, (_, i) => ({ t: i, powerW: i }));
    const compacted = compactTelemetry(samples, 100);
    expect(compacted).toHaveLength(100);
    expect(compacted[0].t).toBe(0);
    expect(compacted.at(-1)?.t).toBe(999);
  });

  it("formats workout clocks", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(65)).toBe("01:05");
    expect(formatClock(3599)).toBe("59:59");
  });
});


it("counts session calories relative to the device counter and handles resets", async () => {
  const { counterDelta } = await import("../lib/session");
  expect(counterDelta([300, undefined, 320, 340])).toBe(40);
  expect(counterDelta([300, 320, 0, 10])).toBe(30);
  expect(counterDelta([300])).toBeUndefined();
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { emptyState, currentProgramWeek, sessionsForProgramWeek } from "../lib/data";
import { localDateToIso, localInputDate, localInputDateTime } from "../lib/dates";
import type { CompletedSession } from "../lib/types";

const originalZone = process.env.TZ;
afterEach(() => { process.env.TZ = originalZone; vi.useRealTimers(); });

describe("local calendar dates", () => {
  it.each(["Europe/Paris", "America/Los_Angeles"])("uses local day near midnight in %s", (zone) => {
    process.env.TZ = zone;
    const instant = new Date("2026-10-04T00:15:00");
    expect(localInputDate(instant)).toBe("2026-10-04");
    expect(localInputDateTime(instant)).toBe("2026-10-04T00:15");
    expect(localDateToIso("2026-10-04T00:15")).toBe(instant.toISOString());
    vi.useFakeTimers(); vi.setSystemTime(instant);
    expect(emptyState().profile.startDate).toBe("2026-10-04");
  });

  it("keeps weeks at local midnight across the autumn DST transition", () => {
    process.env.TZ = "Europe/Paris";
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-28T00:00:00"));
    expect(currentProgramWeek("2026-10-21")).toBe(2);
    const state = emptyState(); state.profile.startDate = "2026-10-21";
    state.sessions = ["2026-10-27T23:59:00", "2026-10-28T00:00:00"].map((date, index) => ({ id: String(index), date: new Date(date).toISOString() } as CompletedSession));
    expect(sessionsForProgramWeek(state, 1).map((s) => s.id)).toEqual(["0"]);
    expect(sessionsForProgramWeek(state, 2).map((s) => s.id)).toEqual(["1"]);
  });

  it("rejects invalid dates and nonexistent local times without crashing", () => {
    process.env.TZ = "Europe/Paris";
    expect(localDateToIso("2026-02-30", true)).toBeUndefined();
    expect(localDateToIso("invalid")).toBeUndefined();
    expect(localDateToIso("2026-03-29T02:30")).toBeUndefined();
    expect(localInputDate(new Date(localDateToIso("2026-10-04", true)!))).toBe("2026-10-04");
  });
});

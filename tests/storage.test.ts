import { describe, expect, it } from "vitest";
import { createBackup, normalizeState, parseBackup } from "../lib/storage";

describe("storage migrations", () => {
  it("normalizes old states and fills new preferences", () => {
    const state = normalizeState({
      profile: { name: "Test", startDate: "2026-10-03" },
      sessions: [],
      measurements: []
    });
    expect(state.profile.name).toBe("Test");
    expect(state.preferences?.keepScreenAwake).toBe(true);
    expect(state.preferences?.resistanceOffset).toBe(0);
  });

  it("reads v2 backups and migrates them", () => {
    const result = parseBackup(JSON.stringify({
      format: "veloquest-backup-v2",
      state: {
        profile: { name: "Cycliste", startDate: "2026-10-01" },
        sessions: [],
        measurements: []
      },
      customClimbs: []
    }));
    expect(result.state.profile.name).toBe("Cycliste");
    expect(result.state.preferences?.soundCues).toBe(true);
  });

  it("creates a versioned v3 backup", () => {
    const state = normalizeState({ profile: { name: "", startDate: "2026-10-03" } });
    const backup = createBackup(state, []);
    expect(backup.format).toBe("veloquest-backup-v3");
    expect(backup.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

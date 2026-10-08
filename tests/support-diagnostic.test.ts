import { describe, expect, it } from "vitest";
import { buildSupportDiagnostic, type SupportDiagnosticInput } from "../lib/support-diagnostic";

function input(): SupportDiagnosticInput {
  return {
    buildCommit: "a".repeat(40),
    environment: { width: 1024, height: 768, standalone: true, online: false, secureContext: true, webBluetooth: true, serviceWorker: true, clipboard: false, wakeLock: true },
    pwa: { registered: true, controlled: true, updateWaiting: true, busy: true, cache: { release: "b".repeat(40), ready: false } },
    storage: { hydrated: true, stateSaveFailed: true, routesSaveFailed: false },
    session: { active: false, recoveryAvailable: true },
    bluetooth: { connected: true, connecting: false, inspecting: false }
  };
}

describe("support diagnostic privacy boundary", () => {
  it("reports the opened build separately from the worker without interpreting availability as qualification", () => {
    expect(buildSupportDiagnostic(input(), new Date("2026-10-08T08:00:00Z"))).toMatchObject({
      schema: "veloquest-support-v1", generatedAt: "2026-10-08T08:00:00.000Z",
      app: { openedBuild: "a".repeat(40) },
      environment: { displayMode: "standalone", online: false, viewport: { width: 1024, height: 768 } },
      pwa: { cache: { release: "b".repeat(40), ready: false }, updateWaiting: true },
      storage: { stateSaveFailed: true }, session: { recoveryAvailable: true }, bluetooth: { connected: true }
    });
  });

  it("drops unexpected personal properties at every level, including cache metadata", () => {
    const source = input();
    const privateData = { name: "PRIVATE_NAME", deviceId: "PRIVATE_ID", sessions: ["PRIVATE_HISTORY"], telemetry: { heartRate: "PRIVATE_HEART" }, rawError: "PRIVATE_ERROR", userAgent: "PRIVATE_UA", location: "PRIVATE_GPS" };
    for (const value of [source, source.environment, source.pwa, source.pwa.cache, source.storage, source.session, source.bluetooth]) Object.assign(value!, privateData);
    const before = JSON.stringify(source);
    const report = buildSupportDiagnostic(source);
    expect(JSON.stringify(report)).not.toContain("PRIVATE");
    expect(Object.keys(report)).toEqual(["schema", "generatedAt", "app", "environment", "pwa", "storage", "session", "bluetooth"]);
    expect(JSON.stringify(source)).toBe(before);
    source.storage.stateSaveFailed = false;
    source.pwa.cache!.ready = true;
    expect(report.storage.stateSaveFailed).toBe(true);
    expect(report.pwa.cache!.ready).toBe(false);
  });

  it("does not let untrusted strings or invalid dimensions leak through allowlisted fields", () => {
    const source = input();
    source.buildCommit = "PRIVATE_BUILD";
    source.pwa.cache!.release = "PRIVATE_RELEASE";
    source.storage.stateSaveFailed = "PRIVATE_ERROR" as unknown as boolean;
    source.environment.width = Infinity;
    source.environment.height = NaN;
    const report = buildSupportDiagnostic(source);
    expect(JSON.stringify(report)).not.toContain("PRIVATE");
    expect(report.app.openedBuild).toBe("unknown");
    expect(report.pwa.cache!.release).toBe("unknown");
    expect(report.environment.viewport).toEqual({ width: null, height: null });
  });

  it("keeps an unverified cache unknown rather than reporting it ready", () => {
    const source = input();
    source.pwa.cache = null;
    source.buildCommit = undefined;
    source.environment.standalone = false;
    expect(buildSupportDiagnostic(source)).toMatchObject({ app: { openedBuild: "unknown" }, pwa: { cache: null }, environment: { displayMode: "browser" } });
  });
});

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import assets from "../lib/landscape-photos.json";
import { climbs } from "../lib/routes";
import { photoRouteBindings, routePhotoDate, landscapeDownloadBytes, routePhotoIndex, routePhotos } from "../lib/route-photos";
import { createBackup, normalizeState, parseBackup } from "../lib/storage";

const route = climbs.find(r => r.id === "cagnes-cannes-littoral")!;

describe("documented landscape photos", () => {
  it("binds each illustration to a real place on its exact route, including short sections", () => {
    for (const [id, bindings] of Object.entries(photoRouteBindings)) {
      const native = climbs.find(r => r.id === id)!;
      const stops = routePhotos(native);
      expect(stops).toHaveLength(bindings.length);
      for (const stop of stops) expect(native.places).toContainEqual(expect.objectContaining({ label: stop.place, km: stop.km }));
    }
    expect(routePhotos(climbs.find(r => r.id === "antibes-golfe-juan-short")!).map(p => p.id)).toEqual(["antibes", "golfe-juan"]);
    for (const id of ["gpx-cagnes", "unknown", "toString", "__proto__"]) expect(routePhotos({ ...route, id })).toEqual([]);
    expect(routePhotos({ ...route, places: [] })).toEqual([]);
  });

  it("follows absolute kilometres, keeps the last illustrated place and handles the first upcoming photo", () => {
    const stops = routePhotos(route);
    expect(routePhotoIndex(stops, 0)).toBe(0);
    expect(routePhotoIndex(stops, 9.95)).toBe(0);
    expect(routePhotoIndex(stops, 9.950584)).toBe(1);
    expect(routePhotoIndex(stops, 15)).toBe(1);
    expect(routePhotoIndex(stops, route.distanceKm)).toBe(3);
    for (const km of [-1, NaN, Infinity]) expect(routePhotoIndex(stops, km)).toBe(0);
    const menton = routePhotos(climbs.find(r => r.id === "eze-menton-basse-corniche")!);
    expect(menton[routePhotoIndex(menton, 0)].km).toBeGreaterThan(0);
  });

  it("ships the credited assets intact within the download budget, without original EXIF data", () => {
    let total = 0;
    for (const photo of Object.values(assets)) {
      const bytes = readFileSync(`public${photo.src}`);
      expect(bytes.length).toBe(photo.bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(photo.sha256);
      expect(bytes.subarray(8, 12).toString()).toBe("WEBP");
      expect(bytes.includes(Buffer.from("EXIF"))).toBe(false);
      expect(bytes.length).toBeLessThan(100_000);
      expect(photo.author.length).toBeGreaterThan(2);
      expect(photo.alt.length).toBeGreaterThan(30);
      expect(photo.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(photo.licenseUrl).toMatch(/^https:\/\//);
      expect(photo.originalSha256).toMatch(/^[a-f0-9]{64}$/);
      total += bytes.length;
    }
    expect(total).toBeLessThan(600_000);
    expect(landscapeDownloadBytes).toBe(total);
    expect(routePhotoDate("2007-08")).toBe("août 2007");
    expect(routePhotoDate("2024-09-01")).toBe("1 sept. 2024");
  });

  it("preserves photo choices, journal, Voyage and GPX across old and current backups", () => {
    const session = { id: "old", templateId: "recovery-30", date: "2026-10-01T12:00:00Z", duration: 30, points: 1, xp: 35, intensity: "easy", kind: "recovery", bonus: false };
    const state = normalizeState({ profile: { name: "QA", startDate: "2026-10-01" }, sessions: [session], measurements: [{ id: "m", date: "2026-10-01", weight: 100 }], voyage: { routeId: route.id, minutes: 30 }, preferences: { showRoutePhotos: false } });
    const custom = { ...route, id: "gpx-cagnes" };
    const restored = parseBackup(JSON.stringify(createBackup(state, [custom])));
    expect(restored.state).toEqual(state);
    expect(restored.customClimbs).toEqual([custom]);
    expect(restored.state.sessions).toEqual([session]);
    for (const value of [undefined, "false", 0]) expect(normalizeState({ preferences: { showRoutePhotos: value } }).preferences?.showRoutePhotos).toBe(true);
    expect(parseBackup(JSON.stringify({ format: "veloquest-backup-v2", state: { sessions: [session] } })).state.preferences?.showRoutePhotos).toBe(true);
  });
});

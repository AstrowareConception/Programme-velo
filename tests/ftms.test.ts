import { describe, expect, it } from "vitest";
import { parseIndoorBikeData } from "../lib/ftms";

describe("parseIndoorBikeData", () => {
  it("parses speed, cadence, distance, resistance, power and heart rate", () => {
    const flags =
      (1 << 2) |
      (1 << 4) |
      (1 << 5) |
      (1 << 6) |
      (1 << 9);

    const buffer = new ArrayBuffer(2 + 2 + 2 + 3 + 2 + 2 + 1);
    const view = new DataView(buffer);
    let o = 0;
    view.setUint16(o, flags, true); o += 2;
    view.setUint16(o, 2534, true); o += 2; // 25.34 km/h
    view.setUint16(o, 176, true); o += 2; // 88 rpm
    view.setUint8(o++, 0x39); view.setUint8(o++, 0x30); view.setUint8(o++, 0x00); // 12345 m
    view.setInt16(o, 230, true); o += 2; // level 23
    view.setInt16(o, 215, true); o += 2;
    view.setUint8(o, 148);

    expect(parseIndoorBikeData(view)).toEqual({
      speedKmh: 25.34,
      cadenceRpm: 88,
      distanceM: 12345,
      resistance: 23,
      powerW: 215,
      heartRate: 148
    });
  });

  it("does not require optional fields", () => {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint16(0, 0, true);
    view.setUint16(2, 1840, true);
    expect(parseIndoorBikeData(view)).toEqual({ speedKmh: 18.4 });
  });
});


it("parses FTMS averages, energy, MET and timing", () => {
  const flags =
    (1 << 0) |
    (1 << 1) |
    (1 << 3) |
    (1 << 7) |
    (1 << 8) |
    (1 << 10) |
    (1 << 11) |
    (1 << 12);

  const buffer = new ArrayBuffer(2 + 2 + 2 + 2 + 5 + 1 + 2 + 2);
  const view = new DataView(buffer);
  let o = 0;
  view.setUint16(o, flags, true); o += 2;
  view.setUint16(o, 2145, true); o += 2; // avg speed
  view.setUint16(o, 164, true); o += 2; // avg cadence 82
  view.setInt16(o, 187, true); o += 2; // avg power
  view.setUint16(o, 321, true); o += 2; // total kcal
  view.setUint16(o, 650, true); o += 2; // kcal/h
  view.setUint8(o, 11); o += 1; // kcal/min
  view.setUint8(o, 85); o += 1; // 8.5 MET
  view.setUint16(o, 1800, true); o += 2;
  view.setUint16(o, 900, true);

  expect(parseIndoorBikeData(view)).toMatchObject({
    avgSpeedKmh: 21.45,
    avgCadenceRpm: 82,
    avgPowerW: 187,
    totalEnergyKcal: 321,
    energyPerHourKcal: 650,
    energyPerMinuteKcal: 11,
    metabolicEquivalent: 8.5,
    elapsedSeconds: 1800,
    remainingSeconds: 900
  });
});


it("does not misread later fields after a truncated flagged energy block", () => {
  const view = new DataView(new ArrayBuffer(5));
  view.setUint16(0, (1 << 0) | (1 << 8) | (1 << 9), true);
  expect(parseIndoorBikeData(view)).toEqual({});
  expect(parseIndoorBikeData(new DataView(new ArrayBuffer(1)))).toEqual({});
});

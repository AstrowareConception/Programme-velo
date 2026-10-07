import { describe, expect, it, vi } from "vitest";
import { bikeAdapterById, bikeAdapters, type BikeConnection } from "../lib/bike-adapters";
import {
  canVerifyVeloQuestResistance,
  knownBikeProfiles,
  matchesResistanceRange,
  resistanceQualificationFor
} from "../lib/bike-qualification";

function connection(overrides: Partial<BikeConnection> = {}): BikeConnection {
  return {
    adapterId: "ftms",
    deviceName: "Unknown brand",
    capabilities: {
      ftms: true,
      indoorBikeData: true,
      resistanceRange: { min: 1, max: 32, increment: 1 },
      supportsResistanceTarget: true,
      supportsPowerTarget: false,
      controlPoint: true,
      controlPointStatus: "ready"
    },
    requestControl: vi.fn(async () => {}),
    setResistance: vi.fn(async () => {}),
    disconnect: vi.fn(),
    ...overrides
  };
}

describe("bike adapter registry", () => {
  it("uses FTMS as the first generic adapter without a brand-specific adapter", () => {
    expect(bikeAdapters.map((adapter) => adapter.id)).toEqual(["ftms"]);
    expect(bikeAdapterById("ftms")?.label).toBe("Bluetooth FTMS");
    expect(bikeAdapterById("unknown")).toBeUndefined();
  });
});

describe("bike qualification", () => {
  it("recognizes the physically qualified TOPUTURE profile only when capabilities match", () => {
    for (const deviceName of ["TOPUTURE TEB5", "Toputure TBE5"]) {
      const result = resistanceQualificationFor(connection({ deviceName }));
      expect(result).toMatchObject({
        profileId: "toputure-teb5-ftms",
        knownModel: true,
        canVerifyMapping: true,
        mappingVerified: true,
        autoRequestControl: true
      });
    }
  });

  it("keeps an unknown 1–32 FTMS bike manual until the user verifies its mapping", () => {
    const result = resistanceQualificationFor(connection({ deviceName: "Another Bike 32" }));
    expect(result).toEqual({
      knownModel: false,
      canVerifyMapping: true,
      mappingVerified: false,
      autoRequestControl: false
    });
  });

  it("does not trust a brand name when the adapter or resistance capabilities differ", () => {
    expect(resistanceQualificationFor(connection({
      adapterId: "vendor-x",
      deviceName: "TOPUTURE TEB5"
    })).autoRequestControl).toBe(false);

    expect(resistanceQualificationFor(connection({
      deviceName: "TOPUTURE TEB5",
      capabilities: {
        ...connection().capabilities,
        resistanceRange: { min: 1, max: 16, increment: 1 }
      }
    })).autoRequestControl).toBe(false);
  });

  it("requires control methods as well as advertised capabilities", () => {
    expect(canVerifyVeloQuestResistance(connection({ requestControl: undefined }))).toBe(false);
    expect(canVerifyVeloQuestResistance(connection({ setResistance: undefined }))).toBe(false);
    expect(canVerifyVeloQuestResistance(connection({
      capabilities: { ...connection().capabilities, supportsResistanceTarget: false }
    }))).toBe(false);
  });

  it("matches only the explicit VeloQuest 1–32 direct mapping", () => {
    expect(matchesResistanceRange({ min: 1, max: 32, increment: 1 })).toBe(true);
    expect(matchesResistanceRange({ min: 0, max: 100, increment: 1 })).toBe(false);
    expect(matchesResistanceRange({ min: 1, max: 32, increment: 0.5 })).toBe(false);
    expect(knownBikeProfiles).toHaveLength(1);
  });
});

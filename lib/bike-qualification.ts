import type { BikeConnection, ResistanceRange } from "./bike-adapters";

export const VELOQUEST_RESISTANCE_RANGE: ResistanceRange = {
  min: 1,
  max: 32,
  increment: 1
};

export type ResistanceQualification = {
  profileId?: string;
  profileLabel?: string;
  knownModel: boolean;
  canVerifyMapping: boolean;
  mappingVerified: boolean;
  autoRequestControl: boolean;
};

type KnownBikeProfile = {
  id: string;
  label: string;
  adapterId: string;
  namePatterns: readonly RegExp[];
  resistanceMapping: "veloquest-1-32";
};

export const knownBikeProfiles: readonly KnownBikeProfile[] = [
  {
    id: "toputure-teb5-ftms",
    label: "TOPUTURE TEB5",
    adapterId: "ftms",
    // Some observed Bluetooth labels use the historical TBE5 spelling.
    namePatterns: [/^toputure t(?:eb|be)5$/i],
    resistanceMapping: "veloquest-1-32"
  }
];

export function matchesResistanceRange(
  range: ResistanceRange | undefined,
  expected: ResistanceRange = VELOQUEST_RESISTANCE_RANGE
) {
  return Boolean(
    range &&
    range.min === expected.min &&
    range.max === expected.max &&
    range.increment === expected.increment
  );
}

export function canVerifyVeloQuestResistance(connection: BikeConnection) {
  return Boolean(
    matchesResistanceRange(connection.capabilities.resistanceRange) &&
    connection.capabilities.supportsResistanceTarget &&
    connection.requestControl &&
    connection.setResistance
  );
}

export function resistanceQualificationFor(connection: BikeConnection): ResistanceQualification {
  const canVerifyMapping = canVerifyVeloQuestResistance(connection);
  if (!canVerifyMapping) {
    return {
      knownModel: false,
      canVerifyMapping: false,
      mappingVerified: false,
      autoRequestControl: false
    };
  }

  const normalizedName = connection.deviceName.trim();
  const profile = knownBikeProfiles.find((candidate) =>
    candidate.adapterId === connection.adapterId &&
    candidate.namePatterns.some((pattern) => pattern.test(normalizedName))
  );

  if (!profile) {
    return {
      knownModel: false,
      canVerifyMapping: true,
      mappingVerified: false,
      autoRequestControl: false
    };
  }

  return {
    profileId: profile.id,
    profileLabel: profile.label,
    knownModel: true,
    canVerifyMapping: true,
    mappingVerified: profile.resistanceMapping === "veloquest-1-32",
    autoRequestControl: profile.resistanceMapping === "veloquest-1-32"
  };
}

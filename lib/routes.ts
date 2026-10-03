import type { WorkoutTemplate } from "./types";

export type ClimbPoint = {
  km: number;
  elevation: number;
  grade: number;
};

export type ClimbChallenge = {
  id: string;
  name: string;
  subtitle: string;
  region: string;
  distanceKm: number;
  elevationGainM: number;
  avgGrade: number;
  maxGrade: number;
  startElevationM: number;
  finishElevationM: number;
  xp: number;
  points: number;
  coordinates: [number, number][];
  profile: ClimbPoint[];
  note: string;
};

export const climbs: ClimbChallenge[] = [
  {
    id: "alpe-dhuez",
    name: "Alpe d’Huez",
    subtitle: "Les 21 virages",
    region: "Oisans · Isère",
    distanceKm: 14.454,
    elevationGainM: 1121,
    avgGrade: 7.9,
    maxGrade: 14,
    startElevationM: 717,
    finishElevationM: 1860,
    xp: 300,
    points: 5,
    coordinates: [
      [45.0558, 6.0303],
      [45.0615, 6.0390],
      [45.0685, 6.0498],
      [45.0788, 6.0552],
      [45.0875, 6.0610],
      [45.0982, 6.0687]
    ],
    profile: [
      { km: 0, elevation: 717, grade: 0 },
      { km: 1.5, elevation: 845, grade: 8.5 },
      { km: 3.2, elevation: 1015, grade: 10.0 },
      { km: 5.0, elevation: 1155, grade: 7.8 },
      { km: 7.0, elevation: 1315, grade: 8.0 },
      { km: 9.0, elevation: 1470, grade: 7.8 },
      { km: 11.0, elevation: 1620, grade: 7.5 },
      { km: 12.8, elevation: 1740, grade: 6.7 },
      { km: 14.454, elevation: 1860, grade: 7.3 }
    ],
    note: "Distance, dénivelé et pentes globales officiels. Le profil intermédiaire est une approximation d’entraînement ; un import GPX permettra ensuite une reproduction plus fine."
  },
  {
    id: "ventoux-bedoin",
    name: "Mont Ventoux",
    subtitle: "Versant Bédoin",
    region: "Vaucluse · Provence",
    distanceKm: 21,
    elevationGainM: 1600,
    avgGrade: 7.5,
    maxGrade: 12,
    startElevationM: 310,
    finishElevationM: 1910,
    xp: 420,
    points: 6,
    coordinates: [
      [44.1244, 5.1806],
      [44.1310, 5.2010],
      [44.1400, 5.2290],
      [44.1495, 5.2530],
      [44.1605, 5.2710],
      [44.1740, 5.2783]
    ],
    profile: [
      { km: 0, elevation: 310, grade: 0 },
      { km: 4, elevation: 500, grade: 4.8 },
      { km: 6, elevation: 650, grade: 7.5 },
      { km: 9, elevation: 930, grade: 9.3 },
      { km: 12, elevation: 1210, grade: 9.3 },
      { km: 15, elevation: 1480, grade: 9.0 },
      { km: 17, elevation: 1580, grade: 5.0 },
      { km: 19, elevation: 1745, grade: 8.3 },
      { km: 21, elevation: 1910, grade: 8.3 }
    ],
    note: "Chiffres globaux issus du Parc naturel régional du Mont-Ventoux. Profil intermédiaire simplifié pour l’entraînement."
  },
  {
    id: "tourmalet-est",
    name: "Col du Tourmalet",
    subtitle: "Versant Est depuis Campan",
    region: "Hautes-Pyrénées",
    distanceKm: 22.5,
    elevationGainM: 1268,
    avgGrade: 6,
    maxGrade: 9,
    startElevationM: 660,
    finishElevationM: 2115,
    xp: 390,
    points: 6,
    coordinates: [
      [43.0175, 0.1783],
      [42.9930, 0.1900],
      [42.9700, 0.1870],
      [42.9460, 0.1760],
      [42.9250, 0.1600],
      [42.9083, 0.1450]
    ],
    profile: [
      { km: 0, elevation: 660, grade: 0 },
      { km: 4, elevation: 835, grade: 4.4 },
      { km: 7, elevation: 1020, grade: 6.2 },
      { km: 10, elevation: 1215, grade: 6.5 },
      { km: 13, elevation: 1410, grade: 6.5 },
      { km: 16, elevation: 1610, grade: 6.7 },
      { km: 19, elevation: 1815, grade: 6.8 },
      { km: 21, elevation: 1975, grade: 8.0 },
      { km: 22.5, elevation: 2115, grade: 9.0 }
    ],
    note: "Chiffres globaux issus de Hautes-Pyrénées Tourisme. Profil intermédiaire simplifié pour l’entraînement."
  }
];

export function resistanceForGrade(grade: number) {
  if (grade <= 1) return 9;
  if (grade <= 3) return 13;
  if (grade <= 5) return 17;
  if (grade <= 6.5) return 20;
  if (grade <= 8) return 23;
  if (grade <= 9.5) return 25;
  if (grade <= 11) return 27;
  return 29;
}


export function climbToWorkout(climb: ClimbChallenge): WorkoutTemplate {
  const segments = climb.profile.slice(1).map((point, index) => {
    const previous = climb.profile[index];
    const distance = Math.max(0.2, point.km - previous.km);
    // Baseline simulation at ~15 km/h. With FTMS connected, route progress
    // is based on actual distance instead of this time estimate.
    const minutes = Math.max(2, Math.round((distance / 15) * 60));
    const level = resistanceForGrade(point.grade);
    return {
      label: `${point.km.toFixed(1)} km · ${point.grade.toFixed(1)} %`,
      minutes,
      resistance: String(level),
      rpe: point.grade >= 9 ? "8–9" : point.grade >= 7 ? "7–8" : point.grade >= 5 ? "6–7" : "5–6",
      cadence: point.grade >= 8 ? "65–80" : "75–90"
    };
  });

  return {
    id: `climb-${climb.id}`,
    name: climb.name,
    tagline: climb.subtitle,
    kind: "hills",
    duration: segments.reduce((sum, segment) => sum + segment.minutes, 0),
    points: climb.points,
    xp: climb.xp,
    intensity: "hard",
    description: climb.note,
    segments
  };
}

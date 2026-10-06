import type { WorkoutTemplate } from "./types";
import { scenicRoutes } from "./scenic-routes";
import { explorationRoutes } from "./exploration-routes";
import { shortRoutes } from "./short-rides";
import { napoleonRoutes } from "./napoleon-routes";
import { napoleonNorthRoutes } from "./napoleon-north-routes";
import { esterelRoutes } from "./esterel-routes";
import { alsaceRoutes } from "./alsace-routes";
import { napoleonShortRoutes } from "./napoleon-short-routes";
import { enrichRouteDescription } from "./route-descriptions";

export type RouteCategory = "climb" | "stage" | "scenic" | "imported";
export type RouteDifficulty = 1 | 2 | 3 | 4 | 5;

export type ClimbPoint = {
  km: number;
  elevation: number;
  grade: number;
};

export type RoutePlace = { label: string; landmark: string; km: number };

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
  coordinateKm?: number[];
  profile: ClimbPoint[];
  note: string;
  category?: RouteCategory;
  difficulty?: RouteDifficulty;
  effort?: "easy" | "moderate" | "hard";
  parentRouteId?: string;
  tags?: string[];
  featured?: boolean;
  sourceLabel?: string;
  sourceUrl?: string;
  scenery?: string;
  highlights?: string[];
  places?: RoutePlace[];
  placesNote?: string;
  provenance?: { gpxUrl: string; gpxSha256: string; altitudeSource: string; checkedOn: string; profileStepM: number; section?: string; trackName?: string };
};

const nativeRoutes: ClimbChallenge[] = [
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
    note: "Distance, dénivelé et pentes globales officiels. Le profil intermédiaire est une approximation d’entraînement ; un import GPX permettra ensuite une reproduction plus fine.",
    category: "climb",
    difficulty: 4,
    tags: ["Tour de France", "Alpes", "mythique", "grimpe"],
    featured: true,
    sourceLabel: "Alpe d’Huez",
    sourceUrl: "https://www.alpedhuez.com/fr/activites/activites-ete/velo/les-21-virages/"
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
    note: "Chiffres globaux issus du Parc naturel régional du Mont-Ventoux. Profil intermédiaire simplifié pour l’entraînement.",
    category: "climb",
    difficulty: 5,
    tags: ["Tour de France", "Provence", "mythique", "long"],
    featured: true,
    sourceLabel: "Parc naturel régional du Mont-Ventoux",
    sourceUrl: "https://www.parcduventoux.fr/a-voir-a-faire/decouvrir-en-douceur/decouvrir-le-ventoux-a-velo/"
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
    note: "Chiffres globaux issus de Hautes-Pyrénées Tourisme. Profil intermédiaire simplifié pour l’entraînement.",
    category: "climb",
    difficulty: 4,
    tags: ["Tour de France", "Pyrénées", "mythique", "long"],
    featured: true,
    sourceLabel: "Hautes-Pyrénées Tourisme",
    sourceUrl: "https://www.tourisme-hautes-pyrenees.com/voyage-aux-pyrenees/les-grands-sites/col-tourmalet/"
  },
  {
    id: "galibier-valloire",
    name: "Col du Galibier",
    subtitle: "Versant Valloire",
    region: "Maurienne · Savoie",
    distanceKm: 17,
    elevationGainM: 1212,
    avgGrade: 7.2,
    maxGrade: 12,
    startElevationM: 1430,
    finishElevationM: 2642,
    xp: 390,
    points: 6,
    coordinates: [
      [45.1654, 6.4295],
      [45.1395, 6.4317],
      [45.1168, 6.4286],
      [45.0952, 6.4197],
      [45.0781, 6.4125],
      [45.0642, 6.4078]
    ],
    profile: [
      { km: 0, elevation: 1430, grade: 0 },
      { km: 2.5, elevation: 1580, grade: 6.0 },
      { km: 5, elevation: 1740, grade: 6.4 },
      { km: 7.5, elevation: 1910, grade: 6.8 },
      { km: 10, elevation: 2080, grade: 6.8 },
      { km: 12.5, elevation: 2250, grade: 6.8 },
      { km: 15, elevation: 2440, grade: 7.6 },
      { km: 16.2, elevation: 2540, grade: 8.3 },
      { km: 17, elevation: 2642, grade: 12.0 }
    ],
    note: "Distance, dénivelé, pente moyenne et pente maximale officiels depuis Valloire. Profil intermédiaire simplifié pour l’entraînement.",
    category: "climb",
    difficulty: 5,
    tags: ["Tour de France", "Alpes", "haute montagne", "mythique"],
    featured: true,
    sourceLabel: "Maurienne Tourisme",
    sourceUrl: "https://www.maurienne-tourisme.com/visiter_bouger/col-du-galibier-point-de-vue-93471/"
  },
  {
    id: "madeleine-maurienne",
    name: "Col de la Madeleine",
    subtitle: "Versant La Chambre",
    region: "Maurienne · Savoie",
    distanceKm: 19.3,
    elevationGainM: 1520,
    avgGrade: 8.0,
    maxGrade: 10,
    startElevationM: 472,
    finishElevationM: 2000,
    xp: 430,
    points: 6,
    coordinates: [
      [45.3570, 6.3020],
      [45.3770, 6.3250],
      [45.3935, 6.3440],
      [45.4140, 6.3605],
      [45.4310, 6.3730],
      [45.4351, 6.3758]
    ],
    profile: [
      { km: 0, elevation: 472, grade: 0 },
      { km: 2.5, elevation: 680, grade: 8.3 },
      { km: 5, elevation: 905, grade: 9.0 },
      { km: 7.5, elevation: 1120, grade: 8.6 },
      { km: 10, elevation: 1290, grade: 6.8 },
      { km: 12.5, elevation: 1470, grade: 7.2 },
      { km: 15, elevation: 1665, grade: 7.8 },
      { km: 17.5, elevation: 1850, grade: 7.4 },
      { km: 19.3, elevation: 2000, grade: 8.3 }
    ],
    note: "Distance et dénivelé officiels depuis La Chambre ; l’office annonce une montée proche de 8 % de moyenne avec des passages approchant 10 %. Profil intermédiaire simplifié.",
    category: "climb",
    difficulty: 5,
    tags: ["Tour de France", "Alpes", "hors catégorie", "long"],
    featured: true,
    sourceLabel: "Maurienne Tourisme",
    sourceUrl: "https://www.maurienne-tourisme.com/visiter_bouger/montee-cyclo-du-col-de-la-madeleine-versant-maurienne-76577/"
  },
  {
    id: "croix-de-fer-maurienne",
    name: "Col de la Croix-de-Fer",
    subtitle: "Depuis Saint-Jean-de-Maurienne",
    region: "Maurienne · Savoie",
    distanceKm: 29.3,
    elevationGainM: 1620,
    avgGrade: 5.5,
    maxGrade: 10,
    startElevationM: 570,
    finishElevationM: 2067,
    xp: 480,
    points: 7,
    coordinates: [
      [45.2770, 6.3445],
      [45.2390, 6.3110],
      [45.2230, 6.2780],
      [45.2200, 6.2390],
      [45.2250, 6.2140],
      [45.2280, 6.2030]
    ],
    profile: [
      { km: 0, elevation: 570, grade: 0 },
      { km: 5, elevation: 820, grade: 5.0 },
      { km: 10, elevation: 1045, grade: 4.5 },
      { km: 15, elevation: 1235, grade: 3.8 },
      { km: 19, elevation: 1435, grade: 5.0 },
      { km: 22, elevation: 1585, grade: 5.0 },
      { km: 25, elevation: 1770, grade: 6.2 },
      { km: 27.5, elevation: 1940, grade: 6.8 },
      { km: 29.3, elevation: 2067, grade: 7.1 }
    ],
    note: "Distance et dénivelé officiels. La montée est très longue et moins régulière que son pourcentage moyen ne le laisse penser ; profil intermédiaire simplifié.",
    category: "climb",
    difficulty: 5,
    tags: ["Tour de France", "Alpes", "très long", "haute montagne"],
    featured: true,
    sourceLabel: "Maurienne Tourisme",
    sourceUrl: "https://www.maurienne-tourisme.com/visiter_bouger/montee-cyclo-du-col-de-la-croix-de-fer-74643/"
  },
  {
    id: "glandon-cuines",
    name: "Col du Glandon",
    subtitle: "Depuis Saint-Étienne-de-Cuines",
    region: "Maurienne · Savoie",
    distanceKm: 19.9,
    elevationGainM: 1439,
    avgGrade: 7.0,
    maxGrade: 11,
    startElevationM: 485,
    finishElevationM: 1924,
    xp: 430,
    points: 6,
    coordinates: [
      [45.3423, 6.2913],
      [45.3050, 6.2820],
      [45.2750, 6.2590],
      [45.2450, 6.2250],
      [45.2360, 6.1870],
      [45.2405, 6.1758]
    ],
    profile: [
      { km: 0, elevation: 485, grade: 0 },
      { km: 3, elevation: 700, grade: 7.2 },
      { km: 6, elevation: 930, grade: 7.7 },
      { km: 9, elevation: 1125, grade: 6.5 },
      { km: 11.5, elevation: 1190, grade: 2.6 },
      { km: 14, elevation: 1380, grade: 7.6 },
      { km: 16.5, elevation: 1580, grade: 8.0 },
      { km: 18, elevation: 1745, grade: 11.0 },
      { km: 19.9, elevation: 1924, grade: 9.4 }
    ],
    note: "Distance, dénivelé et moyenne issus de Maurienne Tourisme. Le replat masque un final de 3 km à plus de 10 % ; profil intermédiaire simplifié.",
    category: "climb",
    difficulty: 5,
    tags: ["Tour de France", "Alpes", "final raide", "mythique"],
    featured: false,
    sourceLabel: "Maurienne Tourisme",
    sourceUrl: "https://www.maurienne-tourisme.com/visiter_bouger/montee-cyclo-du-col-du-glandon-76554/"
  },
  {
    id: "iseran-bonneval",
    name: "Col de l’Iseran",
    subtitle: "Depuis Bonneval-sur-Arc",
    region: "Haute-Maurienne · Savoie",
    distanceKm: 13.4,
    elevationGainM: 915,
    avgGrade: 7.5,
    maxGrade: 10,
    startElevationM: 1849,
    finishElevationM: 2764,
    xp: 330,
    points: 5,
    coordinates: [
      [45.3710, 7.0460],
      [45.3900, 7.0230],
      [45.4050, 7.0030],
      [45.4170, 6.9850],
      [45.4238, 6.9778]
    ],
    profile: [
      { km: 0, elevation: 1849, grade: 0 },
      { km: 2, elevation: 1980, grade: 6.6 },
      { km: 4, elevation: 2125, grade: 7.3 },
      { km: 6, elevation: 2265, grade: 7.0 },
      { km: 8, elevation: 2410, grade: 7.3 },
      { km: 10, elevation: 2545, grade: 6.8 },
      { km: 12, elevation: 2685, grade: 7.0 },
      { km: 13.4, elevation: 2764, grade: 5.6 }
    ],
    note: "Distance, dénivelé et pente moyenne officiels depuis Bonneval-sur-Arc. Profil intermédiaire simplifié.",
    category: "climb",
    difficulty: 4,
    tags: ["Alpes", "haute altitude", "mythique", "court et dense"],
    featured: false,
    sourceLabel: "Maurienne Tourisme",
    sourceUrl: "https://www.maurienne-tourisme.com/velo/velo-de-route/itineraires/"
  },
  {
    id: "enclave-papes-loop",
    name: "Tour de l’Enclave des Papes",
    subtitle: "Boucle vallonnée",
    region: "Valréas · Vaucluse",
    distanceKm: 41.38,
    elevationGainM: 552,
    avgGrade: 1.3,
    maxGrade: 7,
    startElevationM: 245,
    finishElevationM: 245,
    xp: 250,
    points: 4,
    coordinates: [
      [44.3840, 4.9900],
      [44.4050, 5.0200],
      [44.4300, 5.0500],
      [44.4200, 5.1000],
      [44.3850, 5.0800],
      [44.3600, 5.0300],
      [44.3840, 4.9900]
    ],
    profile: [
      { km: 0, elevation: 245, grade: 0 },
      { km: 5, elevation: 305, grade: 1.2 },
      { km: 9, elevation: 420, grade: 2.9 },
      { km: 13, elevation: 300, grade: -3.0 },
      { km: 18, elevation: 390, grade: 1.8 },
      { km: 22, elevation: 265, grade: -3.1 },
      { km: 27, elevation: 350, grade: 1.7 },
      { km: 31, elevation: 220, grade: -3.3 },
      { km: 35, elevation: 315, grade: 2.4 },
      { km: 38, elevation: 275, grade: -1.3 },
      { km: 41.38, elevation: 245, grade: -0.9 }
    ],
    note: "Distance et D+ officiels. Profil intermédiaire simplifié pour reproduire une succession de bosses et descentes, pas un relevé GPX exact.",
    category: "stage",
    difficulty: 3,
    tags: ["Provence", "vallonné", "boucle", "multi-bosses", "intermédiaire"],
    featured: true,
    sourceLabel: "Provence Cycling",
    sourceUrl: "https://www.provence-cycling.co.uk/equipment/enclave-des-papes/cycling-itinerary-tour-of-the-popes-enclave-by-bike/provence-4731000-2.html"
  },
  {
    id: "vaison-medieval-loop",
    name: "Villages médiévaux de Vaison",
    subtitle: "Bosses courtes & récupérations",
    region: "Vaison-la-Romaine · Vaucluse",
    distanceKm: 22.87,
    elevationGainM: 338,
    avgGrade: 1.5,
    maxGrade: 7,
    startElevationM: 205,
    finishElevationM: 205,
    xp: 190,
    points: 3,
    coordinates: [
      [44.2420, 5.0730],
      [44.2600, 5.0950],
      [44.2750, 5.1150],
      [44.2600, 5.1350],
      [44.2350, 5.1150],
      [44.2200, 5.0900],
      [44.2420, 5.0730]
    ],
    profile: [
      { km: 0, elevation: 205, grade: 0 },
      { km: 3, elevation: 285, grade: 2.7 },
      { km: 5.5, elevation: 220, grade: -2.6 },
      { km: 8.5, elevation: 355, grade: 4.5 },
      { km: 11, elevation: 255, grade: -4.0 },
      { km: 14, elevation: 330, grade: 2.5 },
      { km: 16.5, elevation: 245, grade: -3.4 },
      { km: 19, elevation: 300, grade: 2.2 },
      { km: 22.87, elevation: 205, grade: -2.5 }
    ],
    note: "Distance et D+ officiels. Profil d’entraînement simplifié avec trois bosses courtes séparées par des descentes.",
    category: "stage",
    difficulty: 2,
    tags: ["Provence", "court", "vallonné", "débutant+", "récupération"],
    featured: true,
    sourceLabel: "Provence Cycling",
    sourceUrl: "https://www.provence-cycling.co.uk/equipment/vaison-la-romaine/cycling-itinerary-medieval-villages-around-vaison-la-romaine/provence-4693063-2.html"
  },
  {
    id: "uchaux-loop",
    name: "Tour du Massif d’Uchaux",
    subtitle: "Long faux-plat & bosses boisées",
    region: "Bollène · Vaucluse",
    distanceKm: 42.75,
    elevationGainM: 411,
    avgGrade: 1.0,
    maxGrade: 6,
    startElevationM: 70,
    finishElevationM: 70,
    xp: 230,
    points: 4,
    coordinates: [
      [44.2800, 4.7500],
      [44.2400, 4.7700],
      [44.2200, 4.8200],
      [44.2550, 4.8600],
      [44.3000, 4.8400],
      [44.3200, 4.7900],
      [44.2800, 4.7500]
    ],
    profile: [
      { km: 0, elevation: 70, grade: 0 },
      { km: 6, elevation: 125, grade: 0.9 },
      { km: 10, elevation: 165, grade: 1.0 },
      { km: 14, elevation: 95, grade: -1.8 },
      { km: 19, elevation: 155, grade: 1.2 },
      { km: 24, elevation: 85, grade: -1.4 },
      { km: 29, elevation: 160, grade: 1.5 },
      { km: 34, elevation: 105, grade: -1.1 },
      { km: 38, elevation: 150, grade: 1.1 },
      { km: 42.75, elevation: 70, grade: -1.7 }
    ],
    note: "Distance et D+ officiels. Profil intermédiaire simplifié, conçu comme une sortie roulante ponctuée de petites bosses.",
    category: "stage",
    difficulty: 2,
    tags: ["Provence", "roulant", "boisé", "endurance", "facile"],
    featured: false,
    sourceLabel: "Provence Cycling",
    sourceUrl: "https://www.provence-cycling.co.uk/equipment/rhone-valley/cycle-route-the-massif-duchaux-by-bike/provence-4619075-2.html"
  },
  {
    id: "sorgue-velleron-loop",
    name: "Velleron – L’Isle-sur-la-Sorgue",
    subtitle: "Sortie récupération vallonnée",
    region: "Pays des Sorgues · Vaucluse",
    distanceKm: 35.38,
    elevationGainM: 209,
    avgGrade: 0.6,
    maxGrade: 5,
    startElevationM: 70,
    finishElevationM: 70,
    xp: 170,
    points: 3,
    coordinates: [
      [43.9580, 5.0300],
      [43.9400, 5.0000],
      [43.9150, 5.0100],
      [43.9200, 5.0550],
      [43.9450, 5.0750],
      [43.9580, 5.0300]
    ],
    profile: [
      { km: 0, elevation: 70, grade: 0 },
      { km: 5, elevation: 105, grade: 0.7 },
      { km: 9, elevation: 75, grade: -0.8 },
      { km: 14, elevation: 145, grade: 1.4 },
      { km: 18, elevation: 85, grade: -1.5 },
      { km: 23, elevation: 125, grade: 0.8 },
      { km: 28, elevation: 80, grade: -0.9 },
      { km: 32, elevation: 110, grade: 0.8 },
      { km: 35.38, elevation: 70, grade: -1.2 }
    ],
    note: "Distance et D+ officiels. Profil de simulation doux, adapté aux jours où l’objectif est de rouler longtemps sans forte contrainte.",
    category: "stage",
    difficulty: 2,
    tags: ["Provence", "récupération", "roulant", "facile", "endurance"],
    featured: false,
    sourceLabel: "Provence Cycling",
    sourceUrl: "https://www.provence-cycling.co.uk/equipment/avignon/11-from-mont-ventoux-to-lisle-sur-la-sorgue/provence-4618617-2.html"
  },
  {
    id: "nice-corniches-loop",
    name: "Tour des Corniches",
    subtitle: "Mer, montée, descente, Col d’Èze",
    region: "Nice · Côte d’Azur",
    distanceKm: 62.9,
    elevationGainM: 905,
    avgGrade: 1.4,
    maxGrade: 8,
    startElevationM: 15,
    finishElevationM: 15,
    xp: 360,
    points: 5,
    coordinates: [
      [43.6950, 7.2650],
      [43.7050, 7.3150],
      [43.7300, 7.3650],
      [43.7400, 7.4250],
      [43.7350, 7.5000],
      [43.7600, 7.4450],
      [43.7550, 7.3650],
      [43.7300, 7.3100],
      [43.6950, 7.2650]
    ],
    profile: [
      { km: 0, elevation: 15, grade: 0 },
      { km: 8, elevation: 120, grade: 1.3 },
      { km: 15, elevation: 35, grade: -1.2 },
      { km: 24, elevation: 110, grade: 0.8 },
      { km: 31, elevation: 25, grade: -1.2 },
      { km: 38, elevation: 310, grade: 4.1 },
      { km: 44, elevation: 510, grade: 3.3 },
      { km: 48, elevation: 355, grade: -3.9 },
      { km: 53, elevation: 495, grade: 2.8 },
      { km: 58, elevation: 210, grade: -5.7 },
      { km: 62.9, elevation: 15, grade: -4.0 }
    ],
    note: "Distance et D+ officiels. Profil d’entraînement simplifié représentant la côte de La Turbie, le Col d’Èze et les longues descentes vers le littoral.",
    category: "stage",
    difficulty: 3,
    tags: ["Côte d’Azur", "mer", "vallonné", "multi-bosses", "panoramique"],
    featured: true,
    sourceLabel: "Office de Tourisme Nice Côte d’Azur",
    sourceUrl: "https://www.explorenicecotedazur.com/itineraire/circuit-tour-des-corniches/"
  },
  {
    id: "chaussy-madeleine-stage",
    name: "Chaussy + Madeleine",
    subtitle: "Étape multi-cols",
    region: "Maurienne · Savoie",
    distanceKm: 79.5,
    elevationGainM: 2398,
    avgGrade: 3.0,
    maxGrade: 10,
    startElevationM: 550,
    finishElevationM: 550,
    xp: 760,
    points: 9,
    coordinates: [
      [45.2771, 6.3451],
      [45.3290, 6.3370],
      [45.3830, 6.3530],
      [45.4310, 6.3740],
      [45.3600, 6.3030],
      [45.2771, 6.3451]
    ],
    profile: [
      { km: 0, elevation: 550, grade: 0 },
      { km: 6, elevation: 850, grade: 5.0 },
      { km: 12, elevation: 1170, grade: 5.3 },
      { km: 19, elevation: 1533, grade: 5.2 },
      { km: 26, elevation: 1000, grade: -7.6 },
      { km: 34, elevation: 480, grade: -6.5 },
      { km: 39, elevation: 760, grade: 5.6 },
      { km: 46, elevation: 1260, grade: 7.1 },
      { km: 54, elevation: 1710, grade: 5.6 },
      { km: 59.5, elevation: 2000, grade: 5.3 },
      { km: 66, elevation: 1450, grade: -8.5 },
      { km: 73, elevation: 850, grade: -8.6 },
      { km: 79.5, elevation: 550, grade: -4.6 }
    ],
    note: "Distance et D+ officiels pour le circuit Chaussy + Madeleine. Le profil de simulation représente les deux ascensions et les descentes, mais n’est pas un relevé GPX exact.",
    category: "stage",
    difficulty: 5,
    tags: ["étape", "multi-cols", "Alpes", "endurance", "Tour de France"],
    featured: true,
    sourceLabel: "Maurienne Tourisme",
    sourceUrl: "https://www.maurienne-tourisme.com/visiter_bouger/col-du-chaussy-et-de-la-madeleine-776865/"
  },
  ...scenicRoutes,
  ...explorationRoutes,
  ...shortRoutes,
  ...napoleonRoutes,
  ...napoleonNorthRoutes,
  ...esterelRoutes,
  ...napoleonShortRoutes,
  ...alsaceRoutes
];
export const climbs = nativeRoutes.map(enrichRouteDescription);

export function routeCategory(route: ClimbChallenge): RouteCategory {
  if (route.category) return route.category;
  return route.id.startsWith("gpx-") ? "imported" : "climb";
}

export function routeDifficulty(route: ClimbChallenge): RouteDifficulty {
  if (route.difficulty) return route.difficulty;
  const score = route.elevationGainM / 450 + route.distanceKm / 35 + Math.max(0, route.maxGrade - 7) / 4;
  if (score >= 7) return 5;
  if (score >= 5) return 4;
  if (score >= 3.5) return 3;
  if (score >= 2) return 2;
  return 1;
}

export function routeTerrain(route: ClimbChallenge) {
  let ascentKm = 0;
  let descentKm = 0;
  let flatKm = 0;

  route.profile.slice(1).forEach((point, index) => {
    const previous = route.profile[index];
    const km = Math.max(0, point.km - previous.km);
    if (point.grade > 1) ascentKm += km;
    else if (point.grade < -1) descentKm += km;
    else flatKm += km;
  });

  return {
    ascentKm,
    descentKm,
    flatKm,
    minGrade: Math.min(...route.profile.map((point) => point.grade)),
    maxGrade: Math.max(...route.profile.map((point) => point.grade))
  };
}

export function remainingRouteStats(route: ClimbChallenge, currentKm: number) {
  const km = Math.max(0, Math.min(route.distanceKm, currentKm));
  let remainingGainM = 0;
  let nextHardSectorKm: number | undefined;

  route.profile.slice(1).forEach((point, index) => {
    const previous = route.profile[index];
    if (point.km <= km) return;
    const segmentStart = Math.max(km, previous.km);
    const segmentKm = Math.max(0, point.km - segmentStart);
    if (point.grade > 0) remainingGainM += segmentKm * 1000 * (point.grade / 100);
    if (nextHardSectorKm === undefined && point.grade >= 8) nextHardSectorKm = Math.max(0, segmentStart - km);
  });

  return {
    distanceKm: Math.max(0, route.distanceKm - km),
    elevationGainM: Math.round(remainingGainM),
    nextHardSectorKm
  };
}

export function routeSearchText(route: ClimbChallenge) {
  return [route.name, route.subtitle, route.region, ...(route.tags ?? []), ...(route.highlights ?? []), ...(route.places ?? []).flatMap((place) => [place.label, place.landmark])].join(" ").toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function resistanceForGrade(grade: number) {
  if (grade <= -5) return 5;
  if (grade <= -2) return 6;
  if (grade <= 0.5) return 8;
  if (grade <= 2) return 11;
  if (grade <= 4) return 15;
  if (grade <= 5.5) return 18;
  if (grade <= 7) return 21;
  if (grade <= 8.5) return 23;
  if (grade <= 10) return 25;
  if (grade <= 12) return 27;
  return 29;
}


export function climbToWorkout(climb: ClimbChallenge): WorkoutTemplate {
  const scenic = routeCategory(climb) === "scenic";
  const moderate = climb.effort === "moderate";
  const segments = climb.profile.slice(1).map((point, index) => {
    const previous = climb.profile[index];
    const distance = Math.max(0.2, point.km - previous.km);
    // Baseline simulation at ~15 km/h. With FTMS connected, route progress
    // is based on actual distance instead of this time estimate.
    const minutes = Math.max(0.5, Math.round(((distance / 15) * 60) * 2) / 2);
    const level = scenic ? scenicResistanceForGrade(point.grade) : moderate ? Math.max(4, Math.min(14, Math.round(8 + point.grade * .65))) : resistanceForGrade(point.grade);
    return {
      label: `${point.km.toFixed(1)} km · ${point.grade.toFixed(1)} %`,
      minutes,
      resistance: String(level),
      rpe: scenic ? "2–4" : moderate ? point.grade > 1 ? "4–5" : "2–3" : point.grade >= 10 ? "8–9" : point.grade >= 7 ? "7–8" : point.grade >= 4 ? "6–7" : point.grade > 0 ? "4–6" : "2–4",
      cadence: scenic ? "70–90" : point.grade >= 8 ? "65–80" : point.grade >= 4 ? "70–85" : "80–95"
    };
  });

  return {
    id: `climb-${climb.id}`,
    name: climb.name,
    tagline: climb.subtitle,
    kind: scenic ? "endurance" : "hills",
    duration: segments.reduce((sum, segment) => sum + segment.minutes, 0),
    points: climb.points,
    xp: climb.xp,
    intensity: scenic ? "easy" : moderate ? "moderate" : "hard",
    description: scenic ? `${climb.scenery} ${climb.note}` : climb.note,
    segments
  };
}

export function scenicResistanceForGrade(grade: number) {
  // The real terrain remains visible; indoor effort is deliberately gentle.
  return Math.max(4, Math.min(10, Math.round(7 + grade)));
}


export function routeSegmentWorkout(route: ClimbChallenge, segmentIndex: number, segments = 4): WorkoutTemplate {
  const safeIndex = Math.max(0, Math.min(segments - 1, segmentIndex));
  const startKm = route.distanceKm * (safeIndex / segments);
  const endKm = route.distanceKm * ((safeIndex + 1) / segments);

  const workoutSegments = route.profile.slice(1).flatMap((point, index) => {
    const previous = route.profile[index];
    const overlapStart = Math.max(startKm, previous.km);
    const overlapEnd = Math.min(endKm, point.km);
    const distance = overlapEnd - overlapStart;
    if (distance <= 0) return [];

    const minutes = Math.max(0.5, Math.round(((distance / 15) * 60) * 2) / 2);
    const level = resistanceForGrade(point.grade);
    return [{
      label: `${overlapEnd.toFixed(1)} km · ${point.grade.toFixed(1)} %`,
      minutes,
      resistance: String(level),
      rpe: point.grade >= 10 ? "8–9" : point.grade >= 7 ? "7–8" : point.grade >= 4 ? "6–7" : point.grade > 0 ? "4–6" : "2–4",
      cadence: point.grade >= 8 ? "65–80" : point.grade >= 4 ? "70–85" : "80–95"
    }];
  });

  const fallback = workoutSegments.length ? workoutSegments : [{
    label: `${endKm.toFixed(1)} km · secteur`,
    minutes: Math.max(1, Math.round((((endKm - startKm) / 15) * 60) * 2) / 2),
    resistance: String(resistanceForGrade(route.avgGrade)),
    rpe: "6–8",
    cadence: "75–90"
  }];

  return {
    id: `segment-${route.id}-${safeIndex}`,
    name: `${route.name} · Secteur ${safeIndex + 1}`,
    tagline: `${startKm.toFixed(1)} → ${endKm.toFixed(1)} km`,
    kind: "hills",
    duration: fallback.reduce((sum, segment) => sum + segment.minutes, 0),
    points: Math.max(2, Math.round(route.points / 2)),
    xp: Math.max(80, Math.round(route.xp / 3)),
    intensity: "hard",
    description: `Segment Attack sur le secteur ${safeIndex + 1}/${segments} de ${route.name}.`,
    segments: fallback
  };
}

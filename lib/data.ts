import { calorieWorkouts } from "./calorie-challenge";
import { expressWorkouts } from "./express-workouts";
import { localInputDate, localCalendarDay } from "./dates";
import type { Badge, AppState, Preferences, WeekTarget, WorkoutTemplate } from "./types";
import { campaignBonusXp, campaigns, campaignProgress, completedRouteIds } from "./campaigns";
import { voyageBonusXp, voyageRoutes } from "./voyage-progress";
import { scenicRouteIds } from "./scenic-routes";
import { explorationRoutes } from "./exploration-routes";
import { discoveryBadges } from "./discovery-objectives";
import { discoveryWorkouts } from "./discovery-workouts";
import { shortRoutes } from "./short-rides";
import { esterelRoutes } from "./esterel-routes";
import { alsaceRoutes } from "./alsace-routes";
import { napoleonShortRoutes } from "./napoleon-short-routes";
import { workoutProgramBadges, workoutProgramBonusXp } from "./workout-programs";
import { initialGuidance } from "./onboarding";

export const STORAGE_KEY = "veloquest:v1";

export const defaultPreferences: Preferences = {
  soundCues: true,
  voiceCues: false,
  cadenceOffset: -15,
  haptics: true,
  keepScreenAwake: true,
  keepTelemetryTrace: true,
  resistanceOffset: 0,
  cueVolume: 65,
  cueFrequency: "all",
  announceUpcoming: false,
  readerView: "full",
  showRoutePhotos: true
};

export const workouts: WorkoutTemplate[] = [
  ...discoveryWorkouts,
  ...expressWorkouts,
  ...calorieWorkouts,
  {
    id: "recovery-30",
    name: "Décrassage",
    tagline: "Faire tourner les jambes sans ajouter de fatigue.",
    kind: "recovery",
    duration: 30,
    points: 1,
    xp: 35,
    intensity: "easy",
    description: "Séance douce de récupération active. Tu dois terminer plus frais qu'au départ.",
    segments: [
      { label: "Mise en route", minutes: 5, resistance: "5–7", rpe: "2–3", cadence: "75–85" },
      { label: "Roulage facile", minutes: 20, resistance: "7–10", rpe: "3–4", cadence: "80–90" },
      { label: "Retour au calme", minutes: 5, resistance: "4–6", rpe: "2", cadence: "libre" }
    ]
  },
  {
    id: "endurance-45",
    name: "Endurance",
    tagline: "Le socle : régulier, soutenu, durable.",
    kind: "endurance",
    duration: 45,
    points: 2,
    xp: 70,
    intensity: "moderate",
    description: "Une séance continue à intensité contrôlée pour accumuler du volume sans te vider.",
    segments: [
      { label: "Échauffement", minutes: 7, resistance: "7–10", rpe: "3–4", cadence: "75–85" },
      { label: "Endurance", minutes: 33, resistance: "11–16", rpe: "5–6", cadence: "80–95" },
      { label: "Retour au calme", minutes: 5, resistance: "5–8", rpe: "2–3", cadence: "libre" }
    ]
  },
  {
    id: "endurance-70",
    name: "Grande traversée",
    tagline: "Longue, calme, redoutablement rentable.",
    kind: "endurance",
    duration: 70,
    points: 3,
    xp: 105,
    intensity: "moderate",
    description: "La séance longue : série, podcast ou Kinomap, mais une cadence constante.",
    segments: [
      { label: "Échauffement", minutes: 10, resistance: "7–10", rpe: "3–4", cadence: "75–85" },
      { label: "Croisière", minutes: 55, resistance: "10–15", rpe: "5", cadence: "80–95" },
      { label: "Retour au calme", minutes: 5, resistance: "5–7", rpe: "2–3", cadence: "libre" }
    ]
  },
  {
    id: "progressive-35",
    name: "Ascension",
    tagline: "Chaque palier te rapproche du rouge.",
    kind: "progressive",
    duration: 35,
    points: 3,
    xp: 95,
    intensity: "hard",
    description: "Une montée en régime continue jusqu'à un final franchement difficile.",
    segments: [
      { label: "Réveil", minutes: 5, resistance: "8", rpe: "3–4" },
      { label: "Palier I", minutes: 5, resistance: "11", rpe: "4–5" },
      { label: "Palier II", minutes: 5, resistance: "14", rpe: "5–6" },
      { label: "Palier III", minutes: 5, resistance: "17", rpe: "6–7" },
      { label: "Palier IV", minutes: 5, resistance: "20", rpe: "7" },
      { label: "Palier V", minutes: 5, resistance: "23", rpe: "8" },
      { label: "Final", minutes: 3, resistance: "26–28", rpe: "9" },
      { label: "Retour au calme", minutes: 2, resistance: "6–8", rpe: "2–3" }
    ]
  },
  {
    id: "hiit-25",
    name: "Impact",
    tagline: "Court. Dense. Sans négociation.",
    kind: "hiit",
    duration: 25,
    points: 4,
    xp: 125,
    intensity: "hard",
    description: "Huit répétitions courtes et violentes. Reste assis et garde une cadence propre.",
    segments: [
      { label: "Échauffement", minutes: 5, resistance: "7–10", rpe: "3–4" },
      ...Array.from({ length: 8 }).flatMap((_, i) => [
        { label: `Impact ${i + 1}`, minutes: 1.5, resistance: "24–28", rpe: "8.5–9", cadence: "85–100" },
        { label: `Récupération ${i + 1}`, minutes: 1, resistance: "7–10", rpe: "3", cadence: "libre" }
      ])
    ]
  },
  {
    id: "hiit-4x4",
    name: "Forge 4×4",
    tagline: "Quatre blocs qui ne pardonnent rien.",
    kind: "hiit",
    duration: 39,
    points: 4,
    xp: 135,
    intensity: "hard",
    description: "Quatre efforts longs à haute intensité, séparés par une récupération active.",
    segments: [
      { label: "Échauffement", minutes: 7, resistance: "7–10", rpe: "3–4" },
      { label: "Bloc 1", minutes: 4, resistance: "22–26", rpe: "8–9" },
      { label: "Récupération", minutes: 3, resistance: "8–10", rpe: "3" },
      { label: "Bloc 2", minutes: 4, resistance: "22–26", rpe: "8–9" },
      { label: "Récupération", minutes: 3, resistance: "8–10", rpe: "3" },
      { label: "Bloc 3", minutes: 4, resistance: "22–26", rpe: "8–9" },
      { label: "Récupération", minutes: 3, resistance: "8–10", rpe: "3" },
      { label: "Bloc 4", minutes: 4, resistance: "22–26", rpe: "8–9" },
      { label: "Retour au calme", minutes: 7, resistance: "5–8", rpe: "2–3" }
    ]
  },
  {
    id: "threshold-45",
    name: "Ligne rouge",
    tagline: "Longtemps difficile, jamais hors contrôle.",
    kind: "threshold",
    duration: 45,
    points: 3,
    xp: 110,
    intensity: "hard",
    description: "Trois blocs de travail au seuil : exigeant, stable et contrôlé.",
    segments: [
      { label: "Échauffement", minutes: 7, resistance: "7–10", rpe: "3–4" },
      { label: "Seuil 1", minutes: 8, resistance: "18–23", rpe: "7–8" },
      { label: "Récupération", minutes: 3, resistance: "8–10", rpe: "3" },
      { label: "Seuil 2", minutes: 8, resistance: "18–23", rpe: "7–8" },
      { label: "Récupération", minutes: 3, resistance: "8–10", rpe: "3" },
      { label: "Seuil 3", minutes: 8, resistance: "18–23", rpe: "7–8" },
      { label: "Retour au calme", minutes: 8, resistance: "5–8", rpe: "2–3" }
    ]
  },
  {
    id: "hills-40",
    name: "Cols",
    tagline: "Du couple, du contrôle, des jambes lourdes.",
    kind: "hills",
    duration: 40,
    points: 3,
    xp: 105,
    intensity: "hard",
    description: "Alternance de côtes et de récupération. Cadence volontairement plus basse, sans écraser les genoux.",
    segments: [
      { label: "Échauffement", minutes: 6, resistance: "7–10", rpe: "3–4" },
      ...Array.from({ length: 7 }).flatMap((_, i) => [
        { label: `Col ${i + 1}`, minutes: 2, resistance: "23–27", rpe: "8", cadence: "60–75" },
        { label: `Descente ${i + 1}`, minutes: 2, resistance: "8–11", rpe: "3–4", cadence: "80–90" }
      ]),
      { label: "Retour au calme", minutes: 6, resistance: "5–8", rpe: "2–3" }
    ]
  },
  {
    id: "ladder-40",
    name: "Escalier",
    tagline: "Monte jusqu'au sommet, redescends proprement.",
    kind: "ladder",
    duration: 37,
    points: 3,
    xp: 105,
    intensity: "hard",
    description: "Une pyramide de résistance progressive, sans rupture brutale.",
    segments: [
      { label: "Échauffement", minutes: 5, resistance: "8–10", rpe: "3–4" },
      { label: "Marche 1", minutes: 3, resistance: "14", rpe: "5" },
      { label: "Marche 2", minutes: 3, resistance: "17", rpe: "6" },
      { label: "Marche 3", minutes: 3, resistance: "20", rpe: "7" },
      { label: "Marche 4", minutes: 3, resistance: "23", rpe: "8" },
      { label: "Sommet", minutes: 3, resistance: "26", rpe: "9" },
      { label: "Marche 4", minutes: 3, resistance: "23", rpe: "8" },
      { label: "Marche 3", minutes: 3, resistance: "20", rpe: "7" },
      { label: "Marche 2", minutes: 3, resistance: "17", rpe: "6" },
      { label: "Marche 1", minutes: 3, resistance: "14", rpe: "5" },
      { label: "Retour au calme", minutes: 5, resistance: "6–8", rpe: "2–3" }
    ]
  },
  {
    id: "free-ride",
    name: "Séance libre",
    tagline: "Tu roules, VeloQuest enregistre.",
    kind: "endurance",
    duration: 30,
    points: 1,
    xp: 45,
    intensity: "moderate",
    description: "Pour une séance improvisée ou déjà commencée. Termine-la puis renseigne les données du vélo ou laisse FTMS les récupérer.",
    segments: [
      { label: "Roulage libre", minutes: 30, resistance: "libre", rpe: "à ton choix", cadence: "libre" }
    ]
  },
  {
    id: "bonus-10",
    name: "Micro bonus 10",
    tagline: "Dix minutes valent mieux que zéro.",
    kind: "bonus",
    duration: 10,
    points: 0,
    xp: 15,
    intensity: "easy",
    bonus: true,
    description: "Très facile : un petit supplément de mouvement sans créer de dette de récupération.",
    segments: [
      { label: "Départ", minutes: 2, resistance: "5–7", rpe: "2–3" },
      { label: "Roulage", minutes: 6, resistance: "7–10", rpe: "3–4", cadence: "80–90" },
      { label: "Retour au calme", minutes: 2, resistance: "4–6", rpe: "2" }
    ]
  },
  {
    id: "bonus-15",
    name: "Micro bonus",
    tagline: "15 minutes offertes à ta régularité.",
    kind: "bonus",
    duration: 15,
    points: 0,
    xp: 20,
    intensity: "easy",
    bonus: true,
    description: "Un supplément volontaire, très facile. Il ajoute des minutes et un peu d'XP, mais ne remplace aucune séance structurée.",
    segments: [
      { label: "Départ facile", minutes: 3, resistance: "5–7", rpe: "2–3" },
      { label: "Roulage bonus", minutes: 9, resistance: "7–10", rpe: "3–4", cadence: "80–90" },
      { label: "Retour au calme", minutes: 3, resistance: "4–6", rpe: "2" }
    ]
  },
  {
    id: "bonus-20",
    name: "Micro bonus 20",
    tagline: "Vingt minutes tranquilles pour empiler du volume.",
    kind: "bonus",
    duration: 20,
    points: 0,
    xp: 25,
    intensity: "easy",
    bonus: true,
    description: "Bonus facile, parfait devant une vidéo ou en récupération active.",
    segments: [
      { label: "Départ facile", minutes: 3, resistance: "5–7", rpe: "2–3" },
      { label: "Roulage bonus", minutes: 14, resistance: "7–10", rpe: "3–4", cadence: "80–90" },
      { label: "Retour au calme", minutes: 3, resistance: "4–6", rpe: "2" }
    ]
  }
];

export const weekTargets: WeekTarget[] = [
  { week: 1, points: 12, minutes: 240, sessions: 5, variety: 4, maxHard: 3 },
  { week: 2, points: 13, minutes: 260, sessions: 5, variety: 4, maxHard: 3 },
  { week: 3, points: 14, minutes: 280, sessions: 6, variety: 4, maxHard: 3 },
  { week: 4, points: 10, minutes: 220, sessions: 5, variety: 3, maxHard: 2 },
  { week: 5, points: 15, minutes: 290, sessions: 6, variety: 4, maxHard: 3 },
  { week: 6, points: 16, minutes: 305, sessions: 6, variety: 4, maxHard: 3 },
  { week: 7, points: 17, minutes: 320, sessions: 6, variety: 5, maxHard: 3 },
  { week: 8, points: 12, minutes: 250, sessions: 5, variety: 4, maxHard: 2 },
  { week: 9, points: 17, minutes: 325, sessions: 6, variety: 5, maxHard: 3 },
  { week: 10, points: 18, minutes: 335, sessions: 6, variety: 5, maxHard: 3 },
  { week: 11, points: 19, minutes: 350, sessions: 6, variety: 5, maxHard: 3 },
  { week: 12, points: 14, minutes: 280, sessions: 5, variety: 4, maxHard: 2 }
];

export function personalWeekTarget(week: number, sessions = 4, minutesPerSession = 30): WeekTarget {
  const count = Math.max(1, Math.min(7, Math.round(sessions)));
  const duration = Math.max(10, Math.min(120, Math.round(minutesPerSession / 5) * 5));
  return { week, sessions: count, minutes: count * duration, points: count * 2, variety: Math.min(3, count), maxHard: Math.min(count, weekTargets[week - 1]?.maxHard ?? 3) };
}

export function weekTargetFor(state: AppState, week: number): WeekTarget {
  return state.weeklyGoals?.find(target => target.week === week) ?? weekTargets[week - 1];
}

// Migration freezes past legacy goals and starts the manageable routine now.
export function normalizeWeeklyGoals(raw: unknown, currentWeek: number): WeekTarget[] {
  return weekTargets.map(legacy => {
    const saved = Array.isArray(raw) ? raw.find(value => value?.week === legacy.week) : undefined;
    if (saved && ["minutes", "sessions", "points", "variety", "maxHard"].every(key => typeof saved[key] === "number" && Number.isFinite(saved[key]) && saved[key] >= 0)
      && saved.sessions >= 1 && saved.sessions <= 7 && saved.minutes >= 10 && saved.minutes <= 840 && saved.variety <= saved.sessions && saved.maxHard <= saved.sessions) return { week: legacy.week, minutes: saved.minutes, sessions: saved.sessions, points: saved.points, variety: saved.variety, maxHard: saved.maxHard };
    return legacy.week < currentWeek ? { ...legacy } : personalWeekTarget(legacy.week);
  });
}

export function changeWeeklyGoals(state: AppState, currentWeek: number, sessions: number, minutesPerSession: number): AppState {
  return { ...state, weeklyGoals: weekTargets.map(legacy => legacy.week < currentWeek ? { ...weekTargetFor(state, legacy.week) } : personalWeekTarget(legacy.week, sessions, minutesPerSession)) };
}

export function emptyState(): AppState {
  return {
    weeklyGoals: weekTargets.map(target => personalWeekTarget(target.week)),
    profile: {
      name: "",
      startDate: localInputDate()
    },
    sessions: [],
    measurements: [],
    preferences: { ...defaultPreferences },
    favoriteRouteIds: [],
    guidance: initialGuidance()
  };
}

export function currentProgramWeek(startDate: string) {
  const start = new Date(startDate + "T00:00:00");
  const now = new Date();
  const days = Math.max(0, localCalendarDay(now) - localCalendarDay(start));
  return Math.min(12, Math.max(1, Math.floor(days / 7) + 1));
}

export function sessionsForProgramWeek(state: AppState, week: number) {
  const start = new Date(state.profile.startDate + "T00:00:00");
  const end = new Date(start);
  start.setDate(start.getDate() + (week - 1) * 7);
  end.setDate(end.getDate() + week * 7);
  const from = start.getTime();
  const to = end.getTime();
  return state.sessions.filter((s) => {
    const time = new Date(s.date).getTime();
    return time >= from && time < to;
  });
}

export function weeklyStats(state: AppState, week: number) {
  const all = sessionsForProgramWeek(state, week);
  const structured = all.filter((s) => !s.bonus);
  const bonuses = all.filter((s) => s.bonus && s.metrics?.voyage === undefined);
  const bonusXp = Math.min(60, bonuses.reduce((sum, s) => sum + s.xp, 0));
  return {
    sessions: structured.length,
    minutes: all.reduce((sum, s) => sum + s.duration, 0),
    points: structured.reduce((sum, s) => sum + s.points, 0),
    hard: structured.filter((s) => s.intensity === "hard").length,
    variety: new Set(structured.map((s) => s.kind)).size,
    bonuses: bonuses.length,
    bonusXp
  };
}

export function totalXp(state: AppState) {
  const sessionXp = state.sessions.filter((s) => !s.bonus && s.metrics?.voyage === undefined).reduce((sum, s) => sum + s.xp, 0);
  const completedWeeks = weekTargets.map(target => weekTargetFor(state, target.week)).filter((target) => {
    const s = weeklyStats(state, target.week);
    return s.points >= target.points && s.minutes >= target.minutes && s.sessions >= target.sessions && s.variety >= target.variety && s.hard <= target.maxHard;
  }).length;
  const bonusXp = weekTargets.reduce((sum, target) => sum + weeklyStats(state, target.week).bonusXp, 0);
  return sessionXp + bonusXp + completedWeeks * 250 + campaignBonusXp(state.sessions) + workoutProgramBonusXp(state.sessions) + voyageBonusXp(state.sessions);
}

export function levelForXp(xp: number) {
  return Math.floor(xp / 500) + 1;
}

export function levelTitle(level: number) {
  const titles = ["Découvreur", "Rouleur", "Régulier", "Baroudeur", "Grimpeur", "Puncheur", "Endurant", "Capitaine de route", "Maître du tempo", "Légende"];
  return titles[Math.min(titles.length - 1, Math.max(0, level - 1))];
}

export function isPerfectWeek(state: AppState, week: number) {
  const target = weekTargetFor(state, week);
  const s = weeklyStats(state, week);
  return s.points >= target.points && s.minutes >= target.minutes && s.sessions >= target.sessions && s.variety >= target.variety && s.hard <= target.maxHard;
}

export function streak(state: AppState) {
  let count = 0;
  for (let week = currentProgramWeek(state.profile.startDate) - 1; week >= 1; week--) {
    if (isPerfectWeek(state, week)) count++;
    else break;
  }
  return count;
}

export function badges(state: AppState): Badge[] {
  const structured = state.sessions.filter((s) => !s.bonus);
  const bonus = state.sessions.filter((s) => s.bonus);
  const kinds = new Set(structured.map((s) => s.kind));
  const perfectWeeks = weekTargets.filter((w) => isPerfectWeek(state, w.week)).length;
  const sortedMeasurements = [...state.measurements].sort((a, b) => b.date.localeCompare(a.date));
  const latestWeight = sortedMeasurements.find((m) => m.weight !== undefined)?.weight;
  const latestWaist = sortedMeasurements.find((m) => m.waist !== undefined)?.waist;
  const weightLost = state.profile.startWeight && latestWeight !== undefined ? state.profile.startWeight - latestWeight : 0;
  const waistLost = state.profile.startWaist && latestWaist !== undefined ? state.profile.startWaist - latestWaist : 0;
  const connected = state.sessions.filter((s) => s.metrics?.source === "ftms" || s.metrics?.source === "mixed");
  const routeIds = completedRouteIds(state.sessions);
  const successfulChallenges = state.sessions.filter((s) => s.metrics?.challenge?.success);
  const uniqueChallengeIds = new Set(successfulChallenges.map((s) => s.metrics!.challenge!.id));
  const totalDistance = state.sessions.reduce((sum, s) => sum + (s.metrics?.distanceKm ?? 0), 0);
  const sessionsWithPower = state.sessions.filter((s) => (s.metrics?.avgPowerW ?? 0) > 0);
  const gentleRouteIds = [...scenicRouteIds, ...[...explorationRoutes, ...shortRoutes, ...esterelRoutes, ...napoleonShortRoutes, ...alsaceRoutes].filter((route) => route.category === "scenic").map((route) => route.id)];
  const scenicCount = gentleRouteIds.filter((id) => routeIds.has(id)).length;
  // Preserve the historic relief counters; gentle rides have their own trophies.
  const reliefCount = [...routeIds].filter((id) => !gentleRouteIds.includes(id)).length;
  const voyages = voyageRoutes(state.sessions);
  const completedVoyages = voyages.filter(p => p.complete).length;

  return [
    ...[
      { id: "voyage-first", name: "Première escale", icon: "🧳", target: 1, count: voyages.length ? 1 : 0, description: "Achever et enregistrer une première portion en mode Voyage." },
      { id: "voyage-complete", name: "Au bout du voyage", icon: "🏁", target: 1, count: completedVoyages, description: "Couvrir un parcours entier en une ou plusieurs portions Voyage, sans kilomètre manquant." },
      { id: "voyage-three", name: "Voyages au long cours", icon: "📖", target: 3, count: completedVoyages, description: "Achever trois parcours différents en mode Voyage." }
    ].map((trophy): Badge => ({ id: trophy.id, name: trophy.name, icon: trophy.icon, description: trophy.description, unlocked: trophy.count >= trophy.target, progress: `${Math.min(trophy.count, trophy.target)}/${trophy.target}` })),
    ...discoveryBadges(state.sessions),
    ...workoutProgramBadges(state.sessions),
    ...[
      { id: "scenic-first", name: "Premier paysage", icon: "🌅", target: 1 },
      { id: "scenic-three", name: "Flâneur de France", icon: "🧺", target: 3 },
      { id: "scenic-all", name: "Atlas des balades", icon: "🗺️", target: 7 }
    ].map((trophy): Badge => ({
      id: trophy.id, name: trophy.name, icon: trophy.icon,
      description: `Terminer ${trophy.target} balade${trophy.target > 1 ? "s" : ""} différente${trophy.target > 1 ? "s" : ""}. Pauses libres, aucun chrono imposé.`,
      unlocked: scenicCount >= trophy.target,
      progress: `${Math.min(scenicCount, trophy.target)}/${trophy.target}`
    })),
    ...campaigns.map((campaign): Badge => {
      const progress = campaignProgress(campaign, state.sessions);
      return {
        id: `campaign-${campaign.id}`,
        name: campaign.title,
        icon: campaign.icon,
        description: `Terminer les ${progress.totalStages} étapes de la campagne. Bonus unique : ${campaign.xpBonus} XP.`,
        unlocked: progress.complete,
        progress: `${progress.completedStages}/${progress.totalStages}`
      };
    }),
    { id: "first", name: "Premier tour de roue", icon: "🚲", description: "Terminer une première séance.", unlocked: structured.length >= 1, progress: `${Math.min(structured.length, 1)}/1` },
    { id: "variety", name: "Explorateur", icon: "🧭", description: "Valider 5 familles de séances.", unlocked: kinds.size >= 5, progress: `${Math.min(kinds.size, 5)}/5` },
    { id: "perfect", name: "Semaine parfaite", icon: "👑", description: "Atteindre tous les objectifs d'une semaine sans dépasser la charge dure.", unlocked: perfectWeeks >= 1, progress: `${Math.min(perfectWeeks, 1)}/1` },
    { id: "streak3", name: "Trilogie", icon: "🔥", description: "Enchaîner 3 semaines parfaites.", unlocked: streak(state) >= 3, progress: `${Math.min(streak(state), 3)}/3` },
    { id: "bonus5", name: "Encore un tour", icon: "✨", description: "Ajouter 5 micro-séances bonus.", unlocked: bonus.length >= 5, progress: `${Math.min(bonus.length, 5)}/5` },
    { id: "bonus20", name: "Régularité d'acier", icon: "⚙️", description: "Cumuler 20 micro-séances bonus.", unlocked: bonus.length >= 20, progress: `${Math.min(bonus.length, 20)}/20` },
    { id: "weight25", name: "Allégé", icon: "⚖️", description: "Perdre 2,5 kg depuis le départ.", unlocked: weightLost >= 2.5, progress: `${Math.max(0, weightLost).toFixed(1)}/2,5 kg` },
    { id: "weight5", name: "Cap -5 kg", icon: "🏔️", description: "Perdre 5 kg depuis le départ.", unlocked: weightLost >= 5, progress: `${Math.max(0, weightLost).toFixed(1)}/5 kg` },
    { id: "waist2", name: "Ceinture gagnée", icon: "📏", description: "Perdre 2 cm de tour de taille.", unlocked: waistLost >= 2, progress: `${Math.max(0, waistLost).toFixed(1)}/2 cm` },
    { id: "waist5", name: "Silhouette", icon: "🎯", description: "Perdre 5 cm de tour de taille.", unlocked: waistLost >= 5, progress: `${Math.max(0, waistLost).toFixed(1)}/5 cm` },
    { id: "connected", name: "Machine liée", icon: "📡", description: "Enregistrer une séance avec télémétrie FTMS.", unlocked: connected.length >= 1, progress: `${Math.min(connected.length, 1)}/1` },
    { id: "climb1", name: "Premier relief", icon: "⛰️", description: "Terminer un parcours hors balades : col, étape ou GPX personnel. Les validations historiques sont conservées.", unlocked: reliefCount >= 1, progress: `${Math.min(reliefCount, 1)}/1` },
    { id: "climb3", name: "Collectionneur de reliefs", icon: "🏔️", description: "Terminer 3 parcours différents hors balades. Les validations historiques sont conservées.", unlocked: reliefCount >= 3, progress: `${Math.min(reliefCount, 3)}/3` },
    { id: "distance100", name: "Centurion", icon: "🛣️", description: "Cumuler 100 km enregistrés.", unlocked: totalDistance >= 100, progress: `${Math.min(totalDistance, 100).toFixed(0)}/100 km` },
    { id: "power", name: "Watts up", icon: "⚡", description: "Enregistrer 5 séances avec une puissance moyenne.", unlocked: sessionsWithPower.length >= 5, progress: `${Math.min(sessionsWithPower.length, 5)}/5` },
    { id: "sessions10", name: "En selle", icon: "🔟", description: "Terminer 10 séances structurées.", unlocked: structured.length >= 10, progress: `${Math.min(structured.length, 10)}/10` },
    { id: "sessions25", name: "Habitude ancrée", icon: "🧱", description: "Terminer 25 séances structurées.", unlocked: structured.length >= 25, progress: `${Math.min(structured.length, 25)}/25` },
    { id: "sessions50", name: "Machine régulière", icon: "🏁", description: "Terminer 50 séances structurées.", unlocked: structured.length >= 50, progress: `${Math.min(structured.length, 50)}/50` },
    { id: "perfect4", name: "Mois solide", icon: "🗓️", description: "Cumuler 4 semaines parfaites.", unlocked: perfectWeeks >= 4, progress: `${Math.min(perfectWeeks, 4)}/4` },
    { id: "perfect8", name: "Deux mois d’acier", icon: "🛡️", description: "Cumuler 8 semaines parfaites.", unlocked: perfectWeeks >= 8, progress: `${Math.min(perfectWeeks, 8)}/8` },
    { id: "perfect12", name: "Conquête des 12 semaines", icon: "🏆", description: "Valider les 12 semaines parfaites.", unlocked: perfectWeeks >= 12, progress: `${Math.min(perfectWeeks, 12)}/12` },
    { id: "distance500", name: "Grand rouleur", icon: "🌍", description: "Cumuler 500 km enregistrés.", unlocked: totalDistance >= 500, progress: `${Math.min(totalDistance, 500).toFixed(0)}/500 km` },
    { id: "connected10", name: "100 % connecté", icon: "📶", description: "Enregistrer 10 séances avec télémétrie FTMS.", unlocked: connected.length >= 10, progress: `${Math.min(connected.length, 10)}/10` },
    { id: "goalWeight", name: "Objectif poids", icon: "🎖️", description: "Atteindre l’objectif de poids défini.", unlocked: Boolean(state.profile.targetWeight !== undefined && latestWeight !== undefined && latestWeight <= state.profile.targetWeight), progress: state.profile.targetWeight !== undefined && latestWeight !== undefined ? `${latestWeight.toFixed(1)} / ${state.profile.targetWeight.toFixed(1)} kg` : "objectif à définir" },
    { id: "goalWaist", name: "Objectif tour de taille", icon: "🥇", description: "Atteindre l’objectif de tour de taille défini.", unlocked: Boolean(state.profile.targetWaist !== undefined && latestWaist !== undefined && latestWaist <= state.profile.targetWaist), progress: state.profile.targetWaist !== undefined && latestWaist !== undefined ? `${latestWaist.toFixed(1)} / ${state.profile.targetWaist.toFixed(1)} cm` : "objectif à définir" },
    { id: "challenge1", name: "Défi relevé", icon: "◆", description: "Réussir un premier défi de parcours.", unlocked: successfulChallenges.length >= 1, progress: `${Math.min(successfulChallenges.length, 1)}/1` },
    { id: "challenge5", name: "Challenger", icon: "🎲", description: "Réussir 5 défis de parcours.", unlocked: successfulChallenges.length >= 5, progress: `${Math.min(successfulChallenges.length, 5)}/5` },
    { id: "challenge-variety", name: "Polyvalent", icon: "🧩", description: "Réussir 4 types de défis différents.", unlocked: uniqueChallengeIds.size >= 4, progress: `${Math.min(uniqueChallengeIds.size, 4)}/4` }
  ];
}

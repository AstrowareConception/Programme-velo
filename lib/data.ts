import type { Badge, AppState, WeekTarget, WorkoutTemplate } from "./types";

export const STORAGE_KEY = "veloquest:v1";

export const workouts: WorkoutTemplate[] = [
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

export function emptyState(): AppState {
  return {
    profile: {
      name: "",
      startDate: new Date().toISOString().slice(0, 10)
    },
    sessions: [],
    measurements: []
  };
}

export function currentProgramWeek(startDate: string) {
  const start = new Date(startDate + "T00:00:00");
  const now = new Date();
  const days = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86400000));
  return Math.min(12, Math.max(1, Math.floor(days / 7) + 1));
}

export function sessionsForProgramWeek(state: AppState, week: number) {
  const start = new Date(state.profile.startDate + "T00:00:00").getTime();
  const from = start + (week - 1) * 7 * 86400000;
  const to = from + 7 * 86400000;
  return state.sessions.filter((s) => {
    const time = new Date(s.date).getTime();
    return time >= from && time < to;
  });
}

export function weeklyStats(state: AppState, week: number) {
  const all = sessionsForProgramWeek(state, week);
  const structured = all.filter((s) => !s.bonus);
  const bonuses = all.filter((s) => s.bonus);
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
  const sessionXp = state.sessions.filter((s) => !s.bonus).reduce((sum, s) => sum + s.xp, 0);
  const completedWeeks = weekTargets.filter((target) => {
    const s = weeklyStats(state, target.week);
    return s.points >= target.points && s.minutes >= target.minutes && s.sessions >= target.sessions && s.variety >= target.variety && s.hard <= target.maxHard;
  }).length;
  const bonusXp = weekTargets.reduce((sum, target) => sum + weeklyStats(state, target.week).bonusXp, 0);
  return sessionXp + bonusXp + completedWeeks * 250;
}

export function levelForXp(xp: number) {
  return Math.floor(xp / 500) + 1;
}

export function isPerfectWeek(state: AppState, week: number) {
  const target = weekTargets[week - 1];
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
  const latest = [...state.measurements].sort((a, b) => b.date.localeCompare(a.date))[0];
  const weightLost = state.profile.startWeight && latest?.weight ? state.profile.startWeight - latest.weight : 0;
  const waistLost = state.profile.startWaist && latest?.waist ? state.profile.startWaist - latest.waist : 0;

  return [
    { id: "first", name: "Premier tour de roue", icon: "🚲", description: "Terminer une première séance.", unlocked: structured.length >= 1, progress: `${Math.min(structured.length, 1)}/1` },
    { id: "variety", name: "Explorateur", icon: "🧭", description: "Valider 5 familles de séances.", unlocked: kinds.size >= 5, progress: `${Math.min(kinds.size, 5)}/5` },
    { id: "perfect", name: "Semaine parfaite", icon: "👑", description: "Atteindre tous les objectifs d'une semaine sans dépasser la charge dure.", unlocked: perfectWeeks >= 1, progress: `${Math.min(perfectWeeks, 1)}/1` },
    { id: "streak3", name: "Trilogie", icon: "🔥", description: "Enchaîner 3 semaines parfaites.", unlocked: streak(state) >= 3, progress: `${Math.min(streak(state), 3)}/3` },
    { id: "bonus5", name: "Encore un tour", icon: "✨", description: "Ajouter 5 micro-séances bonus.", unlocked: bonus.length >= 5, progress: `${Math.min(bonus.length, 5)}/5` },
    { id: "bonus20", name: "Régularité d'acier", icon: "⚙️", description: "Cumuler 20 micro-séances bonus.", unlocked: bonus.length >= 20, progress: `${Math.min(bonus.length, 20)}/20` },
    { id: "weight25", name: "Allégé", icon: "⚖️", description: "Perdre 2,5 kg depuis le départ.", unlocked: weightLost >= 2.5, progress: `${Math.max(0, weightLost).toFixed(1)}/2,5 kg` },
    { id: "weight5", name: "Cap -5 kg", icon: "🏔️", description: "Perdre 5 kg depuis le départ.", unlocked: weightLost >= 5, progress: `${Math.max(0, weightLost).toFixed(1)}/5 kg` },
    { id: "waist2", name: "Ceinture gagnée", icon: "📏", description: "Perdre 2 cm de tour de taille.", unlocked: waistLost >= 2, progress: `${Math.max(0, waistLost).toFixed(1)}/2 cm` },
    { id: "waist5", name: "Silhouette", icon: "🎯", description: "Perdre 5 cm de tour de taille.", unlocked: waistLost >= 5, progress: `${Math.max(0, waistLost).toFixed(1)}/5 cm` }
  ];
}

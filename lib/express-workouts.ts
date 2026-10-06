import type { Segment, WorkoutTemplate } from "./types";
const part = (label: string, minutes: number, resistance: string, rpe: string, cadence = "libre"): Segment => ({ label, minutes, resistance, rpe, cadence });
const make = (id: string, name: string, intensity: WorkoutTemplate["intensity"], tagline: string, segments: Segment[]): WorkoutTemplate => ({
  id: `express-${id}`, name, intensity, tagline, segments,
  kind: intensity === "hard" ? "hiit" : intensity === "moderate" ? "progressive" : "recovery",
  duration: segments.reduce((sum, segment) => sum + segment.minutes, 0),
  points: 0.5, xp: intensity === "hard" ? 25 : intensity === "moderate" ? 18 : 10,
  description: `${tagline} Format express complet avec mise en route et retour au calme.${intensity === "hard" ? " Les passages durs restent courts : ajuste la résistance à ton ressenti. Cette séance compte dans le plafond hebdomadaire d’intensité." : ""}`
});
export const expressWorkouts: WorkoutTemplate[] = [
  make("reset-3", "Pause active · 3 min", "easy", "Trois minutes toutes douces pour remettre les jambes en mouvement.", [part("Réveil", 1, "2–3", "1–2"), part("Fluidité", 1, "3–4", "2", "75–85"), part("Relâchement", 1, "2", "1")]),
  make("flow-4", "Petit tour · 4 min", "easy", "Un mini voyage en souplesse, sans recherche de vitesse.", [part("Départ", 1, "3–4", "2"), part("Roulage doux", 2, "4–6", "2–3", "75–85"), part("Retour", 1, "2–3", "1–2")]),
  make("precision-5", "Cadence précise · 5 min", "easy", "Deux cibles proches pour jouer avec la régularité.", [part("Mise en route", 1, "3–4", "2"), part("Tempo doux", 1.5, "4–5", "2–3", "75–85"), part("Tempo fluide", 1.5, "4–5", "3", "80–90"), part("Retour", 1, "2–3", "2")]),
  make("stairs-5", "Petit escalier · 5 min", "moderate", "Une montée progressive et une descente, sans palier brutal.", [part("Mise en route", 1.5, "4–6", "2–3"), part("Escalier", 2, "7–11", "4–5", "75–90"), part("Descente", 1.5, "3–5", "2")]),
  make("waves-6", "Vagues express · 6 min", "moderate", "Deux petites bosses séparées par une récupération.", [part("Mise en route", 1.5, "4–6", "2–3"), part("Première vague", 1, "9–12", "5", "75–85"), part("Creux", 1, "4–6", "2–3"), part("Deuxième vague", 1, "9–12", "5", "75–85"), part("Retour", 1.5, "3–5", "2")]),
  make("tempo-7", "Tempo minute · 7 min", "moderate", "Trois minutes régulières pour travailler la maîtrise du rythme.", [part("Mise en route", 2, "4–7", "2–3"), part("Tempo", 3, "9–13", "5–6", "80–90"), part("Retour", 2, "3–5", "2")]),
  make("pulses-8", "Éclats courts · 8 min", "hard", "Trois efforts de vingt secondes, avec de vraies récupérations.", [part("Mise en route progressive", 3, "4–9", "2–4"), ...Array.from({length: 3}, (_, i) => [part(`Éclat ${i+1}`, 1/3, "15–19", "7–8", "85–100"), part(`Récupération ${i+1}`, 2/3, "4–6", "2–3")]).flat(), part("Retour au calme", 2, "3–5", "2")]),
  make("summit-9", "Sommet éclair · 9 min", "hard", "Deux ascensions courtes : un défi de résistance, pas de sprint maximal.", [part("Mise en route progressive", 3, "4–9", "2–4"), part("Ascension 1", 1, "16–20", "7–8", "75–85"), part("Vallée", 1, "4–6", "2–3"), part("Ascension 2", 1, "17–21", "8", "75–85"), part("Relâchement", 1, "5–7", "3"), part("Retour au calme", 2, "3–5", "2")])
];

import type { Segment, WorkoutTemplate } from "./types";

const segment = (label: string, minutes: number, resistance: string, rpe: string, cadence = "libre"): Segment =>
  ({ label, minutes, resistance, rpe, cadence });

function shortWorkout(id: string, name: string, kind: WorkoutTemplate["kind"], intensity: WorkoutTemplate["intensity"], tagline: string, segments: Segment[]): WorkoutTemplate {
  const duration = segments.reduce((sum, part) => sum + part.minutes, 0);
  return {
    id: `short-${id}`, name, kind, intensity, tagline, segments, duration,
    points: intensity === "easy" ? 0.5 : intensity === "hard" && duration === 20 ? 2 : 1,
    xp: Math.round(duration * (intensity === "hard" ? 3 : intensity === "moderate" ? 2 : 1.5)),
    description: `${tagline} Mise en route et retour au calme compris dans les ${duration} minutes.${intensity === "hard" ? " Garde des efforts contrôlés, jamais maximaux, et allège selon ton ressenti. Cette séance compte dans le plafond hebdomadaire de séances intenses." : ""}`
  };
}

// Reference cadences: the reader applies the user's cadence offset once.
export const shortWorkouts: WorkoutTemplate[] = [
  shortWorkout("loosen-10", "Délier les jambes", "recovery", "easy", "Dix minutes de souplesse, avec une résistance qui monte puis redescend doucement.", [
    segment("Réveil", 2, "3–4", "2"), segment("Trouver la fluidité", 3, "4–6", "2–3", "75–85"),
    segment("Détendre le geste", 3, "4–5", "2–3", "75–85"), segment("Relâchement", 2, "2–3", "1–2")
  ]),
  shortWorkout("cadence-12", "Jeu de cadence", "ladder", "moderate", "Trois paliers de cadence pour varier le rythme à résistance modérée.", [
    segment("Mise en route", 3, "4–6", "2–3"), segment("Premier rythme", 2, "7–9", "4", "75–85"),
    segment("Deuxième rythme", 2, "7–9", "4–5", "80–90"), segment("Troisième rythme", 2, "7–9", "5", "85–95"),
    segment("Retour au calme", 3, "3–5", "2")
  ]),
  shortWorkout("breathing-15", "Souffle léger", "endurance", "easy", "Un roulage facile et continu pour profiter d’un quart d’heure disponible.", [
    segment("Installation", 3, "3–5", "2"), segment("Souffle confortable", 9, "5–7", "3", "75–85"), segment("Retour au calme", 3, "3–4", "2")
  ]),
  shortWorkout("tempo-15", "Tempo compact", "threshold", "moderate", "Deux plateaux soutenus séparés par une minute pour retrouver ton souffle.", [
    segment("Mise en route", 3, "4–7", "2–3"), segment("Tempo I", 4, "9–12", "5–6", "80–90"),
    segment("Respiration", 1, "4–6", "3"), segment("Tempo II", 4, "9–12", "5–6", "80–90"), segment("Retour au calme", 3, "3–5", "2")
  ]),
  shortWorkout("pyramid-18", "Pyramide courte", "ladder", "moderate", "Gravis trois marches, puis redescends les mêmes paliers sans sprint final.", [
    segment("Mise en route", 3, "4–6", "2–3"), segment("Marche I", 2, "7–9", "4", "75–85"),
    segment("Marche II", 2, "9–11", "5", "75–85"), segment("Sommet maîtrisé", 4, "11–13", "6", "75–85"),
    segment("Descente II", 2, "9–11", "5", "75–85"), segment("Descente I", 2, "7–9", "4", "75–85"), segment("Retour au calme", 3, "3–5", "2")
  ]),
  shortWorkout("waves-20", "Trois vagues", "hills", "moderate", "Trois bosses de deux minutes, chacune suivie d’une vraie récupération.", [
    segment("Mise en route", 4, "4–7", "2–3"),
    ...Array.from({ length: 3 }, (_, i) => [segment(`Bosse ${i + 1}`, 2, "10–13", "5–6", "75–85"), segment(`Vallée ${i + 1}`, 2, "5–7", "3", "75–85")]).flat(),
    segment("Retour au calme", 4, "3–5", "2")
  ]),
  shortWorkout("intervals-20", "Relances contrôlées", "hiit", "hard", "Cinq relances d’une minute : alterne effort franc et récupération, puis stabilise le rythme.", [
    segment("Mise en route progressive", 4, "4–9", "2–4"),
    ...Array.from({ length: 5 }, (_, i) => [segment(`Relance ${i + 1}`, 1, "14–18", "7–8", "85–95"), segment(`Récupération ${i + 1}`, 1, "4–6", "2–3")]).flat(),
    segment("Rythme retrouvé", 3, "6–8", "3–4", "75–85"), segment("Retour au calme", 3, "3–5", "2")
  ]),
  shortWorkout("climbs-20", "Double ascension", "hills", "hard", "Deux montées assises, une vallée centrale et un retour au calme généreux.", [
    segment("Mise en route progressive", 4, "4–9", "2–4"), segment("Première ascension", 4, "14–17", "7", "70–80"),
    segment("Vallée", 3, "4–6", "2–3"), segment("Seconde ascension", 5, "15–19", "7–8", "70–80"), segment("Retour au calme", 4, "3–5", "2")
  ])
];

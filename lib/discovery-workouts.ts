import type { WorkoutTemplate } from "./types";

export const discoveryWorkouts: WorkoutTemplate[] = [
  {
    id: "contemplative-25", name: "Roulage contemplatif", tagline: "Vingt-cinq minutes pour pédaler sans te presser.",
    kind: "endurance", duration: 25, points: 1, xp: 40, intensity: "easy",
    description: "Un format doux, facile à placer entre deux séances plus exigeantes. Garde une respiration confortable et ajuste le niveau pour rester à RPE 2–4.",
    segments: [
      { label: "Prendre son rythme", minutes: 5, resistance: "5–7", rpe: "2–3", cadence: "70–85" },
      { label: "Pédalage tranquille", minutes: 15, resistance: "7–9", rpe: "3–4", cadence: "75–90" },
      { label: "Revenir au calme", minutes: 5, resistance: "4–6", rpe: "2", cadence: "libre" }
    ]
  },
  {
    id: "fluid-cadence-30", name: "Cadence fluide", tagline: "Changer de cadence, garder le même confort.",
    kind: "ladder", duration: 30, points: 1, xp: 45, intensity: "easy",
    description: "Une échelle de cadence à faible résistance, sans sprint. La cadence est une proposition : réduis-la si le mouvement devient heurté et garde un RPE 3–4.",
    segments: [
      { label: "Mise en route", minutes: 5, resistance: "5–7", rpe: "2–3", cadence: "70–80" },
      { label: "Souplesse I", minutes: 5, resistance: "7–9", rpe: "3–4", cadence: "75–85" },
      { label: "Souplesse II", minutes: 5, resistance: "6–8", rpe: "3–4", cadence: "80–90" },
      { label: "Souplesse III", minutes: 5, resistance: "5–7", rpe: "3–4", cadence: "85–95" },
      { label: "Redescendre la cadence", minutes: 5, resistance: "6–8", rpe: "3–4", cadence: "75–85" },
      { label: "Retour au calme", minutes: 5, resistance: "4–6", rpe: "2", cadence: "libre" }
    ]
  },
  {
    id: "little-waves-40", name: "Petites vagues", tagline: "Deux ondulations, des récupérations et aucun mur.",
    kind: "hills", duration: 40, points: 2, xp: 65, intensity: "moderate",
    description: "Une séance vallonnée accessible : deux petites montées séparées par du roulage facile. Les niveaux restent indicatifs ; conserve le contrôle du souffle et allège si nécessaire.",
    segments: [
      { label: "Départ roulant", minutes: 6, resistance: "6–8", rpe: "2–3", cadence: "75–90" },
      { label: "Première ondulation", minutes: 7, resistance: "10–12", rpe: "4–5", cadence: "75–85" },
      { label: "Descente et relâchement", minutes: 7, resistance: "5–7", rpe: "2–3", cadence: "libre" },
      { label: "Deuxième ondulation", minutes: 8, resistance: "11–13", rpe: "4–5", cadence: "75–85" },
      { label: "Faux-plat souple", minutes: 7, resistance: "8–10", rpe: "3–4", cadence: "75–90" },
      { label: "Retour au calme", minutes: 5, resistance: "4–6", rpe: "2", cadence: "libre" }
    ]
  },
  {
    id: "bonus-soft-12", name: "Parenthèse souple", tagline: "Douze minutes de mouvement, sans chercher un record.",
    kind: "bonus", duration: 12, points: 0, xp: 18, intensity: "easy", bonus: true,
    description: "Un micro-bonus très doux, soumis au plafond commun de 60 XP par semaine. Ne remplace pas une séance structurée.",
    segments: [
      { label: "Départ tranquille", minutes: 3, resistance: "4–6", rpe: "2", cadence: "libre" },
      { label: "Délier les jambes", minutes: 6, resistance: "5–7", rpe: "2–3", cadence: "70–85" },
      { label: "Terminer doucement", minutes: 3, resistance: "4–5", rpe: "2", cadence: "libre" }
    ]
  }
];

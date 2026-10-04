import type { WorkoutTemplate } from "./types";

export const discoveryWorkouts: WorkoutTemplate[] = [
  {
    id: "first-pedals-15", name: "Premiers tours de roue", tagline: "Une première séance pour découvrir les consignes, à ton rythme.",
    kind: "recovery", duration: 15, points: 1, xp: 25, intensity: "easy",
    description: "Règle la résistance à la main. Le ressenti d’effort (RPE) va de 1, très facile, à 10, maximal. Ici, garde un effort confortable de 2 à 3 : les niveaux sont des repères que tu peux diminuer. À la fin, indique ton ressenti pour aider le coach à choisir la suite.",
    segments: [
      { label: "Découvrir le pédalage", minutes: 4, resistance: "4–5", rpe: "2", cadence: "libre" },
      { label: "Trouver un rythme confortable", minutes: 7, resistance: "5–7", rpe: "2–3", cadence: "libre" },
      { label: "Revenir doucement au calme", minutes: 4, resistance: "4–5", rpe: "2", cadence: "libre" }
    ]
  },
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
  },
  {
    id: "breathing-18", name: "Souffle tranquille", tagline: "Dix-huit minutes pour trouver ton confort.",
    kind: "recovery", duration: 18, points: 1, xp: 30, intensity: "easy",
    description: "Un rythme auquel tu peux parler facilement. Ajuste la résistance manuellement pour rester à RPE 2–3 ; la durée ne constitue pas un objectif de vitesse.",
    segments: [
      { label: "Se mettre en mouvement", minutes: 3, resistance: "4–5", rpe: "2", cadence: "libre" },
      { label: "Respiration confortable", minutes: 12, resistance: "5–7", rpe: "2–3", cadence: "70–85" },
      { label: "Relâcher", minutes: 3, resistance: "4–5", rpe: "2", cadence: "libre" }
    ]
  },
  {
    id: "soft-cadence-20", name: "Cadence douce", tagline: "Quatre petits paliers, sans sprint.",
    kind: "ladder", duration: 20, points: 1, xp: 35, intensity: "easy",
    description: "Change doucement de cadence sans durcir l’effort. Les tours par minute sont indicatifs : privilégie un mouvement souple et réduis le niveau si nécessaire.",
    segments: [
      { label: "Cadence de départ", minutes: 5, resistance: "4–6", rpe: "2", cadence: "65–75" },
      { label: "Un peu plus fluide", minutes: 5, resistance: "5–7", rpe: "2–3", cadence: "70–80" },
      { label: "Souplesse", minutes: 5, resistance: "5–7", rpe: "3", cadence: "75–85" },
      { label: "Redescendre tranquillement", minutes: 5, resistance: "4–6", rpe: "2", cadence: "libre" }
    ]
  },
  {
    id: "false-flats-20", name: "Faux-plats en douceur", tagline: "Une ondulation légère et un retour facile.",
    kind: "progressive", duration: 20, points: 1, xp: 35, intensity: "easy",
    description: "Découvre les changements de résistance avec une seule petite ondulation. Les niveaux 1–32 du TEB5 se règlent à la main ; reste entre RPE 2 et 4.",
    segments: [
      { label: "Terrain roulant", minutes: 5, resistance: "5–7", rpe: "2–3", cadence: "70–85" },
      { label: "Premier faux-plat", minutes: 5, resistance: "7–9", rpe: "3", cadence: "70–85" },
      { label: "Petite ondulation", minutes: 5, resistance: "8–10", rpe: "3–4", cadence: "70–85" },
      { label: "Retour facile", minutes: 5, resistance: "4–6", rpe: "2", cadence: "libre" }
    ]
  },
  {
    id: "two-hills-25", name: "Deux petites collines", tagline: "Deux efforts courts séparés par une vraie récupération.",
    kind: "hills", duration: 25, points: 2, xp: 45, intensity: "moderate",
    description: "Une première séance vallonnée courte, lorsque les séances faciles sont confortables. Vise RPE 4–5 sur les deux collines et allège librement la résistance.",
    segments: [
      { label: "Échauffement roulant", minutes: 5, resistance: "6–8", rpe: "2–3", cadence: "70–85" },
      { label: "Première colline", minutes: 5, resistance: "10–12", rpe: "4–5", cadence: "70–85" },
      { label: "Descente et récupération", minutes: 5, resistance: "5–7", rpe: "2–3", cadence: "libre" },
      { label: "Deuxième colline", minutes: 5, resistance: "11–13", rpe: "4–5", cadence: "70–85" },
      { label: "Retour au calme", minutes: 5, resistance: "4–6", rpe: "2", cadence: "libre" }
    ]
  },
  {
    id: "nomadic-endurance-30", name: "Endurance nomade", tagline: "Des changements de rythme, toujours faciles.",
    kind: "endurance", duration: 30, points: 1, xp: 45, intensity: "easy",
    description: "Alterne deux plages de pédalage régulier avec un passage plus souple. Aucun sprint : conserve RPE 2–4 et choisis une cadence confortable.",
    segments: [
      { label: "Départ", minutes: 5, resistance: "5–7", rpe: "2–3", cadence: "70–80" },
      { label: "Rythme régulier", minutes: 7, resistance: "7–9", rpe: "3–4", cadence: "75–85" },
      { label: "Respirer et relâcher", minutes: 6, resistance: "5–7", rpe: "2–3", cadence: "70–80" },
      { label: "Deuxième passage", minutes: 7, resistance: "7–9", rpe: "3–4", cadence: "75–85" },
      { label: "Retour au calme", minutes: 5, resistance: "4–6", rpe: "2", cadence: "libre" }
    ]
  },
  {
    id: "bonus-pause-8", name: "Pause active", tagline: "Huit minutes pour délier les jambes.",
    kind: "bonus", duration: 8, points: 0, xp: 12, intensity: "easy", bonus: true,
    description: "Un bonus doux, dans le plafond commun de 60 XP par semaine. Ce petit format ne valide pas un programme guidé et ne remplace pas une séance structurée.",
    segments: [
      { label: "Commencer doucement", minutes: 3, resistance: "4–5", rpe: "2", cadence: "libre" },
      { label: "Délier les jambes", minutes: 3, resistance: "5–6", rpe: "2–3", cadence: "libre" },
      { label: "Terminer", minutes: 2, resistance: "4–5", rpe: "2", cadence: "libre" }
    ]
  }
];

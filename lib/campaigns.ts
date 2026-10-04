import type { CompletedSession } from "./types";
import { isRouteCompleted } from "./progression";

export type Campaign = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  routeIds: string[];
  xpBonus: number;
  difficultyLabel: string;
};

export const campaigns: Campaign[] = [
  {
    id: "provence-discovery",
    title: "Découverte Provence",
    subtitle: "4 étapes accessibles",
    description: "Construis de l’endurance avec des profils roulants, des bosses courtes et de vraies descentes.",
    icon: "🌿",
    routeIds: ["sorgue-velleron-loop","vaison-medieval-loop","uchaux-loop","enclave-papes-loop"],
    xpBonus: 500,
    difficultyLabel: "2–3/5"
  },
  {
    id: "rolling-tour",
    title: "Tour Vallonné",
    subtitle: "Du roulant aux Corniches",
    description: "Une progression variée jusqu’à une étape plus longue sur la Côte d’Azur.",
    icon: "🌊",
    routeIds: ["vaison-medieval-loop","enclave-papes-loop","nice-corniches-loop"],
    xpBonus: 600,
    difficultyLabel: "2–3/5"
  },
  {
    id: "tour-legends-campaign",
    title: "Légendes du Tour",
    subtitle: "4 monuments",
    description: "Alpe d’Huez, Ventoux, Tourmalet et Galibier : le premier grand objectif montagne.",
    icon: "🏆",
    routeIds: ["alpe-dhuez","ventoux-bedoin","tourmalet-est","galibier-valloire"],
    xpBonus: 1000,
    difficultyLabel: "4–5/5"
  },
  {
    id: "alpine-gauntlet",
    title: "Défi des Alpes",
    subtitle: "La campagne reine",
    description: "Madeleine, Glandon, Croix-de-Fer, Iseran puis l’étape Chaussy + Madeleine.",
    icon: "👑",
    routeIds: ["madeleine-maurienne","glandon-cuines","croix-de-fer-maurienne","iseran-bonneval","chaussy-madeleine-stage"],
    xpBonus: 1400,
    difficultyLabel: "4–5/5"
  },
  {
    id: "waterside-notebook", title: "Au fil de l’eau", subtitle: "Carnet de 4 balades",
    description: "Du Der à Annecy, du Marais poitevin au canal du Midi : quatre paysages d’eau, à découvrir sans objectif de vitesse et avec des pauses libres.",
    icon: "🦢",
    routeIds: ["lac-der-balade", "annecy-rive-ouest", "marais-poitevin-coulon-damvix", "canal-midi-carcassonne"],
    xpBonus: 450, difficultyLabel: "1/5 · rythme doux"
  },
  {
    id: "quiet-heritage", title: "Échappées patrimoine", subtitle: "Carnet de 3 balades",
    description: "Chambord, la campagne de l’île de Ré et les berges du Cher jusqu’à Villandry : trois traversées pour associer mouvement et découverte.",
    icon: "🏰", routeIds: ["chambord-petit-tour", "re-chemins-campagne", "loire-tours-villandry"],
    xpBonus: 300, difficultyLabel: "1/5 · rythme doux"
  }
];

export function completedRouteIds(sessions: CompletedSession[]) {
  return new Set(
    sessions
      .filter(isRouteCompleted)
      .map((session) => session.routeId!)
  );
}

export function campaignProgress(campaign: Campaign, sessions: CompletedSession[]) {
  const completed = completedRouteIds(sessions);
  const completedStages = campaign.routeIds.filter((routeId) => completed.has(routeId)).length;
  const nextRouteId = campaign.routeIds.find((routeId) => !completed.has(routeId));
  const complete = completedStages === campaign.routeIds.length;

  return {
    completedRouteIds: completed,
    completedStages,
    totalStages: campaign.routeIds.length,
    percent: Math.round((completedStages / Math.max(1, campaign.routeIds.length)) * 100),
    nextRouteId,
    complete
  };
}

export function campaignBonusXp(sessions: CompletedSession[]) {
  return campaigns.reduce((sum, campaign) => {
    return sum + (campaignProgress(campaign, sessions).complete ? campaign.xpBonus : 0);
  }, 0);
}

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
  group?: "discovery" | "sport";
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
  },
  {
    id: "azure-passport", title: "Passeport azuréen", subtitle: "3 balades au bord de mer",
    description: "Golfe-Juan–Cannes, la traversée depuis Cagnes et la promenade mentonnaise : prends le temps de découvrir les ports et les villes. Le format court et le trajet complet sont deux étapes distinctes.",
    icon: "🍋", routeIds: ["golfe-juan-cannes-balade", "cagnes-cannes-littoral", "menton-garavan-promenade"],
    xpBonus: 320, difficultyLabel: "1/5 · pauses libres", group: "discovery"
  },
  {
    id: "riviera-corniches", title: "Les deux Corniches", subtitle: "3 étapes de la Riviera",
    description: "Èze-sur-Mer et Monaco par la Basse Corniche, Nice–Menton par les hauteurs, puis le Tour des Corniches. Une même côte se découvre depuis trois profils différents.",
    icon: "🌅", routeIds: ["eze-menton-basse-corniche", "nice-menton-grande-corniche", "nice-corniches-loop"],
    xpBonus: 600, difficultyLabel: "2–3/5", group: "sport"
  },
  {
    id: "verdon-journal", title: "Carnet du Verdon", subtitle: "3 paysages d’eau et de roche",
    description: "Le lac de Sainte-Croix et son plateau, les lacs de Castellane, puis la Route des Crêtes. Progresse des villages aux rampes du Grand Canyon, avec des descentes pour récupérer.",
    icon: "🦅", routeIds: ["sainte-croix-valensole", "castellane-deux-lacs", "verdon-route-cretes"],
    xpBonus: 750, difficultyLabel: "2–4/5", group: "sport"
  },
  {
    id: "provence-postcards", title: "Cartes postales de Provence", subtitle: "3 sorties entre villages et vallées",
    description: "Le Calavon jusqu’à Apt, les petites routes de Velleron et le tour du rocher des Baux. Découvre trois ambiances provençales à ton rythme.",
    icon: "🫒", routeIds: ["luberon-calavon", "sorgue-velleron-loop", "baux-alpilles-rocher"],
    xpBonus: 400, difficultyLabel: "1–2/5", group: "discovery"
  },
  {
    id: "coast-to-coast", title: "Les horizons marins", subtitle: "4 escales en France",
    description: "Camargue gardoise, baie de Somme, Bretagne et île de Ré : ports, marais et estuaires. La Bretagne apporte les bosses ; chaque escale complète compte, quel que soit l’ordre.",
    icon: "⚓", routeIds: ["camargue-grau-gallician", "baie-somme-cayeux-crotoy", "bretagne-roscoff-morlaix", "re-chemins-campagne"],
    xpBonus: 650, difficultyLabel: "1–2/5", group: "discovery"
  },
  {
    id: "canals-and-castles", title: "Canaux et châteaux", subtitle: "4 étapes de patrimoine",
    description: "Chambord, Blois–Chaumont, le canal du Midi et le canal d’Alsace vers Strasbourg. Un carnet de découverte, sans condition de chrono ni de connexion au vélo.",
    icon: "🗝️", routeIds: ["chambord-petit-tour", "loire-blois-chaumont", "canal-midi-carcassonne", "alsace-erstein-strasbourg"],
    xpBonus: 500, difficultyLabel: "1–2/5", group: "discovery"
  },
  {
    id: "southern-alps", title: "Des forêts aux cimes", subtitle: "2 grandes traversées des Alpes du Sud",
    description: "Franchis le Turini entre Vésubie et Sospel, puis la Bonette entre Ubaye et Tinée. Deux étapes exigeantes à préparer avec des sorties plus douces entre les ascensions.",
    icon: "🏔️", routeIds: ["turini-vesubie-sospel", "bonette-ubaye-tinee"],
    xpBonus: 900, difficultyLabel: "4–5/5", group: "sport"
  },
  { id: "napoleon-paca", title: "Route Napoléon · de la mer à Gap", subtitle: "Carnet de 8 étapes · ordre libre", icon: "🦅", group: "sport", difficultyLabel: "2–3/5", xpBonus: 900,
    description: "Golfe-Juan, Grasse, Saint-Vallier, Séranon, Castellane, Barrême, Digne, Sisteron et Gap : huit tronçons routiers, à enchaîner au fil de tes séances dans l’ordre de ton choix. La partie au-delà de Gap n’est pas incluse. Chaque étape complète compte une seule fois pour le carnet.",
    routeIds: ["napoleon-golfe-grasse", "napoleon-grasse-vallier", "napoleon-vallier-seranon", "napoleon-seranon-castellane", "napoleon-castellane-barreme", "napoleon-barreme-digne", "napoleon-digne-sisteron", "napoleon-sisteron-gap"] },
  { id: "southern-escales", title: "Escales du Sud", subtitle: "5 petits formats", icon: "☀️", group: "discovery", difficultyLabel: "1–2/5", xpBonus: 220,
    description: "Antibes, Èze-sur-Mer, les Baux, le pays de Riez et Menton : des sorties courtes de 15 à 30 minutes. Le tronçon de Riez comporte des rampes ; choisis librement ton étape et ton niveau d’effort.",
    routeIds: ["antibes-golfe-juan-short", "eze-cap-ail-short", "baux-maussane-short", "riez-montagnac-short", "menton-garavan-promenade"] },
  { id: "half-hour-postcards", title: "Un paysage en 30 minutes", subtitle: "4 escales au fil de l’eau", icon: "📮", group: "discovery", difficultyLabel: "1/5", xpBonus: 180,
    description: "Sevrier–Annecy, le Grau-du-Roi–Aigues-Mortes, Cayeux–Le Hourdel et Candé–Chaumont. Quatre tronçons indépendants ; terminer un format court ne valide pas le parcours complet dont il est extrait.",
    routeIds: ["sevrier-annecy-short", "grau-aigues-short", "cayeux-hourdel-short", "cande-chaumont-short"] },
  { id: "napoleon-dauphine", title: "Route Napoléon · de Gap à Grenoble", subtitle: "Carnet de 6 étapes · ordre libre", icon: "🏔️", group: "sport", difficultyLabel: "2–3/5", xpBonus: 700,
    description: "Col Bayard, Champsaur, Corps, La Mure, Laffrey, Vizille, Brié et Eybens : six tronçons jusqu’à Grenoble. Chaque étape complète compte une seule fois. Ce carnet ajoute un objectif distinct ; les huit étapes et les 900 XP du carnet de la mer à Gap restent inchangés.",
    routeIds: ["napoleon-gap-fare", "napoleon-fare-corps", "napoleon-corps-mure", "napoleon-mure-laffrey", "napoleon-laffrey-vizille", "napoleon-vizille-grenoble"] },
  { id: "esterel-notebook", title: "Estérel · entre mer et forêt", subtitle: "4 étapes · ordre libre", icon: "🪨", group: "sport", difficultyLabel: "1–3/5", xpBonus: 600,
    description: "Trois étapes sur la Corniche d’Or, de Saint-Raphaël à Théoule par Agay, Anthéor et Le Trayas, puis un retour plus long par l’intérieur de l’Estérel. Chaque parcours complet compte une seule fois ; les deux formats courts ne remplacent pas leurs étapes parentes.",
    routeIds: ["esterel-raphael-agay", "esterel-agay-trayas", "esterel-trayas-theoule", "esterel-theoule-raphael"] },
  { id: "esterel-parentheses", title: "Parenthèses de l’Estérel", subtitle: "2 petites échappées", icon: "🌊", group: "discovery", difficultyLabel: "1/5", xpBonus: 100,
    description: "Saint-Raphaël–Boulouris et Agay–Anthéor : deux courts extraits de 15 à 30 minutes, au rythme de la découverte. Un carnet indépendant : ces sorties ne valident ni les longues étapes ni le trophée des trois étapes côtières.",
    routeIds: ["esterel-raphael-boulouris-short", "esterel-agay-antheor-short"] },
  { id: "napoleon-short-notebook", title: "Route Napoléon · petites escales", subtitle: "4 formats de 15 à 30 minutes", icon: "🦅", group: "discovery", difficultyLabel: "1/5", xpBonus: 180,
    description: "Golfe-Juan–Cannes, Mougins–Mouans-Sartoux, Malijai–Château-Arnoux et Saint-Théoffrey–Laffrey : quatre extraits doux, à faire dans l’ordre de ton choix. Un bonus unique et une validation propre à chaque escale, sans terminer les grandes étapes dont elles sont issues.",
    routeIds: ["napoleon-golfe-cannes-short", "napoleon-mougins-mouans-short", "napoleon-malijai-chateau-short", "napoleon-theoffrey-laffrey-short"] },
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

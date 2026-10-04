import type { Badge, CompletedSession } from "./types";
import { climbs, routeDifficulty } from "./routes";
import { completedRouteIds } from "./campaigns";
import { discoveryTerritories, routeThemes } from "./route-themes";
import { shortRouteIds } from "./short-rides";
import { napoleonRouteIds } from "./napoleon-routes";

export function discoveryBadges(sessions: CompletedSession[]): Badge[] {
  const completed = completedRouteIds(sessions);
  const nativeRoutes = climbs.filter((route) => completed.has(route.id));
  const pacaCount = discoveryTerritories.find((area) => area.title === "PACA")!.routeIds.filter((id) => completed.has(id)).length;
  const azureCount = routeThemes.find((theme) => theme.id === "azure")!.routeIds.filter((id) => completed.has(id)).length;
  const territories = discoveryTerritories.filter((area) => area.routeIds.some((id) => completed.has(id))).length;
  const difficulties = new Set(nativeRoutes.map(routeDifficulty)).size;
  const shortCount = shortRouteIds.filter((id) => completed.has(id)).length;
  const napoleonCount = napoleonRouteIds.filter((id) => completed.has(id)).length;
  return [
    { id: "short-three", name: "Petites échappées", icon: "🌼", description: "Terminer 3 formats courts différents parmi les 13 tronçons de 15 à 30 minutes du carnet. Pauses libres.", target: 3, count: shortCount },
    { id: "short-six", name: "Collection de parenthèses", icon: "🧺", description: "Terminer 6 formats courts différents parmi les 13 du carnet. Répéter un tronçon ne compte pas comme une nouvelle découverte.", target: 6, count: shortCount },
    { id: "napoleon-three", name: "Premiers aigles", icon: "🦅", description: "Terminer 3 tronçons différents de la Route Napoléon entre Golfe-Juan et Gap. Aucun ordre imposé.", target: 3, count: napoleonCount },
    { id: "discovery-ten", name: "Carnet de voyage", icon: "📓", description: "Terminer 10 parcours natifs différents, de toute difficulté.", target: 10, count: nativeRoutes.length },
    { id: "discovery-twenty", name: "Grand voyageur", icon: "🧳", description: "Terminer 20 parcours natifs différents. Les répétitions ne comptent pas comme de nouvelles découvertes.", target: 20, count: nativeRoutes.length },
    { id: "paca-six", name: "Enfant du Sud", icon: "☀️", description: "Terminer 6 parcours différents parmi les 18 destinations PACA du carnet : littoral, Provence, Verdon et Alpes du Sud.", target: 6, count: pacaCount },
    { id: "azure-three", name: "Riviera en poche", icon: "🍋", description: "Terminer 3 parcours différents du thème Côte d’Azur, balades ou Corniches.", target: 3, count: azureCount },
    { id: "four-horizons", name: "Aux quatre horizons", icon: "🧭", description: "Terminer au moins un parcours dans 4 des 10 territoires de découverte : PACA, Bretagne, Somme, Alsace, Val de Loire, Champagne, Ré, Marais poitevin, Midi, Camargue gardoise.", target: 4, count: territories },
    { id: "five-difficulties", name: "Toute la palette", icon: "🎨", description: "Terminer au moins un parcours natif à chaque difficulté, de 1/5 à 5/5. Aucun chrono imposé.", target: 5, count: difficulties }
  ].map(({ target, count, ...badge }) => ({ ...badge, unlocked: count >= target, progress: `${Math.min(count, target)}/${target}` }));
}

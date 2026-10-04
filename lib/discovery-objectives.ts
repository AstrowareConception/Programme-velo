import type { Badge, CompletedSession } from "./types";
import { climbs, routeDifficulty } from "./routes";
import { completedRouteIds } from "./campaigns";
import { discoveryTerritories, routeThemes } from "./route-themes";

export function discoveryBadges(sessions: CompletedSession[]): Badge[] {
  const completed = completedRouteIds(sessions);
  const nativeRoutes = climbs.filter((route) => completed.has(route.id));
  const pacaCount = discoveryTerritories.find((area) => area.title === "PACA")!.routeIds.filter((id) => completed.has(id)).length;
  const azureCount = routeThemes.find((theme) => theme.id === "azure")!.routeIds.filter((id) => completed.has(id)).length;
  const territories = discoveryTerritories.filter((area) => area.routeIds.some((id) => completed.has(id))).length;
  const difficulties = new Set(nativeRoutes.map(routeDifficulty)).size;
  return [
    { id: "discovery-ten", name: "Carnet de voyage", icon: "📓", description: "Terminer 10 parcours natifs différents, de toute difficulté.", target: 10, count: nativeRoutes.length },
    { id: "discovery-twenty", name: "Grand voyageur", icon: "🧳", description: "Terminer 20 parcours natifs différents. Les répétitions ne comptent pas comme de nouvelles découvertes.", target: 20, count: nativeRoutes.length },
    { id: "paca-six", name: "Enfant du Sud", icon: "☀️", description: "Terminer 6 parcours différents parmi les 18 destinations PACA du carnet : littoral, Provence, Verdon et Alpes du Sud.", target: 6, count: pacaCount },
    { id: "azure-three", name: "Riviera en poche", icon: "🍋", description: "Terminer 3 parcours différents du thème Côte d’Azur, balades ou Corniches.", target: 3, count: azureCount },
    { id: "four-horizons", name: "Aux quatre horizons", icon: "🧭", description: "Terminer au moins un parcours dans 4 des 10 territoires de découverte : PACA, Bretagne, Somme, Alsace, Val de Loire, Champagne, Ré, Marais poitevin, Midi, Camargue gardoise.", target: 4, count: territories },
    { id: "five-difficulties", name: "Toute la palette", icon: "🎨", description: "Terminer au moins un parcours natif à chaque difficulté, de 1/5 à 5/5. Aucun chrono imposé.", target: 5, count: difficulties }
  ].map(({ target, count, ...badge }) => ({ ...badge, unlocked: count >= target, progress: `${Math.min(count, target)}/${target}` }));
}

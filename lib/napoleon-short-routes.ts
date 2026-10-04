import type { ClimbChallenge } from "./routes";
import { napoleonRoutes } from "./napoleon-routes";
import { napoleonNorthRoutes } from "./napoleon-north-routes";
import profiles from "./napoleon-short-profiles.json";

const destinations = [
  { id: "napoleon-golfe-cannes-short", parentRouteId: "napoleon-golfe-grasse", name: "Route Napoléon · Golfe-Juan → Cannes", subtitle: "La première escale, côté route historique",
    scenery: "Golfe-Juan rappelle le débarquement de mars 1815, point de départ de l’épopée qui donne son nom à la route. Ce petit tronçon gagne Cannes par le tracé touristique publié, depuis un départ routier situé au nord du front de mer. Le paysage mêle quartiers habités, jardins et reliefs proches de la côte, avec un profil peu marqué. L’arrivée rejoint Cannes sur la route, avant la remontée vers Le Cannet et Grasse. Il ne s’agit pas de la balade existante par Palm Beach et la Croisette : la géométrie, les repères et l’objectif sont distincts. Le trajet n’ajoute ni passage par le Palais des Festivals ni visite du Suquet.",
    highlights: ["Golfe-Juan", "Route Napoléon", "Cannes"] },
  { id: "napoleon-mougins-mouans-short", parentRouteId: "napoleon-golfe-grasse", name: "Route Napoléon · Mougins → Mouans-Sartoux", subtitle: "Une escale entre Cannes et le pays des parfums",
    scenery: "Le départ se situe sur la Route Napoléon dans le secteur routier de Mougins. Le village perché appartient aux environs, mais la trace ne quitte pas la route pour en parcourir les ruelles. Les quartiers, les jardins et les collines accompagnent la transition vers Mouans-Sartoux, commune entre Cannes et Grasse. Ce court passage offre une autre lecture de l’arrière-pays azuréen, avec des ondulations douces plutôt qu’une grande montée. L’arrivée retrouve la trace touristique à Mouans-Sartoux ; le château et ses expositions restent des visites séparées. Cette escale ne poursuit pas jusqu’à Grasse et ne valide pas l’étape complète depuis Golfe-Juan.",
    highlights: ["Mougins · secteur routier", "Arrière-pays azuréen", "Mouans-Sartoux"] },
  { id: "napoleon-malijai-chateau-short", parentRouteId: "napoleon-digne-sisteron", name: "Route Napoléon · Malijai → Château-Arnoux", subtitle: "Une courte traversée de Haute-Provence",
    scenery: "À Malijai, le souvenir de la halte impériale donne au voyage une note historique, dans les paysages de la vallée de la Bléone et de la Durance. Le tracé touristique rejoint ensuite Château-Arnoux-Saint-Auban par une portion peu accidentée, où les espaces ouverts alternent avec les secteurs habités. Cette courte traversée privilégie la découverte du pays plutôt que l’ascension. Les châteaux et le patrimoine des communes donnent des points d’intérêt, sans visite ajoutée à la trace. Volonne reste de l’autre côté de la vallée et Sisteron plus au nord : ni détour vers ces villes ni validation de toute l’étape Digne–Sisteron ne sont compris.",
    highlights: ["Malijai", "Haute-Provence", "Château-Arnoux-Saint-Auban"] },
  { id: "napoleon-theoffrey-laffrey-short", parentRouteId: "napoleon-mure-laffrey", name: "Route Napoléon · Saint-Théoffrey → Laffrey", subtitle: "Le plateau matheysin en petite escale",
    scenery: "Saint-Théoffrey ouvre une parenthèse sur le plateau matheysin, dans les reliefs et les paysages autour de ses lacs. La route poursuit vers Laffrey avec des ondulations modestes et une tendance descendante. À l’approche de l’arrivée, le secteur de la Prairie de la Rencontre rappelle un moment décisif du retour de Napoléon en mars 1815. Le monument se trouve à l’écart de la route, vers le lac : il est signalé comme lieu voisin, sans visite simulée. Le parcours rejoint Laffrey et s’y arrête. Il ne fait pas le tour des lacs, ne valide pas toute l’étape depuis La Mure et n’emprunte pas la grande descente vers Vizille.",
    highlights: ["Saint-Théoffrey", "Matheysine", "Prairie de la Rencontre · à proximité", "Laffrey"] }
] as const;

export const napoleonShortRouteIds = destinations.map((route) => route.id);
const parents = new Map([...napoleonRoutes, ...napoleonNorthRoutes].map((route) => [route.id, route]));
export const napoleonShortRoutes: ClimbChallenge[] = destinations.map((destination) => {
  const data = profiles[destination.id];
  const parent = parents.get(destination.parentRouteId)!;
  return {
    ...destination, ...data, coordinates: data.coordinates.map(([lat, lon]) => [lat, lon]),
    highlights: [...destination.highlights], region: parent.region,
    sourceLabel: parent.sourceLabel, sourceUrl: parent.sourceUrl,
    category: "scenic", difficulty: 1, effort: "easy", xp: 45, points: 1,
    tags: ["Route Napoléon", "court", "15–30 min", "escale"],
    note: `Court extrait du parcours ${parent.name}, issu du même GPX publié avec altitudes IGN lissées. Validation indépendante : cette escale ne termine pas son parcours parent et ne compte pas pour les trophées des quatorze grandes étapes. ${data.provenance.section} Effort doux RPE 2–4 ; mode manuel sur 32 niveaux, pauses libres. Durée simulée, sans navigation extérieure.`
  };
});

import type { ClimbChallenge } from "./routes";
import { scenicRoutes } from "./scenic-routes";
import { explorationRoutes } from "./exploration-routes";
import profiles from "./short-rides-profiles.json";

const destinations = [
  { id: "antibes-golfe-juan-short", parentRouteId: "cagnes-cannes-littoral", name: "Antibes → Golfe-Juan", subtitle: "Ports et plages par Juan-les-Pins", difficulty: 1,
    scenery: "Le vieux port d’Antibes ouvre cette parenthèse azuréenne. La route quitte les remparts, rejoint Juan-les-Pins et retrouve ses plages avant de gagner Golfe-Juan. Quelques ondulations suffisent à changer de perspective, entre les façades de la station et la Méditerranée. Ce tronçon ne fait pas le tour du cap d’Antibes et s’arrête au vieux port de Golfe-Juan : Cannes reste pour une prochaine balade.", highlights: ["Antibes", "Juan-les-Pins", "Golfe-Juan"] },
  { id: "eze-cap-ail-short", parentRouteId: "eze-menton-basse-corniche", name: "Èze-sur-Mer → Cap-d’Ail", subtitle: "Une courte fenêtre sur la Basse Corniche", difficulty: 1,
    scenery: "Depuis Èze-sur-Mer, la Basse Corniche accompagne la côte sous les hauteurs du village perché. Les courbes alternent petites montées et relâchements ; la mer revient entre les maisons et les reliefs. La balade rejoint Cap-d’Ail et s’y termine, avant Monaco. Elle reste sur la route de la corniche : aucun détour par le sentier littoral, la plage de la Mala ou le village d’Èze n’est ajouté au GPX.", highlights: ["Èze-sur-Mer", "Basse Corniche", "Cap-d’Ail"] },
  { id: "baux-maussane-short", parentRouteId: "baux-alpilles-rocher", name: "Les Baux → Maussane", subtitle: "Des Carrières de Lumières aux oliveraies", difficulty: 1,
    scenery: "La pierre claire des Alpilles donne le ton dès le départ, devant les Carrières de Lumières. Ce dernier morceau du tour du rocher redescend vers les chemins de Sainte-Berthe puis Maussane-les-Alpilles. Les vignes, les oliviers et les silhouettes calcaires remplacent progressivement les falaises proches. La montée du Val d’Enfer est déjà derrière le point de départ ; ni visite des carrières ni entrée au château ne sont comprises dans cette petite traversée.", highlights: ["Carrières de Lumières", "Sainte-Berthe", "Maussane-les-Alpilles"] },
  { id: "riez-montagnac-short", parentRouteId: "sainte-croix-valensole", name: "Verdon · Riez → Montagnac", subtitle: "Un petit relief entre deux villages du plateau", difficulty: 2,
    scenery: "À Riez, le Colostre marque le départ de cette escale sur le plateau du Verdon. La petite route s’élève, redescend et remonte vers Montagnac : le paysage reste ouvert sur les cultures et les collines, avec de vraies rampes malgré le format court. L’arrivée retrouve le village, parfois appelé Montagnac-les-Truffes. Le lac de Sainte-Croix ne figure pas sur ce tronçon ; les champs de lavande, lorsqu’ils sont présents, changent d’aspect avec la saison.", highlights: ["Riez", "Colostre", "Montagnac"] },
  { id: "grau-aigues-short", parentRouteId: "camargue-grau-gallician", name: "Le Grau-du-Roi → Aigues-Mortes", subtitle: "Du port aux remparts de Camargue gardoise", difficulty: 1,
    scenery: "Le Grau-du-Roi laisse derrière lui l’animation du port pour les paysages bas de la Camargue gardoise. La trace rejoint Aigues-Mortes, dont les remparts donnent à l’arrivée une silhouette bien différente du front de mer. Le relief presque horizontal favorise un pédalage calme : l’intérêt de la balade tient aux canaux, aux horizons ouverts et au passage d’une ville portuaire à une cité fortifiée. Gallician et la suite vers Beaucaire ne font pas partie de cette escale.", highlights: ["Le Grau-du-Roi", "Camargue gardoise", "Aigues-Mortes"] },
  { id: "cayeux-hourdel-short", parentRouteId: "baie-somme-cayeux-crotoy", name: "Baie de Somme · Cayeux → Le Hourdel", subtitle: "La Route Blanche, les galets et le petit port", difficulty: 1,
    scenery: "Au départ de Cayeux-sur-Mer, la Route Blanche compose une entrée dans la baie entre dunes, galets et étendues marines. Le petit port du Hourdel donne son terme à la balade. Ici, la lumière et les marées transforment le paysage ; les phoques qui fréquentent la baie restent une possibilité d’observation, jamais une rencontre promise. La traversée s’arrête au Hourdel, sans poursuivre vers Saint-Valery-sur-Somme ou Le Crotoy.", highlights: ["Cayeux-sur-Mer", "Route Blanche", "Le Hourdel"] },
  { id: "noyelles-crotoy-short", parentRouteId: "baie-somme-cayeux-crotoy", name: "Baie de Somme · Noyelles → Le Crotoy", subtitle: "La dernière escale vers la baie", difficulty: 1,
    scenery: "La balade commence sur la piste à hauteur de Noyelles-sur-Mer, puis suit la dernière partie de l’étape jusqu’au Crotoy. Le terrain reste discret ; l’arrivée en ville ouvre la perspective sur la baie. Les petites routes et les espaces bas précèdent le panorama final, sans prétendre que chaque kilomètre longe directement l’eau. La liaison vers la gare de Noyelles et un trajet dans le train touristique ne sont pas ajoutés à cette trace.", highlights: ["Noyelles-sur-Mer", "Piste de la baie", "Le Crotoy"] },
  { id: "cande-chaumont-short", parentRouteId: "loire-blois-chaumont", name: "Loire · Candé → Chaumont", subtitle: "Du Beuvron au fleuve royal", difficulty: 1,
    scenery: "Candé-sur-Beuvron ouvre une courte transition entre rivière et fleuve. L’itinéraire retrouve la Loire et poursuit jusqu’à Chaumont-sur-Loire, sous le paysage de son domaine perché. Les berges donnent leur rythme à la sortie, avec un relief peu marqué sur ce tronçon. Le château et ses jardins appartiennent au décor et à une éventuelle visite séparée : le GPX n’ajoute ni entrée dans le domaine ni détour touristique. Blois reste en amont de ce petit format.", highlights: ["Candé-sur-Beuvron", "Beuvron", "Chaumont-sur-Loire"] },
  { id: "sevrier-annecy-short", parentRouteId: "annecy-rive-ouest", name: "Lac d’Annecy · Sevrier → Annecy", subtitle: "La dernière partie de la rive ouest", difficulty: 1,
    scenery: "La V62 accompagne la rive occidentale du lac depuis Sevrier jusqu’aux portes d’Annecy. Le lac et les montagnes restent les grands repères de cette traversée courte, tandis que la voie verte rapproche peu à peu le paysage de la ville. Le profil est très roulant, propice à une sortie souple. Le point de départ est situé sur la voie verte dans la commune de Sevrier ; l’arrivée est celle du GPX, sans prolongement inventé dans la vieille ville ni tour complet du lac.", highlights: ["Sevrier", "V62", "Annecy"] }
] as const;

const parents = new Map([...scenicRoutes, ...explorationRoutes].map((route) => [route.id, route]));
export const newShortRouteIds = destinations.map((route) => route.id);
// Stable short objectives: adding a route never changes an existing requirement.
export const shortRouteIds: string[] = ["chambord-petit-tour", "re-chemins-campagne", "golfe-juan-cannes-balade", "menton-garavan-promenade", ...newShortRouteIds];

export const shortRoutes: ClimbChallenge[] = destinations.map((destination) => {
  const parent = parents.get(destination.parentRouteId)!;
  const data = profiles[destination.id];
  return {
    ...destination, ...data,
    region: parent.region, sourceLabel: parent.sourceLabel, sourceUrl: parent.sourceUrl,
    coordinates: data.coordinates.map(([lat, lon]) => [lat, lon]),
    category: destination.difficulty === 1 ? "scenic" : "stage", effort: destination.difficulty === 1 ? "easy" : "moderate",
    xp: destination.difficulty === 1 ? 45 : 60, points: 1,
    tags: [...(parent.tags ?? []), "court", "15–30 min"], highlights: [...destination.highlights],
    note: `Tronçon du parcours ${parent.name}. Profil lissé depuis le GPX officiel ; cette sortie a sa propre validation et ne termine pas le parcours complet. ${data.provenance.section} ${destination.difficulty === 1 ? "Effort doux RPE 2–4." : "Effort modéré RPE 4–5 dans les montées ; les rampes réelles restent visibles."} Réglage manuel sur 32 niveaux, pauses libres.`
  };
});

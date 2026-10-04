import type { ClimbChallenge } from "./routes";
import profiles from "./esterel-profiles.json";

const destinations = [
  { id: "esterel-raphael-agay", name: "Corniche d’Or · Saint-Raphaël → Agay", subtitle: "Boulouris, le Dramont et la baie", difficulty: 1, xp: 75, points: 1,
    scenery: "Au départ de Saint-Raphaël, le Vieux-Port cède peu à peu la place aux quartiers du bord de mer. Boulouris apporte ses villas et ses anses, puis le secteur du Dramont annonce les premières silhouettes de roche rouge. Le cap et l’île d’Or composent le paysage des environs : la trace reste sur la route, sans descendre à la plage ni grimper au sémaphore. L’arrivée retrouve Agay, sa baie largement ouverte et les reliefs de l’Estérel en arrière-plan. Le profil peu marqué accompagne une sortie souple ; cette première étape côtière ne comprend ni la suite vers Théoule ni le retour forestier par la RN7.",
    highlights: ["Saint-Raphaël", "Boulouris", "Le Dramont", "Baie d’Agay"] },
  { id: "esterel-agay-trayas", name: "Corniche d’Or · Agay → Le Trayas", subtitle: "Anthéor et les calanques de l’Estérel", difficulty: 2, xp: 100, points: 2,
    scenery: "La baie d’Agay ouvre une succession de courbes entre mer et massif. À Anthéor, la silhouette du viaduc rappelle la présence du chemin de fer sur cette étroite frange côtière. Plus loin, les roches rouges et les calanques donnent à la Corniche d’Or son caractère : le paysage change à chaque avancée du relief, tandis que de petites montées alternent avec les relâchements. La route gagne Le Trayas, quartier oriental de Saint-Raphaël aux portes des Alpes-Maritimes. Les criques restent des éléments du décor, sans descente ajoutée jusqu’à l’eau. Ni excursion au sommet du cap Roux ni détour vers la gare ne sont compris dans ce tronçon.",
    highlights: ["Baie d’Agay", "Anthéor", "Corniche d’Or", "Le Trayas"] },
  { id: "esterel-trayas-theoule", name: "Corniche d’Or · Le Trayas → Théoule", subtitle: "Les dernières courbes au-dessus de la mer", difficulty: 2, xp: 90, points: 2,
    scenery: "Au Trayas, la route poursuit sa traversée du littoral dans un décor où le rouge du massif rencontre les bleus de la Méditerranée. Les avancées rocheuses, les quartiers côtiers et les petits reliefs donnent à cette étape un rythme plus ondulé que le départ de Saint-Raphaël. Théoule-sur-Mer apparaît au terme du parcours, entre la baie et les premières pentes de l’Estérel. Le tracé rejoint la route à hauteur du centre, sans prolongement vers le port ni promenade sur un sentier littoral. Cannes appartient à l’horizon régional, mais n’est pas l’arrivée de cette étape ; le retour par l’intérieur du massif constitue une sortie distincte.",
    highlights: ["Le Trayas", "Roches rouges", "Corniche d’Or", "Théoule-sur-Mer"] },
  { id: "esterel-theoule-raphael", name: "Estérel · Théoule → Saint-Raphaël", subtitle: "Le retour vallonné par la RN7", difficulty: 3, xp: 210, points: 3,
    scenery: "Après Théoule, la trace publiée passe par le secteur routier de La Napoule puis tourne le dos à la mer. Le relief prend davantage de place : les montées de l’arrière-pays conduisent vers la traversée forestière de l’Estérel par la RN7. Les horizons marins laissent place aux collines, aux pins et aux versants du massif, avant la longue descente et le retour dans Saint-Raphaël. Cette étape raconte l’autre moitié du circuit de la Corniche d’Or, celle des terres et des récupérations après l’ascension. Elle ne reste pas constamment en bord de mer et ne comprend aucune visite du château de La Napoule. L’arrivée est celle du GPX près du Vieux-Port.",
    highlights: ["Théoule-sur-Mer", "La Napoule · secteur routier", "Estérel · RN7", "Saint-Raphaël"] },
  { id: "esterel-raphael-boulouris-short", parentRouteId: "esterel-raphael-agay", name: "Estérel · Saint-Raphaël → Boulouris", subtitle: "Une petite échappée sur le bord de mer", difficulty: 1, xp: 45, points: 1,
    scenery: "Le Vieux-Port de Saint-Raphaël ouvre cette courte parenthèse maritime. La route longe les quartiers côtiers, entre façades, jardins et perspectives sur les anses, puis rejoint Boulouris. Quelques ondulations suffisent à varier le pédalage sans transformer cette sortie en ascension. Le plaisir tient au passage du centre animé vers une autre ambiance du littoral raphaëlois. L’arrivée se situe sur la route dans le quartier de Boulouris : aucun détour vers la gare ou jusqu’à une plage n’est ajouté. Le Dramont et Agay restent pour une prochaine séance ; terminer cette échappée ne valide pas l’étape entière Saint-Raphaël–Agay.",
    highlights: ["Saint-Raphaël", "Vieux-Port", "Boulouris"] },
  { id: "esterel-agay-antheor-short", parentRouteId: "esterel-agay-trayas", name: "Estérel · Agay → Anthéor", subtitle: "La baie et les premières roches rouges", difficulty: 1, xp: 45, points: 1,
    scenery: "À Agay, la baie forme une ample ouverture avant les courbes de la Corniche d’Or. Cette courte portion rejoint Anthéor, entre la mer, les premières avancées de roche rouge et les reliefs du massif. Le viaduc et le quartier côtier donnent un repère reconnaissable à l’arrivée. Le profil conserve ses petites ondulations, avec des consignes de pédalage douces et ajustables. La trace reste sur la route : elle ne descend pas à la plage et n’ajoute ni randonnée dans les calanques ni montée au cap Roux. Le Trayas demeure au-delà de cette escale, qui possède sa propre validation et ne termine pas le parcours Agay–Le Trayas.",
    highlights: ["Baie d’Agay", "Corniche d’Or", "Anthéor", "Viaduc d’Anthéor"] }
] as const;

export const esterelCoastalRouteIds = destinations.slice(0, 3).map((route) => route.id);
export const esterelFullRouteIds = destinations.slice(0, 4).map((route) => route.id);
export const esterelShortRouteIds = destinations.slice(4).map((route) => route.id);
export const esterelRouteIds = destinations.map((route) => route.id);

export const esterelRoutes: ClimbChallenge[] = destinations.map((destination) => {
  const data = profiles[destination.id];
  const short = "parentRouteId" in destination;
  return {
    ...destination, ...data, highlights: [...destination.highlights],
    coordinates: data.coordinates.map(([lat, lon]) => [lat, lon]),
    region: "Estérel · Var et Alpes-Maritimes",
    category: destination.difficulty === 1 ? "scenic" : "stage",
    effort: destination.difficulty === 1 ? "easy" : destination.difficulty === 2 ? "moderate" : "hard",
    tags: ["PACA", "Estérel", "Corniche d’Or", ...(short ? ["court", "15–30 min"] : [])],
    sourceLabel: "Estérel Côte d’Azur · GPX touristique et altitudes IGN",
    sourceUrl: "https://circuits.esterel-cotedazur.com/itineraire/circuit-velo-la-corniche-dor/",
    note: `Extrait du circuit touristique publié, profil IGN RGE ALTI lissé. ${data.provenance.section} ${short ? "Validation indépendante : ce format court ne termine pas son parcours parent. " : ""}Simulation pour vélo d’intérieur, sans navigation extérieure. ${destination.difficulty === 1 ? "Effort doux RPE 2–4." : "Relief réel représenté ; ajuste les consignes au ressenti."} Réglage manuel sur 32 niveaux, pauses libres.`
  };
});

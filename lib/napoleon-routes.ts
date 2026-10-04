import type { ClimbChallenge } from "./routes";
import profiles from "./napoleon-profiles.json";

const sections = [
  { id: "napoleon-golfe-grasse", name: "Route Napoléon · Golfe-Juan → Grasse", subtitle: "Du rivage aux premières collines", difficulty: 3, xp: 210, points: 3,
    scenery: "La mer ouvre le voyage à Golfe-Juan. La trace rejoint Cannes, puis Le Cannet, le secteur de Mougins et Mouans-Sartoux, avant de gagner Grasse. Le décor devient plus vallonné à mesure que le littoral s’éloigne. L’arrivée dans le pays des parfums conclut une étape avec de vraies rampes, plutôt qu’une simple promenade côtière.", highlights: ["Golfe-Juan", "Cannes", "Le Cannet", "Mougins", "Mouans-Sartoux", "Grasse"] },
  { id: "napoleon-grasse-vallier", name: "Route Napoléon · Grasse → Saint-Vallier", subtitle: "La montée vers les Préalpes", difficulty: 3, xp: 150, points: 2,
    scenery: "Au départ de Grasse, la Route Napoléon prend de la hauteur dans les Préalpes. Les courbes et les pentes conduisent vers Saint-Vallier-de-Thiey, ancienne halte du voyage impérial. Cette étape courte par la distance reste une ascension : le relief gagne plusieurs centaines de mètres avant les espaces plus ouverts du plateau.", highlights: ["Grasse", "Préalpes grassoises", "Saint-Vallier-de-Thiey"] },
  { id: "napoleon-vallier-seranon", name: "Route Napoléon · Saint-Vallier → Séranon", subtitle: "Escragnolles, vallons et roches claires", difficulty: 3, xp: 200, points: 3,
    scenery: "Depuis Saint-Vallier, le paysage s’ouvre sur les vallons des Préalpes. La route domine Escragnolles, dont le village reste en contrebas, puis poursuit vers le secteur de Séranon et ses reliefs calcaires. Montées, replats et descentes rythment ce passage de l’arrière-pays grassois aux paysages plus montagnards du haut pays.", highlights: ["Saint-Vallier-de-Thiey", "Escragnolles · en contrebas", "Séranon · carrefour routier"] },
  { id: "napoleon-seranon-castellane", name: "Route Napoléon · Séranon → Castellane", subtitle: "Des plateaux à la porte du Verdon", difficulty: 2, xp: 130, points: 2,
    scenery: "La trace quitte le carrefour de Séranon et continue vers La Garde, avant de descendre vers Castellane. Les hauts paysages provençaux laissent progressivement la place à la vallée du Verdon et au rocher qui domine la cité. Une étape surtout descendante, avec quelques remontées : elle ne fait aucun détour vers les lacs de Castillon ou de Chaudanne.", highlights: ["Séranon · secteur routier", "La Garde", "Castellane", "Notre-Dame du Roc · panorama"] },
  { id: "napoleon-castellane-barreme", name: "Route Napoléon · Castellane → Barrême", subtitle: "Col des Lèques et clue de Taulanne", difficulty: 3, xp: 180, points: 3,
    scenery: "Le rocher de Castellane accompagne le départ, puis la montée gagne le secteur du col des Lèques. La route touristique se faufile ensuite dans les paysages minéraux de Taulanne, avant de rejoindre Barrême. Roches, vallons et descente composent cette étape du Géoparc. Le site des Siréniens se visite par un sentier distinct, absent de la simulation.", highlights: ["Castellane", "Col des Lèques", "Taulanne", "Barrême"] },
  { id: "napoleon-barreme-digne", name: "Route Napoléon · Barrême → Digne", subtitle: "Vallées et portes du Géoparc", difficulty: 2, xp: 150, points: 2,
    scenery: "De Barrême à Digne-les-Bains, le tracé routier touristique suit les vallées de Haute-Provence, avec des passages resserrés et des ondulations avant la vallée de la Bléone. Digne termine cette traversée dans un paysage de montagnes et de thermalisme. Il s’agit de l’itinéraire routier publié ; le sentier historique par le col de Chaudon et La Clappe est un autre parcours.", highlights: ["Barrême", "Vallées de Haute-Provence", "Digne-les-Bains", "Bléone"] },
  { id: "napoleon-digne-sisteron", name: "Route Napoléon · Digne → Sisteron", subtitle: "Bléone, Malijai et Durance", difficulty: 2, xp: 160, points: 2,
    scenery: "La Bléone guide la sortie de Digne vers Malijai, où le château rappelle une halte impériale. La trace publiée passe par Château-Arnoux-Saint-Auban puis rejoint Sisteron et le resserrement de la Durance sous la citadelle. Le relief est peu marqué, mais la distance invite aux pauses. Le passage historique par le centre de Volonne ne fait pas partie de cet extrait.", highlights: ["Digne-les-Bains", "Malijai", "Château-Arnoux-Saint-Auban", "Sisteron", "Durance"] },
  { id: "napoleon-sisteron-gap", name: "Route Napoléon · Sisteron → Gap", subtitle: "Des Alpes provençales au bassin gapençais", difficulty: 3, xp: 240, points: 3,
    scenery: "En quittant Sisteron, la route remonte vers le secteur du Poët puis le bassin de Gap. Les paysages de la Durance et des Alpes du Sud accompagnent cette longue étape, avec des faux-plats et des montées progressives. Gap conclut le carnet proposé ici. Le col Bayard, Corps et Grenoble appartiennent à la suite de la Route Napoléon et ne sont pas simulés par cet extrait.", highlights: ["Sisteron", "Le Poët · secteur routier", "Bassin gapençais", "Gap"] }
] as const;

export const napoleonRouteIds: string[] = sections.map((section) => section.id);
export const napoleonRoutes: ClimbChallenge[] = sections.map((section) => {
  const data = profiles[section.id];
  return { ...section, ...data, category: "stage", region: "PACA · Route Napoléon", tags: ["Route Napoléon", "PACA", "histoire", "itinérance", ...section.highlights],
    highlights: [...section.highlights], coordinates: data.coordinates.map(([lat, lon]) => [lat, lon]),
    effort: section.difficulty === 2 ? "moderate" : "hard",
    sourceLabel: "Comité régional de tourisme PACA · Route Napoléon",
    sourceUrl: "https://provence-alpes-cotedazur.com/que-faire/circuits/route-napoleon/",
    note: `Tracé routier touristique officiel · altitudes IGN RGE ALTI lissées à 500 m. D+ calculé sur le profil représenté. Tronçon indépendant, sans détour ajouté. Résistance manuelle 1–32, ajustable au ressenti ; pauses libres. Reconstitution sur vélo d’intérieur, sans guidage routier réel.` };
});

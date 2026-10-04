import type { ClimbChallenge } from "./routes";
import profiles from "./scenic-profiles.json";

const destinations = [
  {
    id: "lac-der-balade", name: "Tour du lac du Der", subtitle: "Digues, oiseaux et horizons ouverts",
    region: "Champagne · Marne / Haute-Marne", xp: 130, points: 2,
    tags: ["lac", "boucle", "Champagne", "oiseaux", "panoramique"],
    scenery: "Le lac s’ouvre comme une petite mer intérieure, avec ses digues, ses anses et ses bois. Une boucle pour dérouler les jambes, suivre les changements de rive et laisser les grandes étendues d’eau rythmer la sortie. Le relief reste discret ; la longueur invite à prendre son temps et à faire une pause si nécessaire.",
    highlights: ["Giffaumont", "Chantecoq", "Nuisement", "Champaubert"],
    sourceLabel: "Office de Tourisme du Lac du Der",
    sourceUrl: "https://www.lacduder.com/offres/le-tour-du-lac-du-der-a-velo-giffaumont-champaubert-fr-5121077/"
  },
  {
    id: "annecy-rive-ouest", name: "Lac d’Annecy · rive ouest", subtitle: "De Bredannaz aux portes d’Annecy",
    region: "Haute-Savoie · Lac d’Annecy", xp: 90, points: 1,
    tags: ["lac", "voie verte", "Alpes", "plages", "panoramique"],
    scenery: "Les montagnes restent à l’horizon tandis que la voie verte accompagne la rive occidentale. Depuis Bredannaz, la trace rejoint Duingt, Saint-Jorioz puis Sevrier, avant Annecy. Le château sur sa presqu’île et les plages jalonnent cette traversée douce : on longe le lac, sans entreprendre son tour complet ni ses montées de la rive est.",
    highlights: ["Bredannaz", "Duingt", "Saint-Jorioz", "Sevrier", "Annecy"],
    sourceLabel: "Haute-Savoie · La Région du vélo",
    sourceUrl: "https://www.laregionduvelo.fr/trek/3963-Tour-des-Bauges-a-velo---Lac-d-Annecy---De-Doussard-a-Annecy"
  },
  {
    id: "chambord-petit-tour", name: "Chambord · petit tour", subtitle: "Une parenthèse autour du domaine royal",
    region: "Loir-et-Cher · Val de Loire", xp: 50, points: 1,
    tags: ["château", "boucle", "court", "forêt", "patrimoine"],
    scenery: "Une courte boucle dans le domaine de Chambord, entre allées et lisières. L’architecture du château donne à la promenade son point de repère, tandis que les petites ondulations du terrain entretiennent un pédalage souple. Un format pour découvrir l’esprit des balades, ou choisir une sortie tranquille quand le temps manque.",
    highlights: ["Domaine de Chambord", "Allées et lisières", "Retour au château"],
    sourceLabel: "Office de Tourisme Blois Chambord",
    sourceUrl: "https://www.bloischambord.com/visites-et-activites/balades-et-visites/chambord-a-velo-petit-parcours-chambord-fr-3114004/"
  },
  {
    id: "re-chemins-campagne", name: "Île de Ré · chemins en campagne", subtitle: "Saint-Martin-de-Ré → La Couarde-sur-Mer",
    region: "Charente-Maritime · Île de Ré", xp: 50, points: 1,
    tags: ["île", "Atlantique", "court", "vignes", "patrimoine"],
    scenery: "Quitter le port de Saint-Martin-de-Ré pour les chemins de campagne : les vignes, les cultures et les villages composent une autre facette de l’île. La trace officielle conduit vers La Couarde-sur-Mer, sur un relief peu marqué. Une traversée courte et lumineuse, à savourer sans accélération imposée ni détour par le pont.",
    highlights: ["Saint-Martin-de-Ré", "Campagne rétaise", "La Couarde-sur-Mer"],
    sourceLabel: "Destination Île de Ré",
    sourceUrl: "https://www.iledere.com/organiser-activites-et-loisirs/itineraires-balades-et-randonnees/chemins-en-campagne-a-velo-saint-martin-de-re-fr-5088084/"
  },
  {
    id: "marais-poitevin-coulon-damvix", name: "Marais poitevin · Coulon → Damvix", subtitle: "La Vélo Francette dans la Venise verte",
    region: "Deux-Sèvres / Vendée · Marais poitevin", xp: 100, points: 1,
    tags: ["marais", "canal", "Vélo Francette", "nature", "au fil de l’eau"],
    scenery: "Au départ de Coulon, le marais déploie ses canaux, ses passerelles et ses alignements d’arbres. La Vélo Francette retrouve la Sèvre niortaise après Irleau et accompagne ses eaux vers Damvix. Les faibles variations d’altitude laissent la place à un mouvement régulier, dans un paysage dont la richesse tient aux détails plutôt qu’aux sommets.",
    highlights: ["Coulon", "Marais mouillé", "Irleau", "Damvix"],
    sourceLabel: "France Vélo Tourisme · La Vélo Francette",
    sourceUrl: "https://www.francevelotourisme.com/itineraire/la-velo-francette/coulon-damvix"
  },
  {
    id: "canal-midi-carcassonne", name: "Canal du Midi · Carcassonne → Marseillette", subtitle: "Ports, écluses et chemins de halage",
    region: "Aude · Occitanie", xp: 110, points: 1,
    tags: ["canal", "Canal du Midi", "patrimoine", "écluses", "au fil de l’eau"],
    scenery: "Le canal prend son temps entre Carcassonne et Marseillette. Ses courbes, ses ouvrages et le port de Trèbes composent une route discrète, loin de la logique des cols. Quelques différences de niveau accompagnent le trajet, sans grande ascension : l’occasion de suivre un itinéraire célèbre avec une consigne d’effort douce et régulière.",
    highlights: ["Carcassonne", "Ponts-aqueducs", "Trèbes", "Marseillette"],
    sourceLabel: "France Vélo Tourisme · Canal des 2 Mers",
    sourceUrl: "https://www.francevelotourisme.com/itineraire/le-canal-des-2-mers-a-velo/carcassonne-marseillette"
  },
  {
    id: "loire-tours-villandry", name: "La Loire à Vélo · Tours → Villandry", subtitle: "Le Cher et les jardins de Touraine",
    region: "Indre-et-Loire · Touraine", xp: 110, points: 1,
    tags: ["Loire à Vélo", "château", "Cher", "patrimoine", "au fil de l’eau"],
    scenery: "Cette étape de La Loire à Vélo suit d’abord le Cher, sur sa rive sud, jusqu’aux jardins de Villandry. Le fleuve du nom de l’itinéraire reste voisin : ici, ce sont les berges et les paysages de Touraine qui guident la traversée. Un profil très roulant pour profiter d’une route connue sans chercher la performance.",
    highlights: ["Tours", "Rive sud du Cher", "Villandry"],
    sourceLabel: "France Vélo Tourisme · La Loire à Vélo",
    sourceUrl: "https://www.francevelotourisme.com/itineraire/la-loire-a-velo-eurovelo-6/tours-villandry"
  },
  {
    id: "cagnes-cannes-littoral", name: "Côte d’Azur · Cagnes-sur-Mer → Cannes", subtitle: "La Littorale, de ville en ville",
    region: "Alpes-Maritimes · Côte d’Azur", xp: 130, points: 2,
    tags: ["Côte d’Azur", "mer", "La Littorale", "villes", "panoramique"],
    scenery: "Depuis le Cros-de-Cagnes, la Méditerranée accompagne la balade vers Villeneuve-Loubet et les silhouettes de Marina Baie des Anges. Antibes apporte ses ports et ses remparts, puis une courte ondulation rejoint Juan-les-Pins. Golfe-Juan ouvre la dernière partie, avant Palm Beach et la Croisette à Cannes. Des lieux familiers à retrouver tranquillement, avec des repères de ville au fil des kilomètres.",
    highlights: ["Cros-de-Cagnes", "Villeneuve-Loubet", "Antibes", "Juan-les-Pins", "Golfe-Juan", "Palm Beach", "La Croisette"],
    sourceLabel: "France Vélo Tourisme · La Méditerranée à vélo",
    sourceUrl: "https://www.francevelotourisme.com/itineraire/la-mediterranee-a-velo-eurovelo-8/cannes-nice"
  },
  {
    id: "golfe-juan-cannes-balade", name: "Côte d’Azur · Golfe-Juan → Cannes", subtitle: "Le petit format, ports et Croisette",
    region: "Alpes-Maritimes · Côte d’Azur", xp: 60, points: 1,
    tags: ["Côte d’Azur", "mer", "court", "La Littorale", "Croisette"],
    scenery: "Une parenthèse au bord de la Méditerranée, depuis le port de Golfe-Juan vers Cannes. La trace rejoint la pointe de la Croisette à Palm Beach, puis remonte le front de mer jusqu’au Palais des Festivals. Le relief reste discret, avec une petite ondulation sur la liaison. Ce format court se termine à Cannes et laisse le temps de savourer la côte sans entreprendre toute la traversée depuis Cagnes-sur-Mer.",
    highlights: ["Golfe-Juan", "Palm Beach", "La Croisette", "Palais des Festivals"],
    sourceLabel: "France Vélo Tourisme · La Méditerranée à vélo",
    sourceUrl: "https://www.francevelotourisme.com/itineraire/la-mediterranee-a-velo-eurovelo-8/cannes-nice"
  }
] as const;

export const scenicRouteIds: string[] = destinations.map((destination) => destination.id);
// Keep this collection's original requirements stable as the catalogue grows.
export const foundingScenicRouteIds = ["lac-der-balade", "annecy-rive-ouest", "chambord-petit-tour", "re-chemins-campagne", "marais-poitevin-coulon-damvix", "canal-midi-carcassonne", "loire-tours-villandry"];

export const scenicRoutes: ClimbChallenge[] = destinations.map((destination) => {
  const data = profiles[destination.id];
  return {
    ...destination,
    ...data,
    coordinates: data.coordinates.map(([lat, lon]) => [lat, lon]),
    category: "scenic",
    difficulty: 1,
    tags: [...destination.tags],
    highlights: [...destination.highlights],
    featured: ["chambord-petit-tour", "lac-der-balade", "cagnes-cannes-littoral", "golfe-juan-cannes-balade"].includes(destination.id),
    note: `Trace officielle · relief lissé depuis ${data.provenance.altitudeSource}. D+ calculé sur le profil représenté. Effort doux, pauses libres ; la difficulté 1/5 décrit l’effort conseillé, pas la durée.`,
  };
});

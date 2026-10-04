import type { ClimbChallenge } from "./routes";
import profiles from "./exploration-profiles.json";

const destinations = [
  {
    "id": "nice-menton-grande-corniche",
    "name": "Nice → Menton · Grande Corniche",
    "subtitle": "De la rade de Villefranche aux hauteurs d’Èze",
    "region": "Alpes-Maritimes · Côte d’Azur",
    "category": "stage",
    "difficulty": 3,
    "xp": 280,
    "points": 4,
    "tags": [
      "PACA",
      "Côte d’Azur",
      "corniche",
      "mer",
      "vallonné"
    ],
    "scenery": "Le port de Nice ouvre la traversée. Au-dessus de la rade de Villefranche-sur-Mer, la route gagne la Grande Corniche et le secteur du col d’Èze. La Turbie marque le passage vers les panoramas du haut de la Riviera. Puis la descente rejoint Roquebrune-Cap-Martin et les plages mentonnaises, jusqu’à Garavan. Une étape avec une vraie ascension : Èze-sur-Mer et Monaco ne sont pas sur cette trace.",
    "highlights": [
      "Nice · port",
      "Villefranche-sur-Mer",
      "Èze · Grande Corniche",
      "La Turbie",
      "Roquebrune-Cap-Martin",
      "Menton · vieux port",
      "Menton · Garavan"
    ],
    "sourceUrl": "https://www.francevelotourisme.com/itineraire/la-mediterranee-a-velo-eurovelo-8/nice-menton",
    "sourceLabel": "France Vélo Tourisme",
    "featured": true
  },
  {
    "id": "eze-menton-basse-corniche",
    "name": "Èze-sur-Mer → Menton",
    "subtitle": "Basse Corniche, Cap-d’Ail et Monaco",
    "region": "Alpes-Maritimes · Côte d’Azur",
    "category": "stage",
    "difficulty": 2,
    "xp": 160,
    "points": 2,
    "tags": [
      "PACA",
      "Côte d’Azur",
      "mer",
      "corniche",
      "villes"
    ],
    "scenery": "La simulation part à hauteur d’Èze-sur-Mer, en contrebas du village perché. Elle suit la Basse Corniche vers Cap-d’Ail, entre caps et criques, puis traverse Monaco et Monte-Carlo, dans la principauté. Roquebrune-Cap-Martin ramène le parcours sur le littoral français avant Menton et son vieux port. Les petites montées et descentes donnent du mouvement à cette escapade ; elle n’est pas parfaitement plate.",
    "highlights": [
      "Èze-sur-Mer",
      "Cap-d’Ail",
      "Monaco · port",
      "Monte-Carlo",
      "Roquebrune-Cap-Martin",
      "Menton · vieux port"
    ],
    "sourceUrl": "https://www.explorenicecotedazur.com/itineraire/circuit-tour-des-corniches/",
    "sourceLabel": "Office de Tourisme Nice Côte d’Azur",
    "featured": true
  },
  {
    "id": "menton-garavan-promenade",
    "name": "Menton · promenade de Garavan",
    "subtitle": "Un petit bord de mer, de Carnolès à la frontière",
    "region": "Alpes-Maritimes · Côte d’Azur",
    "category": "scenic",
    "difficulty": 1,
    "xp": 40,
    "points": 1,
    "tags": [
      "PACA",
      "Côte d’Azur",
      "mer",
      "court",
      "villes"
    ],
    "scenery": "Une parenthèse mentonnaise en partant du secteur de Carnolès, à Roquebrune-Cap-Martin. La trace rejoint le front de mer de Menton, passe à hauteur du vieux port puis continue vers Garavan et la frontière italienne. Façades chaudes, ports et horizon marin composent cette courte balade. Le nom de Jean Cocteau accompagne la découverte de Menton ; la simulation reste sur sa trace, sans détour de visite.",
    "highlights": [
      "Roquebrune-Cap-Martin · Carnolès",
      "Menton · vieux port",
      "Menton · Garavan"
    ],
    "sourceUrl": "https://www.francevelotourisme.com/itineraire/la-mediterranee-a-velo-eurovelo-8/nice-menton",
    "sourceLabel": "France Vélo Tourisme",
    "featured": true
  },
  {
    "id": "baux-alpilles-rocher",
    "name": "Les Baux · tour du rocher",
    "subtitle": "Maussane, Val d’Enfer et oliveraies",
    "region": "Bouches-du-Rhône · Alpilles",
    "category": "stage",
    "difficulty": 2,
    "xp": 130,
    "points": 2,
    "tags": [
      "PACA",
      "Provence",
      "patrimoine",
      "Alpilles",
      "boucle"
    ],
    "scenery": "Depuis Maussane-les-Alpilles, les petites routes contournent le rocher des Baux. Le relief alterne montée, courte descente et lacets vers le Val d’Enfer. La trace redescend devant les Carrières de Lumières, puis passe dans le secteur de Sainte-Berthe avant de revenir à Maussane. Calcaires clairs, vignes et oliviers composent cette boucle. Le parcours fait le tour du rocher ; il ne monte pas visiter le château.",
    "highlights": [
      "Maussane-les-Alpilles",
      "Les Baux · Val d’Enfer",
      "Les Baux · Carrières de Lumières",
      "Les Baux · Sainte-Berthe",
      "Maussane · retour"
    ],
    "sourceUrl": "https://www.cheminsdesparcs.fr/trek/133849-MAUSSANE-LES-ALPILLES---Tour-des-Baux-de-Provence-a-velo",
    "sourceLabel": "Parc naturel régional des Alpilles",
    "featured": true
  },
  {
    "id": "sainte-croix-valensole",
    "name": "Sainte-Croix · lac et plateau",
    "subtitle": "Roumoules, Riez et Montagnac",
    "region": "Alpes-de-Haute-Provence · Verdon",
    "category": "stage",
    "difficulty": 2,
    "xp": 200,
    "points": 3,
    "tags": [
      "PACA",
      "Provence",
      "Verdon",
      "lac",
      "villages"
    ],
    "scenery": "Le lac de Sainte-Croix apparaît dès le départ, puis la route grimpe sur le plateau. Le hameau de Chaudon, Roumoules et Riez rythment la première partie. La boucle rejoint ensuite Montagnac avant de retrouver Sainte-Croix-du-Verdon. Cultures du plateau, villages et points de vue sur l’eau alternent avec bosses et descentes. La lavande dépend de la saison. Cette boucle ne fait pas le tour complet du lac et ne traverse pas Moustiers.",
    "highlights": [
      "Sainte-Croix-du-Verdon",
      "Chaudon",
      "Roumoules",
      "Riez",
      "Montagnac",
      "Sainte-Croix · retour"
    ],
    "sourceUrl": "https://www.cheminsdesparcs.fr/trek/130033-SAINTE-CROIX-DU-VERDON---Balade-sensorielle-a-velo",
    "sourceLabel": "Parc naturel régional du Verdon",
    "featured": true
  },
  {
    "id": "castellane-deux-lacs",
    "name": "Castellane · les deux lacs",
    "subtitle": "Chaudanne, Demandolx et Castillon",
    "region": "Alpes-de-Haute-Provence · Verdon",
    "category": "stage",
    "difficulty": 3,
    "xp": 240,
    "points": 3,
    "tags": [
      "PACA",
      "Verdon",
      "lac",
      "boucle",
      "vallonné"
    ],
    "scenery": "Le départ de Castellane passe le Verdon avant de gagner la route du lac de Chaudanne. La montée sinueuse rejoint les hauteurs de Demandolx ; le village est en détour, la trace passe au carrefour. Le secteur de la Croix de la Mission ouvre la descente vers Castillon. Après le barrage, les rives et la route ramènent à Castellane. Le rocher qui domine la ville forme un repère de départ et de retour. Deux lacs, une montée soutenue et de la récupération en descente.",
    "highlights": [
      "Castellane",
      "Castellane · vers Chaudanne",
      "Demandolx · carrefour",
      "Croix de la Mission · secteur",
      "Barrage de Castillon",
      "Castellane · retour"
    ],
    "sourceUrl": "https://www.cheminsdesparcs.fr/fr/trek/130759-CASTELLANE---Le-tour-des-lacs",
    "sourceLabel": "Parc naturel régional du Verdon",
    "featured": false
  },
  {
    "id": "verdon-route-cretes",
    "name": "Verdon · Route des Crêtes",
    "subtitle": "Le Grand Canyon depuis La Palud",
    "region": "Alpes-de-Haute-Provence · Verdon",
    "category": "stage",
    "difficulty": 4,
    "xp": 300,
    "points": 4,
    "tags": [
      "PACA",
      "Verdon",
      "gorges",
      "panoramique",
      "boucle"
    ],
    "scenery": "La Palud-sur-Verdon donne accès à la Route des Crêtes. Les premières rampes prennent de la hauteur vers les belvédères, au-dessus des falaises du Grand Canyon. Le secteur du Tilleul précède la grande descente, puis le chalet de la Maline marque la partie basse avant le retour au village. Cette boucle réunit effort bref mais soutenu, longues descentes et reprise du pédalage. Les belvédères et le vol des vautours font partie des paysages décrits par la source.",
    "highlights": [
      "La Palud-sur-Verdon",
      "Route des Crêtes · belvédères",
      "Belvédère du Tilleul · secteur",
      "Chalet de la Maline",
      "La Palud · retour"
    ],
    "sourceUrl": "https://admin.rando-alpes-haute-provence.fr/api/fr/treks/277070/grand-canyon-parcours-velo-n14.pdf",
    "sourceLabel": "Alpes de Haute-Provence · parcours vélo n°14",
    "featured": false
  },
  {
    "id": "turini-vesubie-sospel",
    "name": "Turini · Vésubie → Sospel",
    "subtitle": "Gorges, forêt et lacets du haut-pays",
    "region": "Alpes-Maritimes · Mercantour",
    "category": "stage",
    "difficulty": 4,
    "xp": 420,
    "points": 6,
    "tags": [
      "PACA",
      "Alpes",
      "col",
      "Mercantour",
      "panoramique"
    ],
    "scenery": "La descente de Saint-Martin-Vésubie mène à Roquebillière, puis à La Bollène-Vésubie. Le col de Turini se gagne par une route en balcon et une montée boisée. Après le col, les lacets changent de versant : Moulinet puis Sospel ponctuent le retour vers la Bévéra. Les villages colorés, les gorges et la forêt apportent une autre ambiance que le littoral. Une grande étape avec une ascension exigeante et une longue descente.",
    "highlights": [
      "Saint-Martin-Vésubie",
      "Roquebillière",
      "La Bollène-Vésubie",
      "Col de Turini",
      "Moulinet",
      "Sospel"
    ],
    "sourceUrl": "https://www.francevelotourisme.com/itineraire/route-des-grandes-alpes-r-a-velo/saint-martin-vesubie-sospel",
    "sourceLabel": "France Vélo Tourisme",
    "featured": false
  },
  {
    "id": "bonette-ubaye-tinee",
    "name": "Bonette · Ubaye → Tinée",
    "subtitle": "Barcelonnette, Jausiers et le grand col",
    "region": "Alpes du Sud · Ubaye et Mercantour",
    "category": "stage",
    "difficulty": 5,
    "xp": 520,
    "points": 7,
    "tags": [
      "PACA",
      "Alpes",
      "haute montagne",
      "col",
      "Mercantour"
    ],
    "scenery": "Barcelonnette lance cette traversée des Alpes du Sud. La vallée de l’Ubaye conduit à Jausiers avant une longue ascension vers la Bonette. Le paysage devient minéral à l’approche du col, puis la descente ouvre le versant de la Tinée jusqu’à Saint-Étienne-de-Tinée. La trace fournie franchit le col de la Bonette, autour de 2 715 m, sans la boucle supérieure de la cime : le profil intégré respecte ce choix. Une grande sortie d’endurance et de montagne.",
    "highlights": [
      "Barcelonnette",
      "Jausiers",
      "Col de la Bonette",
      "Saint-Étienne-de-Tinée"
    ],
    "sourceUrl": "https://www.francevelotourisme.com/itineraire/route-des-grandes-alpes-r-a-velo/variante-barcelonnette-saint-etienne-de-tinee",
    "sourceLabel": "France Vélo Tourisme",
    "featured": false
  },
  {
    "id": "luberon-calavon",
    "name": "Luberon · au fil du Calavon",
    "subtitle": "Cavaillon → Apt et le pont Julien",
    "region": "Vaucluse · Provence",
    "category": "scenic",
    "difficulty": 1,
    "xp": 140,
    "points": 2,
    "tags": [
      "PACA",
      "Provence",
      "voie verte",
      "patrimoine",
      "Luberon"
    ],
    "scenery": "Après le départ de Cavaillon, la liaison rejoint la véloroute du Calavon à hauteur de Robion. Coustellet rythme la traversée, puis le pont Julien apporte une halte de patrimoine sur l’ancienne voie ferrée. La trace poursuit vers Apt entre les paysages du Luberon. Le profil monte doucement au fil de la vallée ; l’effort intérieur reste facile et les pauses libres. Les villages perchés et les ocres sont des découvertes voisines, sans détour ajouté dans cette balade.",
    "highlights": [
      "Cavaillon",
      "Robion · véloroute",
      "Coustellet",
      "Pont Julien",
      "Apt"
    ],
    "sourceUrl": "https://www.francevelotourisme.com/itineraire/la-mediterranee-a-velo-eurovelo-8/cavaillon-apt",
    "sourceLabel": "France Vélo Tourisme",
    "featured": true
  },
  {
    "id": "camargue-grau-gallician",
    "name": "Camargue · canaux et remparts",
    "subtitle": "Le Grau-du-Roi → Aigues-Mortes → Gallician",
    "region": "Gard · Camargue",
    "category": "scenic",
    "difficulty": 1,
    "xp": 100,
    "points": 1,
    "tags": [
      "Camargue",
      "mer",
      "canal",
      "patrimoine",
      "oiseaux"
    ],
    "scenery": "Le Grau-du-Roi ouvre la balade côté mer. La trace gagne Aigues-Mortes, reconnaissable à son enceinte, puis suit le canal du Rhône à Sète jusqu’à Gallician. Les étangs et les marais de la Camargue gardoise composent l’horizon, avec un relief discret. Le centre du Scamandre est une découverte voisine ; il ne constitue pas un détour de ce tronçon. Une sortie intérieure douce, sans rejoindre les Saintes-Maries-de-la-Mer.",
    "highlights": [
      "Le Grau-du-Roi",
      "Aigues-Mortes",
      "Gallician"
    ],
    "sourceUrl": "https://www.francevelotourisme.com/itineraire/la-mediterranee-a-velo-eurovelo-8/le-grau-du-roi-beaucaire-tarascon",
    "sourceLabel": "France Vélo Tourisme",
    "featured": false
  },
  {
    "id": "baie-somme-cayeux-crotoy",
    "name": "Baie de Somme · Cayeux → Le Crotoy",
    "subtitle": "Route Blanche, Le Hourdel et Saint-Valery",
    "region": "Somme · Hauts-de-France",
    "category": "scenic",
    "difficulty": 1,
    "xp": 130,
    "points": 2,
    "tags": [
      "mer",
      "baie",
      "oiseaux",
      "patrimoine",
      "panoramique"
    ],
    "scenery": "Cayeux-sur-Mer et la Route Blanche introduisent la baie, entre galets et dunes. La pointe du Hourdel apporte un repère maritime ; la découverte continue vers Saint-Valery-sur-Somme puis Noyelles-sur-Mer. Le Crotoy termine la traversée de l’estuaire. Ports, maisons de pêcheurs et petit train composent les repères locaux. Les phoques et les oiseaux appartiennent au paysage naturel de la baie ; la simulation ne promet pas leur observation.",
    "highlights": [
      "Cayeux-sur-Mer",
      "Le Hourdel",
      "Saint-Valery-sur-Somme",
      "Noyelles-sur-Mer · piste",
      "Le Crotoy"
    ],
    "sourceUrl": "https://www.francevelotourisme.com/itineraire/la-velomaritime-eurovelo-4/cayeux-sur-mer-le-crotoy",
    "sourceLabel": "France Vélo Tourisme",
    "featured": false
  },
  {
    "id": "bretagne-roscoff-morlaix",
    "name": "Bretagne · Roscoff → Morlaix",
    "subtitle": "Saint-Pol-de-Léon et l’estuaire de la Penzé",
    "region": "Finistère · Bretagne",
    "category": "stage",
    "difficulty": 2,
    "xp": 210,
    "points": 3,
    "tags": [
      "Bretagne",
      "mer",
      "estuaire",
      "villages",
      "vallonné"
    ],
    "scenery": "Le départ de Roscoff regarde vers l’île de Batz. Saint-Pol-de-Léon ponctue la traversée des cultures maraîchères du Léon. Après Kerlaudy, les vues sur l’estuaire de la Penzé changent l’ambiance avant d’approcher Morlaix et sa vallée. Cette étape offre plusieurs bosses, descentes et sections roulantes : son décor maritime ne signifie pas un terrain plat. Morlaix apporte un final de patrimoine avec ses venelles et son viaduc à découvrir en ville.",
    "highlights": [
      "Roscoff",
      "Saint-Pol-de-Léon",
      "Kerlaudy · secteur",
      "Estuaire de la Penzé",
      "Morlaix"
    ],
    "sourceUrl": "https://www.francevelotourisme.com/itineraire/la-velomaritime-eurovelo-4/roscoff-morlaix",
    "sourceLabel": "France Vélo Tourisme",
    "featured": false
  },
  {
    "id": "loire-blois-chaumont",
    "name": "Loire · Blois → Chaumont",
    "subtitle": "Coteaux, Beuvron et château sur le fleuve",
    "region": "Loir-et-Cher · Val de Loire",
    "category": "stage",
    "difficulty": 2,
    "xp": 140,
    "points": 2,
    "tags": [
      "Loire",
      "patrimoine",
      "châteaux",
      "vallonné",
      "rivière"
    ],
    "scenery": "La sortie de Blois traverse le fleuve puis quitte la rive pour les coteaux. Candé-sur-Beuvron apporte un changement de paysage : le Beuvron guide le retour vers la Loire. La trace se termine à Chaumont-sur-Loire, au pied du domaine connu pour son château et ses jardins. Quelques bosses et descentes séparent les passages plus roulants. Le parcours ne comprend pas de visite intérieure des châteaux.",
    "highlights": [
      "Blois",
      "Candé-sur-Beuvron",
      "Chaumont-sur-Loire"
    ],
    "sourceUrl": "https://www.francevelotourisme.com/itineraire/la-loire-a-velo-eurovelo-6/blois-chaumont-sur-loire",
    "sourceLabel": "France Vélo Tourisme",
    "featured": false
  },
  {
    "id": "alsace-erstein-strasbourg",
    "name": "Alsace · Erstein → Strasbourg",
    "subtitle": "Le canal, Eschau et l’approche de la capitale",
    "region": "Bas-Rhin · Alsace",
    "category": "scenic",
    "difficulty": 1,
    "xp": 100,
    "points": 1,
    "tags": [
      "Alsace",
      "canal",
      "voie verte",
      "patrimoine",
      "villes"
    ],
    "scenery": "Ce tronçon démarre sur le canal, à hauteur d’Erstein, puis poursuit vers les secteurs de Plobsheim et d’Eschau. Écluses, chemins de halage et paysages du Ried composent une traversée très douce vers Strasbourg. La trace arrive côté sud-est de la ville, sans détour vers la Petite France ou la cathédrale. Ces monuments sont des découvertes voisines à imaginer à l’arrivée. Une balade de canal qui complète les paysages du Midi et de la Loire.",
    "highlights": [
      "Erstein · canal",
      "Plobsheim · canal",
      "Eschau · canal",
      "Strasbourg · arrivée du canal"
    ],
    "sourceUrl": "https://www.francevelotourisme.com/itineraire/veloroute-rhin-eurovelo-15/neuf-brisach-strasbourg",
    "sourceLabel": "France Vélo Tourisme",
    "featured": false
  }
] as const;

export const explorationRoutes: ClimbChallenge[] = destinations.map((destination) => {
  const data = profiles[destination.id];
  return {
    ...destination, ...data,
    coordinates: data.coordinates.map(([lat, lon]): [number, number] => [lat, lon]),
    tags: [...destination.tags], highlights: [...destination.highlights],
    note: `Trace officielle · relief lissé depuis le GPX. D+ calculé sur le profil représenté. ${destination.category === "scenic" ? "Effort doux, pauses libres ; 1/5 décrit l’effort conseillé, pas la durée." : "Consignes d’entraînement sur 32 niveaux ; adapte l’effort à ton ressenti."}${"section" in data.provenance ? ` ${data.provenance.section}` : ""}`
  };
});

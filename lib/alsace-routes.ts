import type { ClimbChallenge } from "./routes";
import profiles from "./alsace-profiles.json";

const destinations = [
  { id: "alsace-marlenheim-obernai", name: "Vignoble d’Alsace · Marlenheim → Obernai", subtitle: "Voie ancienne et premières ondulations", difficulty: 2, xp: 100, points: 2,
    scenery: "À Marlenheim, le vignoble s’ouvre sur la plaine et les premières collines sous-vosgiennes. La trace rejoint le secteur de Molsheim, puis s’infléchit vers le sud, entre cultures, villages et alignements de vignes. Les passages roulants alternent avec quelques petites rampes avant Obernai. Ses toits et ses clochers donnent un visage à l’arrivée : une ville de piémont, où le relief demeure proche sans imposer une ascension de montagne. La séance garde les kilomètres du tronçon officiel ; les visites du centre et la montée au mont National ne sont pas ajoutées au profil.",
    highlights: ["Marlenheim", "Molsheim · secteur", "Vignoble", "Obernai"] },
  { id: "alsace-obernai-dambach", name: "Vignoble d’Alsace · Obernai → Dambach", subtitle: "Les coteaux et le pays de Barr", difficulty: 2, xp: 120, points: 2,
    scenery: "Au départ d’Obernai, la véloroute prend un rythme plus ondulé. Les coteaux, les vergers et les rangs de vigne accompagnent la progression vers Barr, avant les villages de la partie centrale du vignoble. Le profil lissé conserve plusieurs montées et relâchements : le paysage donne un fil à l’endurance, sans transformer ces bosses en cols. Dambach-la-Ville conclut cette étape au pied des Vosges. Les rues anciennes appartiennent à l’ambiance du voyage ; aucune visite à pied ni montée vers un château n’est incluse dans cette portion de la trace publiée.",
    highlights: ["Obernai", "Barr", "Coteaux sous-vosgiens", "Dambach-la-Ville"] },
  { id: "alsace-dambach-bergheim", name: "Vignoble d’Alsace · Dambach → Bergheim", subtitle: "Villages et petites routes de piémont", difficulty: 1, xp: 75, points: 1,
    scenery: "Dambach-la-Ville laisse place aux petites routes du piémont. La trace gagne le secteur de Châtenois, puis poursuit sa traversée des terres viticoles jusqu’à Bergheim. Les reliefs vosgiens accompagnent l’horizon tandis que le profil reste souple, avec de légères ondulations et de longs passages pour retrouver une cadence régulière. Les villages scandent la sortie sans l’interrompre : leurs façades, leurs toits et leurs abords donnent des repères au fil des kilomètres. Le Haut-Koenigsbourg appartient aux hauteurs voisines ; la séance ne monte pas au château et ne représente pas une visite des remparts.",
    highlights: ["Dambach-la-Ville", "Châtenois", "Piémont", "Bergheim"] },
  { id: "alsace-bergheim-turckheim", name: "Vignoble d’Alsace · Bergheim → Turckheim", subtitle: "La plaine orientale et les vignes", difficulty: 1, xp: 80, points: 1,
    scenery: "Depuis Bergheim, la trace descend vers les paysages ouverts du vignoble. Elle passe dans la plaine à l’est de Ribeauvillé, à environ deux kilomètres et demi de son centre : la vieille ville demeure une découverte voisine, sans détour ajouté. Les cultures et les vignes accompagnent ensuite une progression largement roulante vers Turckheim. Le relief revient par petites touches et laisse de nombreux passages pour pédaler doucement. Cette étape privilégie le mouvement régulier et les changements d’horizon ; elle ne comprend ni visite de Riquewihr ni excursion vers les châteaux des Vosges.",
    highlights: ["Bergheim", "Ribeauvillé · plaine orientale", "Paysages viticoles", "Turckheim"] },
  { id: "alsace-turckheim-rouffach", name: "Vignoble d’Alsace · Turckheim → Rouffach", subtitle: "Eguisheim et les vignes du Haut-Rhin", difficulty: 1, xp: 85, points: 1,
    scenery: "Turckheim ouvre cette traversée du vignoble haut-rhinois. Les rangs de vigne se succèdent autour du secteur d’Eguisheim, dont les toits et le clocher émergent du paysage cultivé. Le profil reste doux, avec quelques ondulations avant Rouffach. Les lieux ne sont pas de simples noms sur une carte : ils marquent les passages d’une campagne à une autre, entre villages, cultures et horizons du piémont. La trace publiée ne parcourt pas chaque rue concentrique d’Eguisheim ; la photographie prise depuis les vignes offre un autre point de vue, sans modifier l’itinéraire ni ajouter une visite.",
    highlights: ["Turckheim", "Eguisheim · secteur", "Vignes du Haut-Rhin", "Rouffach"] },
  { id: "alsace-rouffach-thann", name: "Vignoble d’Alsace · Rouffach → Thann", subtitle: "Une longue étape jusqu’à la porte des vallées", difficulty: 3, xp: 190, points: 3,
    scenery: "Au sud de Rouffach, le voyage change d’échelle. La trace traverse les paysages du vignoble vers le secteur de Guebwiller, puis rejoint les abords des vallées vosgiennes jusqu’à Thann. Les petites montées, les replats et les descentes rythment une étape plus longue, dont la difficulté tient autant à la durée qu’au dénivelé. Les reliefs de montagne restent présents dans le décor, sans ascension du Grand Ballon. Pour prendre le temps de la découverte, le mode Voyage permet de fractionner ce trajet en plusieurs séances ; les kilomètres du parcours entier et ses lieux restent conservés.",
    highlights: ["Rouffach", "Guebwiller · secteur", "Piémont vosgien", "Thann"] },
  { id: "alsace-obernai-bernardswiller-short", parentRouteId: "alsace-obernai-dambach", name: "Alsace · Obernai → Bernardswiller", subtitle: "Une parenthèse entre ville et vignes", difficulty: 1, xp: 35, points: 1,
    scenery: "Une courte échappée quitte Obernai pour gagner les abords de Bernardswiller. Les premiers coteaux donnent du relief à cette portion, avec des consignes douces et ajustables. Les vignes remplacent peu à peu l’ambiance de la ville, tandis que les Vosges restent proches dans le paysage. Environ quatorze minutes simulées suffisent pour parcourir ce petit extrait. La montée au mont National n’est pas ajoutée ; la vue d’Obernai présente dans la galerie a été prise depuis ce point de vue extérieur. Terminer cette parenthèse ne valide pas la grande étape jusqu’à Dambach-la-Ville.",
    highlights: ["Obernai", "Coteaux", "Bernardswiller"] },
  { id: "alsace-dambach-scherwiller-short", parentRouteId: "alsace-dambach-bergheim", name: "Alsace · Dambach → Scherwiller", subtitle: "Dix-huit minutes dans le piémont", difficulty: 1, xp: 40, points: 1,
    scenery: "Les abords de Dambach-la-Ville ouvrent ce petit passage vers Scherwiller. La trace suit le piémont dans une campagne où les vignes, les cultures et les silhouettes des villages composent un horizon proche. Le profil presque plat invite à trouver une cadence tranquille, avec des pauses libres. Les collines ne disparaissent pas du décor, mais elles ne deviennent pas des ascensions dans cette séance. L’arrivée est celle de la trace au niveau du village ; aucune visite des rues ni montée à un château n’est ajoutée. Le carnet court garde sa validation propre, distincte de l’étape Dambach–Bergheim.",
    highlights: ["Dambach-la-Ville", "Piémont", "Scherwiller"] },
  { id: "alsace-turckheim-eguisheim-short", parentRouteId: "alsace-turckheim-rouffach", name: "Alsace · Turckheim → Eguisheim", subtitle: "Les vignes en vingt-trois minutes", difficulty: 1, xp: 45, points: 1,
    scenery: "Au départ de Turckheim, les kilomètres se déroulent doucement vers les vignes d’Eguisheim. Le profil représenté reste presque plat : c’est une parenthèse pour reprendre son souffle et laisser les paysages donner le rythme. Les toits et le clocher du village accompagnent l’arrivée dans son secteur. La photographie prise depuis les vignes témoigne d’un autre jour et d’un autre regard ; elle ne restitue pas chaque mètre de la trace. Ce court passage est un parcours indépendant, avec ses propres réalisations, et ne remplace pas la grande étape qui continue jusqu’à Rouffach.",
    highlights: ["Turckheim", "Vignoble", "Eguisheim"] }
] as const;

export const alsaceFullRouteIds = destinations.filter(route => !("parentRouteId" in route)).map(route => route.id);
export const alsaceShortRouteIds = destinations.filter(route => "parentRouteId" in route).map(route => route.id);
export const alsaceRouteIds = destinations.map(route => route.id);

export const alsaceRoutes: ClimbChallenge[] = destinations.map(destination => {
  const data = profiles[destination.id];
  return {
    ...destination, ...data, highlights: [...destination.highlights],
    coordinates: data.coordinates.map(([lat, lon]) => [lat, lon]),
    region: "Vignoble d’Alsace · Bas-Rhin et Haut-Rhin",
    category: destination.difficulty === 1 ? "scenic" : "stage",
    effort: destination.difficulty === 1 ? "easy" : destination.difficulty === 2 ? "moderate" : "hard",
    tags: ["Alsace", "vignoble", "villages", ...("parentRouteId" in destination ? ["court"] : [])],
    sourceLabel: "Alsace à Vélo · GPX officiel et altitudes IGN",
    sourceUrl: "https://www.alsaceavelo.fr/403000009-veloroute-du-vignoble-dalsace/",
    note: `${data.provenance.section} Profil IGN lissé à 500 m, dénivelé calculé sur ce profil. Simulation pour vélo d’intérieur, sans navigation extérieure. ${"parentRouteId" in destination ? "Ce format court ne valide pas son parcours parent. " : "Voyage permet de fractionner la sortie. "}Réglage manuel sur 32 niveaux, pauses libres.`,
  };
});

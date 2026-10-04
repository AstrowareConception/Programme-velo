export type RouteTheme = { id: string; title: string; icon: string; description: string; routeIds: string[] };

export const routeThemes: RouteTheme[] = [
  { id: "napoleon", title: "Route Napoléon", icon: "🦅", description: "Quatorze tronçons routiers de Golfe-Juan à Grenoble, avec deux carnets indépendants. Ordre libre.",
    routeIds: ["napoleon-golfe-grasse", "napoleon-grasse-vallier", "napoleon-vallier-seranon", "napoleon-seranon-castellane", "napoleon-castellane-barreme", "napoleon-barreme-digne", "napoleon-digne-sisteron", "napoleon-sisteron-gap", "napoleon-gap-fare", "napoleon-fare-corps", "napoleon-corps-mure", "napoleon-mure-laffrey", "napoleon-laffrey-vizille", "napoleon-vizille-grenoble"] },
  { id: "azure", title: "Côte d’Azur", icon: "🍋", description: "Ports, villes et Corniches, de Cagnes à Menton.",
    routeIds: ["cagnes-cannes-littoral", "golfe-juan-cannes-balade", "menton-garavan-promenade", "eze-menton-basse-corniche", "nice-menton-grande-corniche", "nice-corniches-loop"] },
  { id: "verdon", title: "Lacs et gorges du Verdon", icon: "🦅", description: "Sainte-Croix, Castellane et le Grand Canyon.",
    routeIds: ["sainte-croix-valensole", "castellane-deux-lacs", "verdon-route-cretes"] },
  { id: "provence", title: "Villages de Provence", icon: "🫒", description: "Alpilles, Calavon et les petites routes du Vaucluse.",
    routeIds: ["baux-alpilles-rocher", "luberon-calavon", "sorgue-velleron-loop", "vaison-medieval-loop", "uchaux-loop", "enclave-papes-loop"] },
  { id: "lakes", title: "Autour des lacs", icon: "🦢", description: "Des rives douces du Der et d’Annecy aux reliefs du Verdon.",
    routeIds: ["lac-der-balade", "annecy-rive-ouest", "sainte-croix-valensole", "castellane-deux-lacs"] },
  { id: "coasts", title: "Mers et estuaires", icon: "⚓", description: "Atlantique, Manche et Méditerranée, avec ou sans bosses.",
    routeIds: ["re-chemins-campagne", "baie-somme-cayeux-crotoy", "bretagne-roscoff-morlaix", "camargue-grau-gallician", "cagnes-cannes-littoral", "golfe-juan-cannes-balade", "menton-garavan-promenade", "eze-menton-basse-corniche", "nice-menton-grande-corniche"] },
  { id: "heritage", title: "Châteaux et patrimoine", icon: "🏰", description: "Chambord, les châteaux de Loire, les Baux et les remparts.",
    routeIds: ["chambord-petit-tour", "loire-tours-villandry", "loire-blois-chaumont", "baux-alpilles-rocher", "camargue-grau-gallician", "vaison-medieval-loop"] },
  { id: "waterways", title: "Canaux et voies vertes", icon: "🌾", description: "Calavon, Alsace, Midi, marais et canal de Camargue.",
    routeIds: ["marais-poitevin-coulon-damvix", "canal-midi-carcassonne", "luberon-calavon", "alsace-erstein-strasbourg", "camargue-grau-gallician"] },
  { id: "mountains", title: "Cols et haute montagne", icon: "⛰️", description: "Grands cols, Turini et Bonette : les journées sportives.",
    routeIds: ["alpe-dhuez", "ventoux-bedoin", "tourmalet-est", "galibier-valloire", "madeleine-maurienne", "glandon-cuines", "croix-de-fer-maurienne", "iseran-bonneval", "chaussy-madeleine-stage", "turini-vesubie-sospel", "bonette-ubaye-tinee"] }
];

const shortThemeRoutes: Record<string, string[]> = {
  azure: ["antibes-golfe-juan-short", "eze-cap-ail-short"],
  verdon: ["riez-montagnac-short"],
  provence: ["baux-maussane-short", "riez-montagnac-short"],
  lakes: ["sevrier-annecy-short"],
  coasts: ["antibes-golfe-juan-short", "eze-cap-ail-short", "grau-aigues-short", "cayeux-hourdel-short", "noyelles-crotoy-short"],
  heritage: ["baux-maussane-short", "grau-aigues-short", "cande-chaumont-short"],
  waterways: ["grau-aigues-short", "cande-chaumont-short"]
};
routeThemes.forEach((theme) => theme.routeIds.push(...(shortThemeRoutes[theme.id] ?? [])));

// Fixed destinations for the regional trophy: additions never raise its target.
export const discoveryTerritories = [
  { title: "PACA", routeIds: ["ventoux-bedoin", "sorgue-velleron-loop", "vaison-medieval-loop", "uchaux-loop", "enclave-papes-loop", "nice-corniches-loop", "cagnes-cannes-littoral", "golfe-juan-cannes-balade", "menton-garavan-promenade", "eze-menton-basse-corniche", "nice-menton-grande-corniche", "baux-alpilles-rocher", "sainte-croix-valensole", "castellane-deux-lacs", "verdon-route-cretes", "turini-vesubie-sospel", "bonette-ubaye-tinee", "luberon-calavon"] },
  { title: "Bretagne", routeIds: ["bretagne-roscoff-morlaix"] },
  { title: "Baie de Somme", routeIds: ["baie-somme-cayeux-crotoy"] },
  { title: "Alsace", routeIds: ["alsace-erstein-strasbourg"] },
  { title: "Val de Loire", routeIds: ["chambord-petit-tour", "loire-tours-villandry", "loire-blois-chaumont"] },
  { title: "Champagne", routeIds: ["lac-der-balade"] },
  { title: "Île de Ré", routeIds: ["re-chemins-campagne"] },
  { title: "Marais poitevin", routeIds: ["marais-poitevin-coulon-damvix"] },
  { title: "Canal du Midi", routeIds: ["canal-midi-carcassonne"] },
  { title: "Camargue gardoise", routeIds: ["camargue-grau-gallician"] }
];

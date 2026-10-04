# Balades de France — sources et limites

Les neuf balades sont fondées sur des traces publiques des organismes qui présentent ces itinéraires. La géométrie est issue des GPX indiqués ci-dessous. Le texte de découverte a été écrit pour VéloQuest ; aucune photographie ou description touristique n’est reproduite.

| Balade | Distance calculée | Altitude utilisée | Fiche et fournisseur de trace |
| --- | ---: | --- | --- |
| Tour du lac du Der | 34,989 km | IGN RGE ALTI | [Office de Tourisme du Lac du Der](https://www.lacduder.com/offres/le-tour-du-lac-du-der-a-velo-giffaumont-champaubert-fr-5121077/) |
| Rive ouest du lac d’Annecy | 15,060 km | GPX officiel | [Haute-Savoie / La Région du vélo](https://www.laregionduvelo.fr/trek/3963-Tour-des-Bauges-a-velo---Lac-d-Annecy---De-Doussard-a-Annecy) |
| Chambord, petit parcours | 6,274 km | IGN RGE ALTI | [Office de Tourisme Blois Chambord](https://www.bloischambord.com/visites-et-activites/balades-et-visites/chambord-a-velo-petit-parcours-chambord-fr-3114004/) |
| Île de Ré, chemins en campagne | 6,647 km | IGN RGE ALTI | [Destination Île de Ré](https://www.iledere.com/organiser-activites-et-loisirs/itineraires-balades-et-randonnees/chemins-en-campagne-a-velo-saint-martin-de-re-fr-5088084/) |
| Coulon–Damvix | 19,645 km | GPX officiel | [France Vélo Tourisme / La Vélo Francette](https://www.francevelotourisme.com/itineraire/la-velo-francette/coulon-damvix) |
| Carcassonne–Marseillette | 22,162 km | GPX officiel | [France Vélo Tourisme / Canal des 2 Mers](https://www.francevelotourisme.com/itineraire/le-canal-des-2-mers-a-velo/carcassonne-marseillette) |
| Tours–Villandry | 21,800 km | GPX officiel | [France Vélo Tourisme / La Loire à Vélo](https://www.francevelotourisme.com/itineraire/la-loire-a-velo-eurovelo-6/tours-villandry) |
| Cagnes-sur-Mer–Cannes | 23,810 km | GPX officiel, tronçon inversé | [France Vélo Tourisme / EV8 Cannes–Nice](https://www.francevelotourisme.com/itineraire/la-mediterranee-a-velo-eurovelo-8/cannes-nice) |
| Golfe-Juan–Cannes | 7,508 km | Même GPX, tronçon court inversé | [France Vélo Tourisme / EV8 Cannes–Nice](https://www.francevelotourisme.com/itineraire/la-mediterranee-a-velo-eurovelo-8/cannes-nice) |

## Ce que représente le profil

La distance est calculée sur la trace complète par haversine. L’altitude est interpolée sur des stations espacées de 250 m. Quand le GPX ne fournit pas d’altitude, ces stations sont renseignées par le [service de calcul altimétrique IGN](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/calcul-altimetrique/) avec la ressource `ign_rge_alti_wld` (RGE ALTI). L’altitude du terrain n’est pas une mesure de la chaussée, notamment sur un pont ou un ouvrage.

Un filtre médian local, puis une moyenne locale, réduisent les pics GPS/DEM. Les extrémités sont conservées. Le profil du lecteur retient une station tous les 500 m et le dernier point ; chaque pente est la variation d’altitude entre deux stations consécutives. Le D+ affiché est la somme des variations positives de **ce profil représenté**. Il peut être nettement inférieur au D+ brut ou au total publié par l’office de tourisme : micro-reliefs, erreurs d’altitude et méthodes de calcul diffèrent. Ce lissage ne permet pas d’affirmer une reproduction centimétrique du relief ou de conserver une rampe très courte.

Les cartes gardent jusqu’à 260 points de la géométrie d’origine, indépendamment du profil d’effort. Le graphe affiche les altitudes minimale et maximale et utilise une amplitude verticale minimale de 50 m pour ne pas donner à quelques mètres de variation l’apparence d’un col alpin.

La fiche d’Annecy nomme Doussard comme commune de départ, mais la trace débute à Bredannaz : le libellé du produit suit la trace. Elle longe la rive ouest jusqu’à Annecy, **pas le tour complet du lac**. Tours–Villandry est une étape de La Loire à Vélo qui suit ici la rive sud du **Cher**, pas la Loire elle-même. Les trois boucles/traversées courtes ne comprennent pas de variante ou détour non présent dans le fichier.

## Le littoral azuréen et ses repères

Le GPX de référence est [Cannes → Nice](https://www.francevelotourisme.com/etape/gpx/599). Le générateur sélectionne les points du Cros-de-Cagnes et de la Croisette près du Palais des Festivals, puis inverse ce tronçon pour la simulation. Le petit format commence à hauteur du port de Golfe-Juan et conserve la même arrivée. Aucune liaison droite inventée n’est ajoutée entre les villes. Les extrémités et l’ordre des repères sont vérifiés avant génération ; une trace source déplacée provoque une erreur. Les sept profils fondateurs restent identiques.

Les repères correspondent à des points choisis sur la trace, près des lieux décrits ; ce ne sont pas des limites administratives : Cagnes-sur-Mer / Cros-de-Cagnes, Villeneuve-Loubet / à hauteur de Marina Baie des Anges, Antibes / port Vauban, Juan-les-Pins, Golfe-Juan / vieux port, Cannes / Palm Beach, Cannes / Croisette. Leurs kilomètres sont calculés par cumul des segments GPX dans le sens proposé, puis utilisés par le lecteur pour indiquer le repère atteint et le suivant. La progression provient du temps simulé ou de la distance FTMS, jamais d’un GPS extérieur.

L’extrémité du petit format laissait initialement un intervalle de 8 m qui amplifiait le bruit d’altitude en une pente artificiellement forte. Pour ces tronçons azuréens, un intervalle terminal inférieur à 125 m est fusionné avec le précédent, en conservant le véritable dernier point. Le profil représenté du trajet complet donne environ 43 m D+ et une pente maximale lissée de 2,2 % ; le format court, 19 m D+ et 1,1 %. Ces chiffres ne décrivent pas chaque rampe courte de la chaussée réelle.

L’itinéraire réel comporte des passages sur route partagée et une liaison légèrement vallonnée entre Antibes et Juan-les-Pins. La [fiche AF3V](https://www.af3v.org/les-voies-vertes/voies/289-ev8-la-mediterranee-a-velo-de-cannes-a-nice/) précise aussi que le jalonnement réel diffère selon le sens dans le Vieil Antibes. Inverser une trace pour le vélo d’appartement ne fournit donc pas une navigation routière conforme aux sens de circulation. Ne pas utiliser cette simulation comme un guidage extérieur. Les points de découverte sont recoupés avec [Cannes Tourisme](https://www.cannes-france.com/decouvrir-visiter/sportive/velo/), [Villeneuve Tourisme](https://www.villeneuve-tourisme.com/les-pistes-cyclables-a-villeneuve-loubet) et [Cagnes Tourisme](https://tourisme.cagnes.fr/cros-de-cagnes/).

Lors de la vérification du 4 octobre 2026, le lien GPX retour officiel `/599/1`, nommé Nice-Cannes, contenait une géométrie Menton–Nice. Il a été rejeté après contrôle des coordonnées. Seul le GPX aller `/599`, dont la géométrie correspond à Cannes–Nice, est utilisé et découpé localement. Le checksum documente le fichier effectivement choisi.

## Effort et récompenses

La résistance des balades est volontairement douce, entre 4 et 10 de base sur 32, avec RPE 2–4 et calibration utilisateur. Le relief reste visible. La correspondance résistance/pente est une consigne d’entraînement : elle ne reproduit ni vent, revêtement, virages, poids du cycliste, ni puissance extérieure.

La simulation conserve environ 15 km/h, avec des segments arrondis à la demi-minute. Le temps annoncé est une estimation. Une difficulté de 1/5 n’indique pas un parcours court ; Der dure environ 140 minutes et peut être mis de côté puis repris. Les pauses n’empêchent pas de valider un carnet. Les tentatives incomplètes et les secteurs ne valident pas une balade entière.

Les trois trophées de découverte exigent 1, 3 ou 7 balades distinctes parmi le catalogue. Le seuil Atlas reste 7 lors des ajouts. La collection La France en douceur garde ses sept destinations fondatrices ; les carnets restent inchangés. Les formats azuréens ont deux identifiants distincts : le petit ne valide pas la traversée complète. Les deux carnets donnent respectivement 450 et 300 XP, une seule fois chacun à partir de l’historique valide. Répétitions, suppression et import suivent les mêmes règles que les autres campagnes. Le micro-bonus Parenthèse souple partage le plafond existant de 60 XP par semaine.

## Reproduire ou actualiser les données

`lib/scenic-profiles.json` contient les données dérivées, les URL des GPX, leur empreinte SHA-256, le fournisseur d’altitude, la date de vérification et le pas de profil. `lib/scenic-routes.ts` ajoute les textes, les récompenses et les liens de fiches.

```bash
python3 scripts/build-scenic-profiles.py
```

Le générateur nécessite uniquement Python standard et un accès réseau aux sources et à l’IGN. Il utilise un cache ignoré par Git dans `.cache/scenic-profiles`. Pour une actualisation réelle des sources, déplacer ce cache avant de relancer ; conserver l’ancienne version pour comparer les différences. Aucun appel IGN n’est fait par l’application pendant la séance : les profils dérivés sont intégrés au build et consultables hors connexion après chargement.

Après une modification, vérifier la géométrie et le relief, puis exécuter les quatre contrôles du projet avant publication. La disponibilité des services source n’est pas garantie. Les traces intégrées ne constituent pas un guidage routier et n’établissent pas la compatibilité FTMS du TEB5 physique.

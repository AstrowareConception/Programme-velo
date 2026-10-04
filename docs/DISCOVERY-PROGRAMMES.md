# Formats courts, programmes découverte et Route Napoléon

Catalogue actuel : **71 parcours, 29 balades à 1/5, 10 thèmes, 20 campagnes/carnets et 67 badges**. Les exigences précédentes et le trophée PACA (18 destinations fixes) restent inchangés. Aucune clé locale supplémentaire.

## Neuf nouveaux formats courts

Les extraits conservent les kilomètres et altitudes des GPX parents, avec une validation indépendante. Les 13 formats du carnet comprennent ces neuf extraits et les quatre précédents (Chambord, Ré, Golfe-Juan–Cannes, Menton–Garavan). Trophées à trois et six découvertes distinctes, sans XP supplémentaire.

| Tronçon | Difficulté | Distance | D+ lissé | Minutes simulées | Parcours parent |
| --- | --- | ---: | ---: | ---: | --- |
| Antibes–Golfe-Juan via Juan-les-Pins | 1/5 | 6.351 km | 23 m | 25.5 | `cagnes-cannes-littoral` |
| Èze-sur-Mer–Cap-d’Ail | 1/5 | 5.099 km | 68 m | 20.5 | `eze-menton-basse-corniche` |
| Les Baux–Maussane | 1/5 | 4.864 km | 0 m | 19.5 | `baux-alpilles-rocher` |
| Riez–Montagnac | 2/5 | 4.872 km | 111 m | 19.5 | `sainte-croix-valensole` |
| Le Grau-du-Roi–Aigues-Mortes | 1/5 | 5.199 km | 1 m | 21 | `camargue-grau-gallician` |
| Cayeux–Le Hourdel | 1/5 | 6.881 km | 3 m | 27.5 | `baie-somme-cayeux-crotoy` |
| Noyelles–Le Crotoy | 1/5 | 6.884 km | 2 m | 27.5 | `baie-somme-cayeux-crotoy` |
| Candé–Chaumont | 1/5 | 5.498 km | 12 m | 22 | `loire-blois-chaumont` |
| Sevrier–Annecy | 1/5 | 5.870 km | 4 m | 23.5 | `annecy-rive-ouest` |

Sources conservées : France Vélo Tourisme (GPX 599, 554, 953, 102), Nice Côte d’Azur (Tour des Corniches), Chemins des Parcs (Alpilles 133849, Verdon 130033) et La Région du vélo (Annecy 3963). Voir [les sources précédentes](EXPLORATION-ROUTES.md) et [les neuf balades initiales](SCENIC-ROUTES.md). Riez–Montagnac possède des rampes lissées dépassant 8 % : difficulté 2/5, effort modéré RPE 4–5 dans les montées, base 4–14/32. Les huit autres sont à effort doux RPE 2–4, base 4–10/32. Ajustement manuel et pauses libres.

Carnets : **Escales du Sud** (Antibes, Èze, Baux, Riez, Menton ; 220 XP uniques) et **Un paysage en 30 minutes** (Sevrier, Grau, Cayeux, Candé ; 180 XP uniques). Durées estimées à 15 km/h, arrondies par segment, pauses en supplément. La durée réelle peut changer avec la distance FTMS. Filtre combinable : toutes / ≤30 / >30 à 60 / >60 minutes. Aucun kilomètre n’est raccourci.

## Route Napoléon · huit tronçons de Golfe-Juan à Gap

Géométrie : [CRT PACA, itinéraire Route Napoléon](https://provence-alpes-cotedazur.com/que-faire/circuits/route-napoleon/), [archive GPS publique](https://provence-alpes-cotedazur.com/app/uploads/crt-paca/2020/07/gps-routenapoleon-1.zip), membre `gps-garmin/itineraire-15.gpx`. Textes recoupés avec [l’ANERN](https://route-napoleon.com/route-napoleon/toute-la-route/), [ses communes azuréennes](https://route-napoleon.com/ile-delbe-et-cote-dazur/) et [Alpes de Haute-Provence Tourisme](https://www.tourisme-alpes-haute-provence.com/routes-touristiques/route-napoleon/).

Le fichier contient une route de points de passage et une trace dense. **Seule la trace `trkpt` est utilisée** : les additionner fabriquerait des liaisons et plus de 760 km. Le tronçon retenu mesure **239,8 km**, inversé pour simuler le voyage vers le nord. Il suit le tracé touristique routier, distinct du GR 406 pédestre ou équestre. Le GPX sans altitude est complété par IGN RGE ALTI (échantillons de 250 m), puis lissé et représenté tous les 500 m. Les repères sont projetés sur la trace, sans frontières communales ni détours ajoutés. D+ du profil représenté, distinct du cumul GPS brut.

| Étape | Difficulté | Distance | D+ lissé | Minutes simulées | Lieux repérés |
| --- | --- | ---: | ---: | ---: | --- |
| Golfe-Juan → Grasse | 3/5 | 31.571 km | 443 m | 126.5 | Golfe-Juan → Cannes → Le Cannet → Mougins · secteur routier → Mouans-Sartoux → Grasse |
| Grasse → Saint-Vallier-de-Thiey | 3/5 | 13.069 km | 466 m | 52.5 | Grasse → Saint-Vallier-de-Thiey |
| Saint-Vallier-de-Thiey → Séranon · carrefour de la Route Napoléon | 3/5 | 26.035 km | 577 m | 104 | Saint-Vallier-de-Thiey → Escragnolles · route au-dessus du village → Séranon · carrefour de la Route Napoléon |
| Séranon · carrefour de la Route Napoléon → Castellane | 2/5 | 24.451 km | 171 m | 98 | Séranon · carrefour de la Route Napoléon → La Garde → Castellane |
| Castellane → Barrême | 3/5 | 24.356 km | 416 m | 97.5 | Castellane → Col des Lèques · secteur du col → Barrême |
| Barrême → Digne-les-Bains | 2/5 | 30.780 km | 161 m | 123 | Barrême → Digne-les-Bains |
| Digne-les-Bains → Sisteron | 2/5 | 39.225 km | 87 m | 157 | Digne-les-Bains → Malijai → Château-Arnoux-Saint-Auban → Sisteron |
| Sisteron → Gap | 3/5 | 50.348 km | 384 m | 201.5 | Sisteron → Le Poët · secteur routier → Gap |

Le carnet historique conserve ses huit étapes ; la suite Gap–Grenoble a son propre carnet, décrit ci-dessous. Escragnolles reste en contrebas, Séranon est un carrefour routier ; Mougins et Le Poët sont des passages de secteur, sans visite des centres historiques. Digne–Sisteron passe par Château-Arnoux, sans ajout du centre de Volonne. Le sentier de La Clappe et le site des Siréniens sont séparés. L’inversion sert au vélo d’intérieur, sans garantie de sens de circulation ou guidage extérieur.

Le thème réunit désormais quatorze sections. Le carnet **Route Napoléon · de la mer à Gap** a huit étapes fixes, un trophée et **900 XP uniques**. Ordre libre, pauses libres. « Premiers aigles » : trois sections différentes, sans XP additionnel. Les étapes sont des séances séparées ; aucune transition automatique n’est annoncée. Les 2/5 conseillent un effort modéré ; les 3/5 les consignes habituelles de pente, toujours ajustables au ressenti.

## Route Napoléon · six tronçons de Gap à Grenoble

Géométrie : [Michelin Éditions, Grenoble–Embrun](https://editions.michelin.com/la-route-napoleon-1-grenoble-embrun/), [GPX publié](https://editions.michelin.com/gpx/2023/moto/31_LA%20ROUTE%20NAPOL%C3%89ON%201%20%28GRENOBLE-EMBRUN%29_6080100.gpx). Ce fichier contient **trois traces distinctes**. Le générateur sélectionne exclusivement `Grenoble -> Embrun (167,3 km)`, puis inverse et découpe son tronçon Gap–Grenoble, **102,1 km**. Il ignore les alternatives Remollon–Théus et Rousset–Savines-le-Lac. SHA-256 du fichier complet : `8f3c12217c9c4199fcfaa66fca6f28be77bbe436e6e59f97b1cb22369bad8b36`. Une source modifiée, un nom de trace absent ou ambigu, une rupture supérieure à 1 km ou un repère hors trace arrête la génération.

| Étape | Difficulté | Distance | D+ lissé | Minutes simulées | Lieux repérés |
| --- | --- | ---: | ---: | ---: | --- |
| Gap → La Fare-en-Champsaur | 3/5 | 14.534 km | 517 m | 58 | Gap → Col Bayard → La Fare-en-Champsaur |
| La Fare-en-Champsaur → Corps | 2/5 | 24.840 km | 224 m | 99.5 | La Fare-en-Champsaur → Les Barraques · Saint-Bonnet → Saint-Firmin · carrefour → Corps |
| Corps → La Mure | 3/5 | 24.059 km | 425 m | 96 | Corps → La Salle-en-Beaumont · secteur routier → La Mure |
| La Mure → Laffrey | 2/5 | 14.109 km | 99 m | 56.5 | La Mure → Pierre-Châtel · secteur routier → Saint-Théoffrey → Prairie de la Rencontre · secteur routier → Laffrey |
| Laffrey → Vizille | 2/5 | 6.790 km | 0 m | 27 | Laffrey → Vizille |
| Vizille → Grenoble | 3/5 | 17.733 km | 199 m | 71 | Vizille → Brié-et-Angonnes · secteur routier → Eybens → Grenoble |

Altitudes IGN RGE ALTI, échantillonnées tous les 250 m et lissées à 500 m. Le dénivelé est celui du profil représenté. Laffrey–Vizille est entièrement descendant sur ce profil : 0 m D+ ne signifie pas un parcours plat. Il reste à 2/5, effort modéré ajustable, sans objectif de vitesse. Les autres 2/5 proposent des ondulations ; Bayard, Beaumont et Brié constituent les étapes 3/5. Les durées viennent du modèle intérieur à 15 km/h, hors pauses ; elles ne prédisent pas la durée d’une sortie réelle.

Les six nouveaux tronçons partagent leurs extrémités. Le départ Michelin dans Gap `[44.557793, 6.081951]` est à environ **260 m** de l’arrivée du GPX CRT `[44.55964, 6.07997]`. Ce sont deux séances indépendantes ; **aucune liaison n’est ajoutée**, et les quatorze étapes ne sont pas une trace GPS continue. Le Valgaudemar, La Salette, le Sautet, Monteynard, la visite du domaine de Vizille et la Bastille restent hors parcours. La Prairie de la Rencontre est un repère du secteur routier : son monument se trouve à l’écart vers le lac. Les libellés « secteur routier » distinguent les passages à proximité des visites de centres-villes. Cette adaptation d’un itinéraire touristique motorisé sert uniquement à la simulation intérieure, sans garantie de circulation cyclable ni guidage routier.

Textes recoupés avec [l’ANERN, Alpes](https://route-napoleon.com/alpes/), [Corps](https://route-napoleon.com/alpes/corps/), [La Mure](https://route-napoleon.com/alpes/la-mure/), [Vizille](https://route-napoleon.com/alpes/vizille/), [Brié-et-Angonnes](https://route-napoleon.com/alpes/brie-et-angonnes/), [Terres de Gap](https://www.terresdegap.fr/fr/decouvrir/la-route-napoleon/), [Grenoble Tourisme](https://www.grenoble-tourisme.com/fr/decouvrir/culture-et-histoire/route-napoleon/route-napoleon/) et [la mairie de Laffrey](https://www.laffrey.fr/site-napoleon-prairie-de-la-rencontre).

Le carnet **Route Napoléon · de Gap à Grenoble** demande ces six parcours complets, dans n’importe quel ordre : un badge et **700 XP uniques**. Les huit étapes et 900 XP du carnet précédent restent inchangés, ainsi que « Premiers aigles » (3 parmi les huit du sud). Nouveaux trophées sans XP : **Dauphiné en poche** (3 parmi les six du nord), **Traversée impériale** (les 14 étapes fixes). Les répétitions n’ajoutent aucun bonus de carnet. Incomplets et Segment Attack sont exclus ; supprimer la dernière réalisation qualifiante recalcule carnet, trophées et XP. Une autre réalisation complète conserve la validation. L’export/import conserve ces résultats depuis les mêmes identifiants.

## Trois programmes guidés

| Programme | Séances distinctes (minutes) | Bonus unique |
| --- | --- | ---: |
| Trouver son rythme | Premiers tours de roue (15), Souffle tranquille (18), Roulage contemplatif (25), Cadence fluide (30) | 120 XP |
| Premières ondulations | Faux-plats en douceur (20), Deux petites collines (25), Petites vagues (40) | 160 XP |
| Souplesse et régularité | Cadence douce (20), Endurance nomade (30), Cadence fluide (30) | 140 XP |

Ordre et dates libres ; une séance peut contribuer à deux programmes. Un programme donne un badge et un bonus calculé une seule fois depuis l’historique. Répétitions : XP de séance ordinaire seulement. Les incomplets, bonus, parcours, Time Attack et secteurs sont exclus. Une ancienne séance sans `completedWorkout` doit atteindre la durée prévue ; une date invalide ou future est exclue. Supprimer la dernière réalisation recalcule bonus et badge ; export/import compatible.

Six modèles supplémentaires portent les séances découverte à onze : Souffle tranquille (18), Cadence douce (20), Faux-plats en douceur (20), Deux petites collines (25), Endurance nomade (30), Pause active (8). Ce dernier bonus vaut 12 XP, zéro point structuré, dans le plafond commun de 60 XP par semaine. Il ne valide aucun programme. Le programme de douze semaines et le coach conservent leurs règles.

## Fiches historiques harmonisées

Les quatorze cols et étapes historiques reçoivent paysage, points d’intérêt et repères, sans changer ID, relief, géométrie, difficulté, XP ou records. Leurs kilomètres intermédiaires sont **indicatifs, sans positions GPS relevées**, ce que la fiche et le lecteur signalent. Les sept premières balades reçoivent des lieux projetés sur leurs GPX vérifiés par SHA-256, sans recalcul des profils. Chambord et Ré n’ont aucune succession inventée de villages : départ et arrivée complètent leurs paysages. Les 71 fiches proposent les mêmes familles d’informations.

Références complémentaires : [Alpe d’Huez](https://www.alpedhuez.com/fr/activites/activites-ete/velo/les-21-virages/), [Ventoux](https://www.parcduventoux.fr/a-voir-a-faire/decouvrir-en-douceur/decouvrir-le-ventoux-a-velo/), [Tourmalet](https://www.tourisme-hautes-pyrenees.com/voyage-aux-pyrenees/les-grands-sites/col-tourmalet/), [Iseran depuis Bonneval](https://www.velo-maurienne.com/equipement/montee-cyclo-du-col-de-liseran-depuis-bonneval-sur-arc-bonneval-sur-arc/), [Vaison](https://www.cheminsdesparcs.fr/fr/trek/134087-VAISON-LA-ROMAINE----Les-villages-Medievaux-a-velo), [Enclave](https://provence-alpes-cotedazur.com/que-faire/itineraires-randonnee/28-tour-de-lenclave-a-velo-valreas-fr-4346718/), [Velleron](https://provence-alpes-cotedazur.com/que-faire/itineraires-randonnee/11-du-ventoux-a-lisle-sur-la-sorgue-velleron-fr-4347403/). Les autres références Maurienne/Corniches restent sur leurs fiches. Les paysages sont décrits, sans images filmées du trajet.

## Reproduction et limites

```bash
python3 scripts/build-exploration-profiles.py --sources scripts/short-rides-sources.json --output lib/short-rides-profiles.json
python3 scripts/build-exploration-profiles.py --sources scripts/napoleon-sources.json --output lib/napoleon-profiles.json
python3 scripts/build-exploration-profiles.py --sources scripts/napoleon-north-sources.json --output lib/napoleon-north-profiles.json
python3 scripts/build-legacy-places.py
```

Le dernier script utilise les GPX historiques vérifiés du cache : télécharger ces fichiers depuis les URL de `build-scenic-profiles.py`, sans réécrire les profils publiés si seul le cache est nécessaire. Les réponses IGN et GPX sont conservées dans le cache ignoré. Le SHA enregistré porte sur le membre GPX extrait de l’archive. Aucune requête géographique/IGN pendant une séance.

Tests : profils/sources, jonctions, validations indépendantes, ordre libre, incomplets/secteurs exclus, XP uniques, suppression, réimport, reprise, mobile et ordinateur. Le TEB5 réel et les installations physiques restent à tester ; les essais FTMS simulés ne les prouvent pas.

## Estérel et escales Napoléon

Dix sorties supplémentaires, dont six nouveaux formats courts de 15–27 minutes. Les 13 membres des anciens objectifs courts restent fixes ; les nouveaux petits formats ont leurs propres carnets. Le thème Napoléon contient 14 grandes étapes et 4 escales, sans changement des trophées 3/8, 3/6 et 14/14. [Parcours, trois bonus uniques et sources](ESTEREL-ESCALES.md).

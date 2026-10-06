# Vignoble d’Alsace

Lot du 6 octobre 2026, fondé sur main `58a8769bab262903918757bdbe9c29306476d389` : neuf parcours, deux carnets et deux trophées. Le catalogue atteint 80 parcours, 35 balades à 1/5, 11 thèmes, 22 carnets et 74 badges (deux badges de carnet et deux trophées supplémentaires). Les 71 parcours, 20 carnets et 70 badges précédents sont conservés à l’identique, contrôlés par une fixture de ce commit.

## Source et sélection de trace

La [Véloroute du Vignoble d’Alsace](https://www.alsaceavelo.fr/403000009-veloroute-du-vignoble-dalsace/) fournit le [GPX touristique officiel](https://carto.tourisme-alsace.info/traces/403000009.gpx), vérifié le 6 octobre 2026. SHA-256 : `19de9d7abf52fc0ce76db2ff52e81015430f82830f97906988a395f58d521f87`.

Le fichier contient une trace nommée `Véloroute du Vignoble d'Alsace`, une branche initiale et plusieurs branches annexes avec des sauts géographiques ; ses altitudes sont à zéro. Après suppression des points adjacents identiques, seuls les indices 67 à 7640 inclus sont retenus (`pointRange: [67, 7641]`, fin exclusive). Cette portion continue va de Marlenheim à Thann, environ 137,29 km. Les branches, retours et sauts ne deviennent pas des séances ni des liaisons inventées. La sélection est réservée à une source dont l’empreinte est fixée : si le GPX change, le générateur refuse de reconstruire sans nouvelle inspection.

Chaque étape est découpée aux mêmes coordonnées partagées par sa voisine. Les courts formats sont extraits de leurs parents, avec des identifiants distincts. Les repères sont projetés sur la trace et ordonnés. Ribeauvillé est explicitement indiqué comme **plaine orientale**, à environ 2,4 km de son centre ; aucun détour à la vieille ville ou à Riquewihr n’est ajouté. Les centres, châteaux, sommets et rues non parcourus ne sont pas présentés comme des passages de la trace.

## Relief et étapes

Les altitudes proviennent d’IGN RGE ALTI, échantillonnées puis lissées sur 250 m ; le profil final est représenté tous les 500 m. Dénivelés et pentes sont calculés sur ce profil lissé pour les consignes de vélo d’intérieur. Ils ne reproduisent pas automatiquement les chiffres commerciaux ou touristiques de l’itinéraire complet. Les bosses, descentes et faux-plats restent présents. La difficulté inclut la longueur : Rouffach–Thann est 3/5 surtout pour son endurance.

| Étape | Distance calculée | D+ lissé | Difficulté | XP du parcours |
| --- | --- | --- | --- | --- |
| Marlenheim → Obernai | 19.15 km | 93 m | 2/5 | 100 |
| Obernai → Dambach | 24.69 km | 181 m | 2/5 | 120 |
| Dambach → Bergheim | 16.39 km | 32 m | 1/5 | 75 |
| Bergheim → Turckheim | 18.35 km | 61 m | 1/5 | 80 |
| Turckheim → Rouffach | 18.73 km | 56 m | 1/5 | 85 |
| Rouffach → Thann | 39.98 km | 263 m | 3/5 | 190 |
| Obernai → Bernardswiller · court | 5.74 km | 0 m | 1/5 | 35 |
| Dambach → Scherwiller · court | 4.51 km | 5 m | 1/5 | 40 |
| Turckheim → Eguisheim · court | 3.38 km | 36 m | 1/5 | 45 |

Les trois formats courts durent environ 14, 18 et 23 minutes à la vitesse simulée de 15 km/h. Ils restent faciles et ne valident jamais leurs parents. Les grandes étapes peuvent être fractionnées en mode Voyage ; ni le GPS ni la distance mesurée du vélo ne pilotent cette simulation. Pauses et réglage manuel sur 32 niveaux restent disponibles.

## Carnets, trophées et données

- **Vignoble d’Alsace · la traversée** : les six grandes étapes, 650 XP uniques.
- **Parenthèses alsaciennes** : les trois formats courts, 120 XP uniques.
- **Vignes et villages** : trois grandes étapes différentes parmi les six.
- **Vignoble en poche** : les trois courts passages différents.

Une réalisation hors ordre coche l’étape réellement terminée. Répétitions, tentatives incomplètes, secteurs et copies GPX ne remplacent pas les parcours natifs. Suppression et restauration recalculent les bonus ; aucun cumul de 770 XP supplémentaire n’est possible. Les anciens seuils, collections fondatrices, carnets et territoires restent fixes. Les anciens exports JSON v2/v3 restent compatibles ; aucun changement de schéma.

Obernai et Eguisheim disposent de photos créditées. Les vues sont prises hors du tracé et leurs limites sont affichées ; aucune photo générique n’est attribuée aux autres villages. [Sources et droits](LANDSCAPE-PHOTOS.md).

## Reconstruction et contrôles

`python3 scripts/build-exploration-profiles.py --sources scripts/alsace-sources.json --output lib/alsace-profiles.json` reconstruit les profils depuis la source vérifiée et IGN. Les données générées conservent la provenance, les coordonnées, les distances et les repères. Les fichiers temporaires restent ignorés.

Tests unitaires : conservation exacte du catalogue précédent, sources et étapes contiguës, pentes et relief, courts indépendants, coches hors ordre, bonus uniques, suppression et restauration ancienne. Scénarios navigateur mobile/ordinateur : thème, durée, favoris, photos et droits, carnets, pause/reprise après rechargement, achèvement et suppression. Les contrôles obligatoires et la version publiée sont consignés dans l’état de reprise externe après observation. Le diagnostic matériel de la PR 29 demeure séparé ; ce lot ne qualifie pas le TOPUTURE physique.

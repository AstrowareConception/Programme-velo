# Photos des paysages

Premier lot du 5 octobre 2026 : cinq photographies réelles des lieux azuréens, utilisées dans huit parcours existants. Aucun parcours, profil, repère géographique, objectif ou trophée n’est ajouté ou modifié par ce lot.

## Dans l’application

Dans une fiche de parcours illustré, ouvre **Voir les photos** : une seule image s’affiche, avec sa légende, sa date, son auteur, sa licence et sa page source. **Photo précédente / Photo suivante** parcourent les lieux disponibles. Les photos restent facultatives et ne sont chargées qu’après l’ouverture de la galerie.

La préparation et la vue complète du lecteur proposent la même galerie. Pendant l’effort, elle suit le dernier **repère illustré** atteint selon les kilomètres affichés. Cela ne signifie pas que tous les repères ont une photo. Lorsqu’aucune photo n’a encore été atteinte, la première porte la mention **À découvrir**. Une navigation manuelle affiche **Aperçu du parcours** ; **Suivre les repères** revient à la sélection liée à la progression. En Voyage, les bornes absolues du parcours restent utilisées après une reprise à mi-chemin.

Dans **Plus → Son, voix et média**, désactive **Photos des paysages** pour retirer les galeries. Le même réglage est disponible avant le départ et pendant l’effort. Il reste enregistré après rechargement et dans les sauvegardes JSON, sans modifier journal, mesures, favoris, courses ou progression Voyage. Les anciens exports v2/v3 restent acceptés ; sans réglage explicite, les galeries sont disponibles mais fermées. La vue essentielle les masque pendant l’effort.

Une photo qui ne se charge pas laisse sa légende et ses crédits, avec **Réessayer la photo**. Les consignes, lieux et commandes de séance restent utilisables. Fermer la galerie retire l’image ; cela n’efface pas le cache du navigateur.

## Géographie et limites

Les photos illustrent les lieux, à une autre date et souvent depuis un point de vue extérieur au tracé : survol de Cagnes, Fort Carré à Antibes, hauteurs du Trabuquet à Menton. La légende indique ces différences. La vue de la Croisette illustre aussi Cannes sur la Route Napoléon, sans prétendre que ce tracé historique suit chaque rue photographiée. Les dates correspondent aux dates de prise de vue indiquées par les auteurs ; les lieux peuvent avoir changé.

Il n’y a ni vidéo continue, ni déplacement réel dans la photo, ni localisation GPS du cycliste. Les images ne prouvent ni passage sur le terrain, ni mesure du vélo. Aucun rapprochement automatique n’est fait avec le nom d’un GPX personnel ; ces GPX gardent leurs propres cartes, profils et textes. Un parcours sans sélection documentée garde l’expérience existante, sans image de remplacement inventée.

## Parcours illustrés

| Parcours existant | Repères illustrés |
| --- | --- |
| Cagnes-sur-Mer → Cannes | Cagnes-sur-Mer, Antibes, Golfe-Juan, Cannes · Croisette |
| Golfe-Juan → Cannes · Littorale | Golfe-Juan, Cannes · Croisette |
| Antibes → Golfe-Juan · format court | Antibes, Golfe-Juan |
| Route Napoléon · Golfe-Juan → Grasse | Golfe-Juan, Cannes |
| Route Napoléon · Golfe-Juan → Cannes · petite escale | Golfe-Juan, Cannes |
| Nice → Menton · Grande Corniche | Menton · vieux port |
| Èze-sur-Mer → Menton · Basse Corniche | Menton · vieux port |
| Menton · promenade de Garavan | Menton · vieux port |

Les kilomètres sont repris des repères déjà présents sur chaque trace, sans nouvelle projection de coordonnées. Les EXIF ambigus de la photo de Golfe-Juan ne servent pas à placer un repère.

## Sources et droits des fichiers

Les descriptions et droits ont été vérifiés sur les pages des auteurs dans Wikimedia Commons le 5 octobre 2026. Les fichiers locaux restent sous les droits indiqués ci-dessous, indépendamment du code de l’application. Les crédits et liens de licence sont affichés à côté de chaque photo. Les versions dérivées conservent leur licence.

| Fichier original et source | Auteur | Date | Droits | Version locale |
| --- | --- | --- | --- | --- |
| [Aerial photograph of Cros-de-Cagnes.jpg](https://commons.wikimedia.org/wiki/File:Aerial_photograph_of_Cros-de-Cagnes.jpg) | Olivier Cleynen | 28/09/2020 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | `cagnes.webp` · 960×640 · 58 158 octets |
| [Port Vauban et citadelle d’Antibes depuis le Fort carré.jpg](https://commons.wikimedia.org/wiki/File:Port_Vauban_et_citadelle_d%27Antibes_depuis_le_Fort_carr%C3%A9.jpg) | Plyd | 20/09/2009 | Domaine public, déclaration de l’auteur sur la page source | `antibes.webp` · 960×640 · 59 396 octets |
| [Port de Golfe-Juan.jpg](https://commons.wikimedia.org/wiki/File:Port_de_Golfe-Juan.jpg) | Robert Guarino | 01/02/2021 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | `golfe-juan.webp` · 960×720 · 94 184 octets |
| [Panoramic of Cannes.JPG](https://commons.wikimedia.org/wiki/File:Panoramic_of_Cannes.JPG) | Copyleft | 11/07/2015 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | `cannes.webp` · 960×211 · 20 924 octets |
| [Panorama de Menton (França).jpg](https://commons.wikimedia.org/wiki/File:Panorama_de_Menton_(Fran%C3%A7a).jpg) | Prekmarg | 25/08/2018 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | `menton.webp` · 960×640 · 30 084 octets |

Modifications : orientation normalisée selon l’original, réduction à 960 px de large sans agrandissement, conversion WebP qualité 70 et retrait des métadonnées. Aucun recadrage ni retouche de paysage. Les URL de téléchargement et SHA-256 de l’original et du dérivé sont conservés dans `lib/landscape-photos.json`.

## Chargement et PWA

Le premier lot représentait **262 746 octets** ; les dix images actuelles représentent **574 734 octets** au total, chacune sous 100 000 octets. Elles sont servies depuis l’application, sans requête à Wikimedia lors de la lecture. `next/image` conserve les dimensions, le texte alternatif et le chargement différé ; les WebP déjà allégés sont servis directement afin de rester identiques aux fichiers documentés et cacheables sous une URL locale. Une seule photo est montée à la fois. Pas de préchargement du catalogue, ni de téléchargement de tout le catalogue.

Cache PWA v15 : le service worker existant peut conserver une image après sa consultation. Les photos non consultées et les cartes externes ne sont pas garanties hors connexion. Le lot PWA livré ajoute un compteur vérifié et **Préparer les photos** dans Plus pour télécharger les dix images (575 Ko affichés). [Fonctionnement et limites](PWA-OFFLINE.md). Installation, veille, casque et TOPUTURE physique restent à valider sur appareils réels.

## Contrôles du lot

Tests des correspondances exactes avec les repères, absence d’images attribuées aux GPX inconnus, kilomètres absolus, intégrité des fichiers et budget, absence d’EXIF, crédits, ancien export et réglage conservé. Scénarios navigateur sur mobile et ordinateur : absence de requête avant ouverture, navigation et droits, masquage/rechargement, lecture Voyage à mi-parcours, pause/reprise et vue essentielle, échec de photo puis relance. Régression complète, typecheck et build obligatoires sur le commit final. Les SHA, PR, CI et version réellement publique seront ajoutés à l’état de reprise externe après observation.

## Extension du 6 octobre 2026

Cinq photographies supplémentaires, droits et dates vérifiés sur Wikimedia Commons. Les neuf nouvelles correspondances portent la couverture à dix-sept parcours : Ventoux par Bédoin, Galibier depuis Valloire, les deux étapes Agay–Trayas, trois parcours passant par Obernai et deux par Eguisheim. Les anciennes correspondances sont conservées.

| Source | Auteur | Date disponible | Droits | Dérivé local |
| --- | --- | --- | --- | --- |
| [Le sommet minéral du Ventoux](https://commons.wikimedia.org/wiki/File:Mont_Ventou.JPG) | Véronique PAGNIER | 2007-08 | [Domaine public](https://commons.wikimedia.org/wiki/File:Mont_Ventou.JPG#Licensing) | `ventoux.webp` · 640×980 · 44,170 octets |
| [Le Galibier, côté Hautes-Alpes](https://commons.wikimedia.org/wiki/File:Col_du_Galibier_depuis_la_route_c%C3%B4t%C3%A9_Hautes-Alpes_(septembre_2024).JPG) | Florian Pépellin | 2024-09-01 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | `galibier.webp` · 800×598 · 55,834 octets |
| [Les roches rouges du cap Roux](https://commons.wikimedia.org/wiki/File:Esterel_-_Pic_du_cap_roux_(37462515710).jpg) | s_wh | 2017-07-17 | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) | `esterel-cap-roux.webp` · 800×533 · 79,474 octets |
| [Obernai, les toits dans la lumière hivernale](https://commons.wikimedia.org/wiki/File:Le_centre_d%27Obernai_hivernal_depuis_le_mont_national.jpg) | Valentin F.R. | 2018-02-13 | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | `obernai.webp` · 800×500 · 65,162 octets |
| [Eguisheim entre les rangs de vigne](https://commons.wikimedia.org/wiki/File:Vue_depuis_les_vignes_(Eguisheim)_(2).jpg) | Gzen92 | 2017-10-14 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | `eguisheim.webp` · 800×600 · 67,348 octets |

Le Ventoux ne fournit que le mois d’août 2007 : aucun jour n’est inventé. Le Galibier est vu du versant Hautes-Alpes, opposé au départ depuis Valloire. Le cap Roux illustre le massif, sans représenter la route côtière ni une montée au sommet. Obernai est photographié depuis le mont National, absent du tracé. Eguisheim est vu depuis les vignes, sans visite ajoutée à ses rues. Ces différences sont affichées dans les légendes.

Les nouveaux dérivés sont réduits sans recadrage ni agrandissement, WebP qualité 72, métadonnées retirées. Ils pèsent chacun moins de 80 Ko. `scripts/landscape-sources.json` conserve les dimensions maximales et empreintes des originaux ; `scripts/build-landscape-photos.py` vérifie ces empreintes avant reconstruction. Le manifeste conserve aussi les SHA-256 des dérivés.

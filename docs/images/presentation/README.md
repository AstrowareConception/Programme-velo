# Captures de la présentation VéloQuest

[Présentation commerciale](../../PRESENTATION.md) · [Catalogue complet](../../CATALOGUE.md)

## Provenance

Les 24 fichiers JPEG de ce dossier sont des captures authentiques de l’interface publiée sur https://programme-velo.vercel.app/, prises le 7 octobre 2026 dans un navigateur de démonstration sur ordinateur (viewport 1 348 × 926). Aucun écran ni résultat n’a été redessiné. Le cadrage correspond au viewport, parfois après défilement ou ouverture d’un panneau.

La version `1147628` a été observée dans **Plus** et correspond au commit `1147628` de `main` consulté pour l’inventaire. Les fonctions conditionnelles (Bluetooth, reconnaissance vocale, métriques mesurées) sont décrites à partir du code et des validations documentées ; ces captures ne constituent pas un essai matériel.

## Données de démonstration

Le navigateur était initialement sans historique. Les premiers écrans montrent cet état. Pour illustrer les graphiques et le journal, le fichier [demo-fictive.json](demo-fictive.json) a ensuite été importé par **Plus → Coller une sauvegarde**.

Ce profil, nommé **Camille · démo fictive**, contient huit séances déclarées et six mesures inventées uniquement pour montrer le fonctionnement de l’interface. Ce n’est ni un témoignage, ni un suivi réel, ni une projection de perte de poids. Les métriques absentes restent absentes ; aucune télémétrie physique ou note de cadence n’a été simulée pour illustrer un résultat connecté.

Pour reproduire ces écrans, utiliser un navigateur ou profil de test sans données à conserver : l’import remplace les données de destination. Ne pas importer cet exemple dans un profil personnel. Le carnet du canal a ensuite été créé avec le bouton de l’interface. Une portion de Voyage a été lancée puis mise en pause pour photographier le lecteur, sans être enregistrée comme réalisation complète.

## Galerie

| Fichier | Écran illustré |
| --- | --- |
| `01-bienvenue.jpg` | Premier écran du guide de démarrage |
| `02-semaine-adaptee.jpg` | Quête et proposition de semaine |
| `03-catalogue-seances.jpg` | Catalogue de séances |
| `04-programmes-decouverte.jpg` | Programmes découverte dépliés |
| `05-themes-voyage.jpg` | Thèmes, campagnes et filtres des parcours |
| `06-campagnes.jpg` | Étapes et bonus des campagnes |
| `07-photos-paysages.jpg` | Photographie de Golfe-Juan et crédits |
| `08-mode-voyage.jpg` | Choix d’une portion de Voyage |
| `09-preparation.jpg` | Préparation de séance |
| `10-lecteur-carte.jpg` | Profil et carte du lecteur complet |
| `11-lecteur-essentiel.jpg` | Vue essentielle en pause |
| `12-son-voix-medias.jpg` | Alertes et conseils médias |
| `13-objectifs-cockpit.jpg` | Objectifs hebdomadaires et cockpit |
| `14-suivi-mesures.jpg` | Mesures et courbes fictives |
| `15-bilan-habitudes.jpg` | Courbes et bilan hebdomadaire fictifs |
| `16-journal-coach.jpg` | Détail de séance fictive, commentaire du coach |
| `17-pwa-hors-connexion.jpg` | Installation et disponibilité locale |
| `18-badges.jpg` | Collections et catalogue des badges |
| `19-sauvegarde-transfert.jpg` | Export, partage et copie JSON |
| `20-segment-attack.jpg` | Quatre secteurs du Ventoux |
| `21-defis-parcours.jpg` | Défis accessibles sur le Ventoux sans ancien record |
| `22-carnet-personnel.jpg` | Carnet du canal créé depuis l’interface |
| `23-defis-maitrise.jpg` | Précision, continuité et gestion |
| `24-defis-calories.jpg` | Épreuves de 5 et 10 minutes |

## Éléments tiers visibles

- `07-photos-paysages.jpg` inclut **Port de Golfe-Juan**, photographie de **Robert Guarino**, 1er février 2021, [source Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Port_de_Golfe-Juan.jpg), sous [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). La photographie a été allégée en WebP par l’application, puis reproduite au sein de cette capture JPEG. La capture qui la reproduit est distribuée sous **CC BY-SA 4.0** ; les crédits restent visibles et rappelés ici. Les autres captures ne reprennent pas cette photographie.
- `10-lecteur-carte.jpg` contient une carte **© OpenStreetMap contributors**, rendue avec Leaflet ; l’attribution est conservée dans l’image. [Copyright et licence des données OpenStreetMap](https://www.openstreetmap.org/copyright).
- Pour les photographies embarquées dans l’application : [sources, licences et méthode](../../LANDSCAPE-PHOTOS.md).

## Actualisation

Les chiffres de la présentation et du catalogue ont été vérifiés depuis les exports des modules `lib/data.ts`, `lib/routes.ts`, `lib/campaigns.ts` et `lib/workout-programs.ts` : 44 séances, 84 parcours (38 balades, 38 étapes, 8 cols), 22 campagnes, 6 programmes et 77 badges.

Lors d’une évolution, actualiser ensemble le résumé du README, la présentation, le catalogue et les captures concernées. Conserver des légendes explicites pour toute donnée fictive et les crédits des éléments tiers. Les contenus non encore livrés restent dans la roadmap.

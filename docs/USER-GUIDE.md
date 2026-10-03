# Guide utilisateur VeloQuest

## 1. Premier lancement

Renseigner :

- un prénom ou pseudo ;
- la date de départ du programme ;
- éventuellement le poids et le tour de taille de départ ;
- les objectifs correspondants.

Ces informations restent dans le stockage local de l'appareil.

## 2. Choisir une séance

L'écran **Quête** propose le Coach Express.

Indiquer :

- le temps disponible ;
- l'énergie du jour.

VeloQuest tient aussi compte de la charge intense déjà réalisée dans la semaine.

Le planning n'impose pas un jour précis : l'objectif est d'atteindre les missions hebdomadaires en respectant une variété suffisante et un plafond de séances dures.

## 3. Pendant la séance

Avant de démarrer, le pré-vol affiche tous les segments.

Pendant l'effort :

- le niveau TEB5 cible est affiché en grand ;
- le RPE cible reste prioritaire ;
- la cadence cible est indiquée lorsqu'elle est pertinente ;
- le prochain segment est annoncé ;
- l'écran peut être maintenu éveillé ;
- bip, voix et retour haptique sont configurables.

Si tous les niveaux paraissent trop faciles ou trop durs, régler **Plus > Calibration résistance TEB5**.

## 4. Bluetooth

Sur navigateur compatible Web Bluetooth :

1. connecter le vélo ;
2. vérifier le Bluetooth Lab ;
3. laisser VeloQuest enregistrer les métriques FTMS.

Sur iPhone, utiliser le mode guidé et saisir les valeurs affichées sur le vélo en fin de séance.

Le pilotage automatique ne doit être utilisé qu'après validation du protocole documenté dans `docs/TEB5-BLUETOOTH-VALIDATION.md`.

## 5. Micro-séances bonus

Les bonus de 10, 15 ou 20 minutes doivent rester faciles.

Ils :

- augmentent le volume ;
- donnent un peu d'XP ;
- ne remplacent pas les séances structurées ;
- ont un bonus XP hebdomadaire plafonné.

## 6. Cols et GPX

L'onglet **Parcours** contient plusieurs ascensions et accepte des fichiers GPX.

À l'import, VeloQuest calcule :

- distance ;
- dénivelé positif ;
- pente lissée ;
- profil altimétrique ;
- niveaux de résistance conseillés.

Avec télémétrie distance, le marqueur suit la progression réelle.

## 7. Suivi

Enregistrer régulièrement poids et tour de taille, idéalement dans des conditions similaires.

Le suivi affiche les tendances et objectifs. Une mesure isolée compte moins que l'évolution sur plusieurs semaines.

Le journal permet d'ouvrir le détail d'une séance et de supprimer une saisie erronée.

## 8. Gamification

VeloQuest récompense :

- la régularité ;
- les semaines parfaites ;
- la variété ;
- les kilomètres ;
- les séances connectées ;
- les cols ;
- les objectifs physiques.

L'XP ne doit jamais être une raison de dépasser le plafond de séances dures.

## 9. Sauvegardes

Dans **Plus** :

- exporter une sauvegarde JSON complète ;
- exporter séances et mesures en CSV ;
- importer un ancien backup ;
- consulter l'empreinte locale.

Faire périodiquement une sauvegarde JSON, notamment avant de changer de téléphone ou d'effacer les données du navigateur.

## 10. Installation PWA

Sur un navigateur compatible, utiliser le bouton d'installation proposé.

Sur iPhone : utiliser le menu de partage puis **Ajouter à l'écran d'accueil** / **Ouvrir comme app web**.

La PWA offre le meilleur confort plein écran et un fonctionnement hors ligne amélioré.

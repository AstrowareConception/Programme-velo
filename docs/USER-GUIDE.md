# Guide utilisateur VeloQuest

## 1. Premier lancement

Renseigner :

- un prénom ou pseudo ;
- la date de départ du programme ;
- éventuellement le poids et le tour de taille de départ ;
- les objectifs correspondants.

Ces informations restent dans le stockage local de l'appareil.

## 2. Choisir une séance

L'écran **Quête** propose le coach adaptatif local.

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

Les bonus de 10, 12, 15 ou 20 minutes doivent rester faciles. **Parenthèse souple** propose 12 minutes à RPE 2–3 avec peu de résistance et partage le même plafond de 60 XP par semaine.

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

Le catalogue comprend des étapes accessibles de Provence et des Corniches à 2/5–3/5, avec montées, descentes et récupérations. Recherche, difficulté, catégories, tri et favoris aident à choisir.

Les profils des cols et étapes historiques sont simplifiés. Les neuf balades utilisent des traces officielles et un relief lissé depuis leur altitude GPX ou les données IGN. Leur D+ est calculé sur le profil affiché et peut différer d’une fiche touristique. Un GPX personnel utilise les points de ton fichier et leur altitude ; ses valeurs dépendent de leur qualité. Avec distance FTMS, le marqueur suit la variation du compteur du vélo depuis le départ. Sans elle, la progression est simulée à partir du temps des segments. Les niveaux proposés sur 1–32 représentent l'effort conseillé, pas une reproduction physique exacte de la pente.

**Time Attack** chronomètre un parcours entier avec record et fantôme. **Segment Attack** porte sur l'un des quatre secteurs, avec un record propre au secteur. Une tentative arrêtée avant l'arrivée ne devient pas un record valide.

Les **défis** ajoutent une contrainte. Les **campagnes** regroupent plusieurs parcours : Découverte Provence, Tour Vallonné, Légendes du Tour, Défi des Alpes et les carnets **Au fil de l’eau** / **Échappées patrimoine**. Tu peux terminer les étapes dans le désordre : les coches suivent les vrais parcours achevés et « Continuer » propose le premier qui manque. Chaque campagne donne un badge et un bonus XP unique, quel que soit le nombre de répétitions. Un secteur ou une tentative incomplète ne valide pas une étape entière.

### Balades à 1/5

Depuis **Parcours**, choisis **Explorer les 9 balades** ou le filtre **Balades**. Le catalogue propose le Der, la rive ouest d’Annecy, Chambord, l’île de Ré, le Marais poitevin, le canal du Midi et Tours–Villandry, ainsi que le littoral Cagnes-sur-Mer–Cannes et le format court Golfe-Juan–Cannes. **Découvrir le paysage** présente le lieu et les points d’intérêt. **Partir en balade** ouvre la préparation et un effort facile, RPE 2–4, avec niveaux de base 4–10 ; le réglage manuel reste disponible.

Les pauses sont libres, les chronos et défis facultatifs. Une sortie à 1/5 peut être longue : le Der approche 140 minutes simulées, Chambord environ 25. Choisis selon ton temps, ou mets une balade en cours de côté pour la reprendre. Le lecteur contient aussi **Ton carnet de paysage**. La carte et le marqueur représentent l’itinéraire virtuel ; ils ne mesurent pas un déplacement extérieur.

**Ta Côte d’Azur :** Cagnes-sur-Mer → Cannes couvre 23,8 km et environ 95 minutes simulées. Pour une courte sortie, Golfe-Juan → Cannes couvre 7,5 km et environ 30 minutes. Ouvre **Les villes traversées** dans la fiche ou la préparation : les distances indiquent des repères sur la trace, pas les entrées administratives des communes. Dans le lecteur, le repère atteint et **À suivre** évoluent avec ta progression et reviennent après une pause/reprise. Le relief conserve les petites ondulations d’Antibes/Juan-les-Pins ; le niveau reste doux et ajustable. Terminer le petit format valide uniquement ce format.

Les carnets sont des programmes de découverte sans jours imposés. Au fil de l’eau donne un bonus unique de 450 XP pour ses quatre balades complètes ; Échappées patrimoine, 300 XP pour ses trois balades. Premier paysage, Flâneur de France et Atlas des balades récompensent respectivement 1, 3 et 7 balades différentes. Refaire la même balade rapporte l’XP de séance, mais ne multiplie pas le bonus du carnet et ne remplace pas une nouvelle destination. Atlas des balades reste fixé à 7 balades différentes ; la collection La France en douceur conserve ses sept balades fondatrices. Ajouter des destinations ne retire pas une récompense déjà acquise.

Pour une séance courte sans parcours géographique, le catalogue **Séances** ajoute Roulage contemplatif (25 min), Cadence fluide (30 min) et Petites vagues (40 min). Ces formats conservent les missions du programme de douze semaines et les conseils du coach.

## 7. Suivi

Enregistrer régulièrement poids et tour de taille, idéalement dans des conditions similaires.

Le suivi affiche les tendances et objectifs. Une mesure isolée compte moins que l'évolution sur plusieurs semaines.

Pour une séance déjà faite, ouvre **Séances > + Enregistrer une séance déjà faite**, indique la date et l'heure locales, la durée, le ressenti et les valeurs lues sur le vélo, puis valide. Cette saisie libre ne valide pas un parcours ou une course.

À la fin d'une séance guidée, le même champ permet de corriger la date et l'heure. Les semaines respectent les dates locales même lors du passage à l'heure d'hiver. Les sauvegardes conservent les instants UTC ; l'affichage suit le fuseau actuel du téléphone.

Dans **Suivi**, choisis la date de mesure puis saisis poids, taille et/ou abdomen. Le journal ouvre le détail d'une séance. **Supprimer cette séance** demande confirmation et retire son XP, sa contribution aux semaines et ses performances. Les campagnes, badges, collections et records sont recalculés depuis l'historique restant. Si une autre séance complète valide le même parcours, son étape reste cochée. Les récompenses déjà enregistrées sur les autres séances sont conservées.

Le bouton × de chaque mesure demande confirmation et retire cette mesure des courbes et des objectifs. Annuler la confirmation conserve la donnée. Ces suppressions ne touchent pas une séance actuellement en cours.

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

La PWA offre un affichage plein écran et un cache local. Les cartes distantes ne sont pas garanties hors connexion.

## 11. Reprendre une séance et vérifier une mise à jour

Au retour, le panneau **Séance interrompue** propose de reprendre ou d'abandonner la séance. Le mode de course, le secteur, le défi et les données déjà échantillonnées sont conservés. Une connexion Bluetooth doit être rétablie après rechargement ; la continuité du compteur dépend du vélo.

Après une mise à jour, recharge en ligne puis vérifie ton journal. **Plus** affiche le numéro court de version ; `/api/version` fournit le commit complet pour un diagnostic. Exporter une sauvegarde reste utile avant tout changement d'appareil.

Les tests de vélo simulé ne valident pas ton TEB5 réel. Le compteur « KCAL VÉLO » est cumulatif ; les calories préremplies de séance utilisent sa variation échantillonnée. Corrige-les manuellement si nécessaire.

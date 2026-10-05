# Roadmap VéloQuest

Actualisée le 5 octobre 2026. Le catalogue Estérel est intégré ; le confort du lecteur et le Voyage par portions sont décrits ci-dessous avec les prochaines fonctions. Les références exactes de contrôle, fusion et déploiement figurent dans le document externe d’état de reprise après vérification.

## Socle disponible

Programme souple de douze semaines, trois programmes découverte, onboarding progressif, lecteur manuel 32 niveaux et reprise locale ; GPX, parcours et thèmes, campagnes uniques, défis, Time Attack et Segment Attack ; historique, saisie rétroactive et suppression, mesures, sauvegardes ; installation active quand le navigateur propose le dialogue. Les 14 grandes étapes Napoléon vont de Golfe-Juan à Grenoble, avec deux carnets indépendants.

## Lot Estérel et petites escales

Dix nouvelles destinations, un thème Estérel, trois carnets, deux trophées de découverte. Catalogue intégré par la PR 28 : 71 parcours, 29 balades 1/5, 10 thèmes, 20 carnets et 67 badges. [Contenu, sources et règles](ESTEREL-ESCALES.md). Pas de changement de stockage ni de raccourcissement artificiel des grandes étapes.

## Confort du lecteur et usage avec un média

Vue essentielle ou complète, commandes accessibles, volume et fréquence des alertes, test audio avant le départ, voix calibrée et préavis facultatif sur les segments minutés. État réel du maintien de l’écran, relance après refus/interruption et rappel au retour d’arrière-plan. Préférences sauvegardées ; chronos, défis et reprise conservés. [Guide pratique](READER-COMFORT.md). Lot livré par la PR 30, contrôlé et déployé sur main `f1eea5a`.

L’installation active existe déjà. Restent à éprouver sur appareils réels : installation, veille/reprise, casque et coexistence avec podcast/vidéo. Le lot PWA décrit ci-dessous accompagne les mises à jour et vérifie la disponibilité des fichiers essentiels. Le cache actuel n’assure pas les cartes externes hors connexion.

## Voyage par portions

Première version : un parcours natif ou GPX en portions de 15/30/45/60 minutes, progression retrouvée dans Quête et reprise de la portion en cours. Position simulée à 15 km/h, géométrie entière conservée et mesures du vélo distinctes. Une portion inachevée ne valide pas de kilomètres ; l’union des portions achevées valide la route, ses campagnes et une récompense unique. Recalcul après suppression, sauvegardes compatibles et trois trophées ajoutés. [Guide et limites](VOYAGE.md).

Le catalogue reste à 71 parcours, avec 70 badges. Les références exactes de contrôle et de livraison seront portées dans l’état de reprise externe après observation. Les carnets Napoléon et Estérel restent libres ; ce mode ne lance pas automatiquement la prochaine étape et n’invente aucune liaison à Gap.

## Premier lot de photos documentées

Cinq photos azuréennes sur huit parcours existants : galeries fermées au départ, une image locale à la fois, légendes et droits, navigation libre ou suivi des repères, masquage sauvegardé et vue essentielle conservée. Intégration dans les fiches, la préparation et le lecteur, y compris Voyage à mi-parcours. [Sélection et limites](LANDSCAPE-PHOTOS.md). Les 71 parcours et 70 badges sont conservés. Les références de validation et publication de ce lot sont consignées dans l’état de reprise externe après observation.

## Expérience PWA

Paquet du build vérifié, compteur de photos et préparation facultative dans Plus ; nouvelle version en attente, consentement des onglets au repos et rechargement accompagné, reprise sauvegardée conservée. [Guide et limites](PWA-OFFLINE.md). Cartes externes et médias exclus ; stockage du navigateur révocable. Références de livraison consignées dans l’état externe après contrôle du commit exact et de la production.

## Prochaine priorité : autres paysages

Étendre les photos documentées aux autres régions et aux grands cols, avec les mêmes repères, droits et budgets ; préparer ensuite le Vignoble d’Alsace et ses formats variés. L’enchaînement de plusieurs étapes et le carnet personnel viendront ensuite.

## Packs de parcours suivants

| Priorité | Ensemble | Apport attendu | État |
| --- | --- | --- | --- |
| 1 | Vignoble d’Alsace | Villages, vignes et ondulations ; extraits courts et étapes 2/5–3/5 | Sources touristiques repérées ; GPX et coupes à vérifier |
| 2 | Canal de Nantes à Brest | Pontivy, Rohan, Josselin et écluses ; balades douces | GPX d’étapes publiés ; géométrie et relief à traiter |
| 3 | Route des Grandes Alpes | Roselend, Izoard et regroupement avec les cols existants | Traces officielles repérées ; préserver tous les IDs précédents |
| 4 | Ardèche | Balazuc, villages, gorges et reliefs variés | Parcours touristiques repérés ; sélection exacte à établir |

Chaque pack devra proposer les mêmes informations locales : paysages, lieux réellement traversés ou proches clairement distingués, sources, distance, relief et limites. Difficultés fixées après analyse, pas avant. Les objectifs nouveaux doivent avoir une liste et un seuil stables ; les ajouts ne doivent pas déplacer un ancien trophée.

## Immersion après le mode Voyage

Le premier lot de photos azuréennes est décrit ci-dessus. Étendre les sélections avec les mêmes droits, légendes et limites, sans créer une association trompeuse avec le tracé. Sons d’ambiance facultatifs, sans masquer les consignes. Un lecteur vidéo intégré est à étudier après les essais pratiques : disponibilité réseau, consommation, mode flottant et contraintes de la plateforme. Les photos ne constituent ni une restitution continue du trajet ni un relevé géographique.

## Puis : carnet personnel

Composer un voyage à partir du catalogue et des GPX personnels, choisir l’ordre et suivre ses réalisations. Sauvegarde locale et export/import nécessaires. Les objectifs personnels ne doivent pas devenir une source illimitée d’XP par duplication de traces ou création répétée de carnets. Prévoir l’effet d’une suppression de GPX et la persistance des séances historiques.

## Validation matérielle à l’arrivée du vélo

Suivre le [protocole TEB5](TEB5-BLUETOOTH-VALIDATION.md) : données réellement transmises, précision et évolution des compteurs, éventuel contrôle de résistance, pauses et reprises. Les tests avec un simulateur ne valident pas le matériel physique. Installation réelle et veille sur iPhone/Safari restent aussi à vérifier.

## Contrôles avant chaque publication

Sur le commit exact proposé : `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build`, parcours utilisateur sur mobile et ordinateur. Aucun contrôle obligatoire en échec. Vérifier ensuite le SHA effectivement publié par Vercel et `/api/version`, puis actualiser README, guides et état de reprise.

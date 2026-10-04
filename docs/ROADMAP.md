# Roadmap VéloQuest

Actualisée le 4 octobre 2026. Le document distingue le produit intégré aux lots précédents, le lot Estérel préparé ici et les prochaines fonctions. Les références exactes de contrôle, fusion et déploiement figurent dans le document externe d’état de reprise après vérification.

## Socle disponible

Programme souple de douze semaines, trois programmes découverte, onboarding progressif, lecteur manuel 32 niveaux et reprise locale ; GPX, parcours et thèmes, campagnes uniques, défis, Time Attack et Segment Attack ; historique, saisie rétroactive et suppression, mesures, sauvegardes ; installation active quand le navigateur propose le dialogue. Les 14 grandes étapes Napoléon vont de Golfe-Juan à Grenoble, avec deux carnets indépendants.

## Lot Estérel et petites escales

Dix nouvelles destinations, un thème Estérel, trois carnets, deux trophées de découverte. Catalogue prévu après intégration : 71 parcours, 29 balades 1/5, 10 thèmes, 20 carnets et 67 badges. [Contenu, sources et règles](ESTEREL-ESCALES.md). Pas de changement de stockage ni de raccourcissement artificiel des grandes étapes.

## Prochaine priorité : mode Voyage

Avancer sur un itinéraire long en plusieurs séances choisies selon le temps disponible, retrouver sa position et proposer « Continuer mon voyage ». Afficher une progression lisible, les lieux atteints et la prochaine portion, en complément des carnets libres existants. La carte doit signaler les discontinuités des sources et les étapes séparées ; elle ne doit pas inventer de liaison à Gap ou entre deux GPX.

Conditions de livraison : distinction entre portion parcourue et route entière terminée ; une seule validation et récompense de route complète ; conservation des sessions, courses, défis et reprise en cours ; recalcul documenté après suppression ; export/import et ancien historique compatibles ; sortie du mode librement possible. Une durée disponible doit produire une portion de la vraie géométrie, jamais des kilomètres compressés. Les choix pour une première utilisation doivent rester simples, et la difficulté du relief distincte de l’effort conseillé.

## Packs de parcours suivants

| Priorité | Ensemble | Apport attendu | État |
| --- | --- | --- | --- |
| 1 | Vignoble d’Alsace | Villages, vignes et ondulations ; extraits courts et étapes 2/5–3/5 | Sources touristiques repérées ; GPX et coupes à vérifier |
| 2 | Canal de Nantes à Brest | Pontivy, Rohan, Josselin et écluses ; balades douces | GPX d’étapes publiés ; géométrie et relief à traiter |
| 3 | Route des Grandes Alpes | Roselend, Izoard et regroupement avec les cols existants | Traces officielles repérées ; préserver tous les IDs précédents |
| 4 | Ardèche | Balazuc, villages, gorges et reliefs variés | Parcours touristiques repérés ; sélection exacte à établir |

Chaque pack devra proposer les mêmes informations locales : paysages, lieux réellement traversés ou proches clairement distingués, sources, distance, relief et limites. Difficultés fixées après analyse, pas avant. Les objectifs nouveaux doivent avoir une liste et un seuil stables ; les ajouts ne doivent pas déplacer un ancien trophée.

## Puis : carnet personnel

Composer un voyage à partir du catalogue et des GPX personnels, choisir l’ordre et suivre ses réalisations. Sauvegarde locale et export/import nécessaires. Les objectifs personnels ne doivent pas devenir une source illimitée d’XP par duplication de traces ou création répétée de carnets. Prévoir l’effet d’une suppression de GPX et la persistance des séances historiques.

## Validation matérielle à l’arrivée du vélo

Suivre le [protocole TEB5](TEB5-BLUETOOTH-VALIDATION.md) : données réellement transmises, précision et évolution des compteurs, éventuel contrôle de résistance, pauses et reprises. Les tests avec un simulateur ne valident pas le matériel physique. Installation réelle et veille sur iPhone/Safari restent aussi à vérifier.

## Contrôles avant chaque publication

Sur le commit exact proposé : `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build`, parcours utilisateur sur mobile et ordinateur. Aucun contrôle obligatoire en échec. Vérifier ensuite le SHA effectivement publié par Vercel et `/api/version`, puis actualiser README, guides et état de reprise.

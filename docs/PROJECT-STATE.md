# État de reprise VéloQuest — 4 octobre 2026

## Références

- Dépôt : https://github.com/AstrowareConception/Programme-velo ; référence `main`.
- Production : https://programme-velo.vercel.app/ ; projet Vercel `programme-velo`.
- Matériel : TOPUTURE TEB5, consignes sur 1–32 niveaux, mode manuel conservé.

## Campagnes intégrées

La PR 19 a été corrigée au commit `45d1ba1720aa6284071581b395a0af3f4cba2fb2` : coches par route réellement achevée, quatre badges, bonus unique, exclusions des tentatives incomplètes et des secteurs, compatibilité des anciens historiques. Les quatre contrôles ont réussi dans la CI 37186992622 sur ce commit exact. Fusion dans `main` : `d882c5abc7198280e6bdfe4c2843883f3bbc6a62`.

Les cinq étapes accessibles à 2/5–3/5 étaient déjà présentes et ont été conservées.

## Lot de réconciliation des opérations quotidiennes

La PR 7 (`8aac612eebc4edcff038a0395250cb46fada4438`) était conflictuelle. Ses fonctions utiles ont été adaptées au lecteur actuel dans la PR 20 : date/heure locale de séance, mesures datées, suppressions, télémétrie enrichie et guides. Les courses, défis et reprise de séance sont conservés. La PR 20, au commit `e87c2ce6e63f5de0558f2d359bbc356f3a8e755b`, a été validée par la CI 37187520845 et fusionnée dans `main` au commit `5be593c9fb3fe54021c7de68f42a573218ad9539`. Les quatre contrôles ont été rejoués avec succès sur ce main final : 65 tests unitaires, 42 tests navigateur, typecheck et build. La production a été vérifiée par Vercel et `/api/version`. La PR 7 est fermée comme remplacée.

Corrections complémentaires : semaines calendaires à travers le changement d'heure, remise à zéro du mode de course lors de la saisie libre, exclusion des courses/secteurs incomplets des records, énergie de séance relative au compteur FTMS, lecture prudente des paquets tronqués, version de build dans Plus et `/api/version`, dépendances verrouillées et vérification du SHA de production après CI.

## Lot balades et découverte

La branche `feat/gentle-rides`, fondée sur `5be593c`, ajoute sept balades à 1/5, portant le catalogue à 21 parcours. Les traces officielles sont documentées dans `docs/SCENIC-ROUTES.md`, avec altitudes GPX ou IGN, profils lissés à 500 m et provenance SHA-256. Le D+ est calculé sur le profil représenté, sans prétendre égaler une fiche touristique ou un relevé indépendant.

Ajouts : filtre et raccourci Balades, préparation compacte sur mobile, paysages dans les fiches et le lecteur, carnets Au fil de l’eau / Échappées patrimoine (450 / 300 XP uniques), trois trophées de diversité et collection La France en douceur. Les balades sont faciles, RPE 2–4, niveaux de base 4–10, avec pauses libres ; leur longueur reste réelle dans la simulation, notamment environ 140 minutes pour le Der.

Trois séances guidées de 25, 30 et 40 minutes et un bonus de 12 minutes complètent le catalogue. Le bonus partage le plafond existant de 60 XP par semaine. Les badges historiques de parcours conservent leurs identifiants et validations, avec libellés de relief ; les balades ne les alimentent pas. Le palmarès parle de parcours distincts plutôt que de sommets.

Le lecteur positionne correctement la fin du dernier segment lorsqu’une reprise de minuterie saute plusieurs segments. Une couverture navigateur vérifie une arrivée complète après une grande avance du temps, la persistance, les carnets, la suppression et la reprise incomplète. Le cache PWA passe à v5 et l’indicateur Next.js de développement, qui masquait la navigation mobile en tests, est désactivé.

Le présent fichier décrit le lot à valider sur son commit exact. Le document d’état externe doit consigner son SHA, sa PR, les résultats finaux et la version publique réellement constatée après intégration.

## Règles de données

Clés inchangées : `veloquest:v1`, `veloquest:custom-routes:v1`, `veloquest:active-session:v1`. Backups v3, v2 et anciens états conservés. Le nouvel indicateur optionnel `completedSegment` identifie les tentatives de secteur incomplètes ; son absence dans un ancien historique reste compatible.

Une suppression recalcule les indicateurs depuis les séances restantes. Les XP des autres séances restent ceux enregistrés. Les anciennes séances de parcours sans indicateur d'achèvement restent considérées comme complètes ; les secteurs sont toujours exclus des campagnes.

## Validation requise et prochaine étape

Avant fusion : `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build` sur le commit exact de la PR, puis contrôle visuel mobile/ordinateur. Vérifier ensuite la CI de `main`, le déploiement Vercel, `/api/version` et l'URL publique.

Aucun essai TEB5 physique ni validation Safari/iPhone physique n'est réalisé par les tests Chromium. Prochaine étape matérielle : suivre `docs/TEB5-BLUETOOTH-VALIDATION.md` et conserver un relevé de la télémétrie et du contrôle effectifs.

Le document d'état externe livré après déploiement complète ce point avec les commits finaux, PR et résultats réellement observés, sans anticiper la publication.

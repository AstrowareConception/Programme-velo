# État de reprise VéloQuest — 4 octobre 2026

## Références

- Dépôt : https://github.com/AstrowareConception/Programme-velo ; référence `main`.
- Production : https://programme-velo.vercel.app/ ; projet Vercel `programme-velo`.
- Matériel : TOPUTURE TEB5, consignes sur 1–32 niveaux, mode manuel conservé.

## Campagnes intégrées

La PR 19 a été corrigée au commit `45d1ba1720aa6284071581b395a0af3f4cba2fb2` : coches par route réellement achevée, quatre badges, bonus unique, exclusions des tentatives incomplètes et des secteurs, compatibilité des anciens historiques. Les quatre contrôles ont réussi dans la CI 37186992622 sur ce commit exact. Fusion dans `main` : `d882c5abc7198280e6bdfe4c2843883f3bbc6a62`.

Les cinq étapes accessibles à 2/5–3/5 étaient déjà présentes et ont été conservées.

## Lot de réconciliation des opérations quotidiennes

La PR 7 (`8aac612eebc4edcff038a0395250cb46fada4438`) était conflictuelle. Ses fonctions utiles ont été adaptées au lecteur actuel : date/heure locale de séance, mesures datées, suppressions, télémétrie enrichie et guides. Les courses, défis et reprise de séance sont conservés. Le lot est proposé depuis le `main` courant ; consulter la PR et les résultats actuels avant de le considérer comme publié.

Corrections complémentaires : semaines calendaires à travers le changement d'heure, remise à zéro du mode de course lors de la saisie libre, exclusion des courses/secteurs incomplets des records, énergie de séance relative au compteur FTMS, lecture prudente des paquets tronqués, version de build dans Plus et `/api/version`, dépendances verrouillées et vérification du SHA de production après CI.

## Règles de données

Clés inchangées : `veloquest:v1`, `veloquest:custom-routes:v1`, `veloquest:active-session:v1`. Backups v3, v2 et anciens états conservés. Le nouvel indicateur optionnel `completedSegment` identifie les tentatives de secteur incomplètes ; son absence dans un ancien historique reste compatible.

Une suppression recalcule les indicateurs depuis les séances restantes. Les XP des autres séances restent ceux enregistrés. Les anciennes séances de parcours sans indicateur d'achèvement restent considérées comme complètes ; les secteurs sont toujours exclus des campagnes.

## Validation requise et prochaine étape

Avant fusion : `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build` sur le commit exact de la PR, puis contrôle visuel mobile/ordinateur. Vérifier ensuite la CI de `main`, le déploiement Vercel, `/api/version` et l'URL publique.

Aucun essai TEB5 physique ni validation Safari/iPhone physique n'est réalisé par les tests Chromium. Prochaine étape matérielle : suivre `docs/TEB5-BLUETOOTH-VALIDATION.md` et conserver un relevé de la télémétrie et du contrôle effectifs.

Le document d'état externe livré après déploiement complète ce point avec les commits finaux, PR et résultats réellement observés, sans anticiper la publication.

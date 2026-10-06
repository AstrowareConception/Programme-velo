# Programme personnel et carnets — 6 octobre 2026

## Où retrouver les nouveautés

- **Quête → Ma semaine adaptée** : choisir ses jours, son créneau, son objectif et son énergie, proposer puis confirmer une semaine. Les objectifs affichés reprennent exactement la durée et les points des séances proposées. Déplacer ou raccourcir ouvre une proposition à confirmer.
- **Suivi → Mon bilan** : temps à vélo, séances, ressenti, précision pondérée par le temps mesuré ; comparaison des moyennes quotidiennes de poids des deux dernières semaines. Deux jours de mesures par fenêtre sont nécessaires. Les habitudes du jour (marche, renforcement, repas, récupération) sont facultatives et séparées des points vélo.
- **Plus → Ton cockpit → Mes repères de cadence** : décalage fin de −25 à +10 tr/min. Trois séances faciles complètes avec cadence mesurée et RPE ≤4 permettent une proposition fondée sur la médiane de leurs cadences moyennes sur 28 jours. C’est un repère incluant l’échauffement, pas une mesure de seuil physiologique. Appliquer reste volontaire.
- **Séances** : dix nouveaux exercices, trois programmes et trois défis de maîtrise. Les anciens scores restent liés à leurs réglages. Les récompenses des programmes sont uniques et recalculées après suppression.
- **Parcours → Mes carnets de voyage** : composer jusqu’à 20 carnets de 20 étapes uniques, réordonner avant enregistrement, combiner catalogue et GPX, reprendre la prochaine étape via Voyage. Supprimer le carnet conserve les séances. Un GPX manquant reste signalé ; il n’est pas validé automatiquement.
- **Journal → détail** : commentaire du coach, écart avec le RPE indicatif de la séance, précédent ressenti uniquement pour une séance complète de même identifiant et mêmes réglages de cadence/résistance.

## Règles du programme

Proposition explicite pour une semaine à la fois, sans modification silencieuse des objectifs existants. Semaines 1–2 faciles ; ensuite variété facile/modérée. Semaines 4, 8, 12 allégées ; allègement aussi après interruption de dix jours, deux retours récents nettement au-dessus du RPE visé ou un effort déclaré très élevé. Aucun rattrapage automatique, aucune augmentation automatique du volume et aucune séance maximale prescrite. La durée est bornée par la disponibilité (10–60 min), avec réduction de cinq minutes pour une semaine douce. Les séances sous dix minutes restent des compléments au catalogue.

Le planning reflète les jours disponibles dans chaque semaine ancrée sur la date de début du programme. Une coche signifie une séance complète du modèle prévu, enregistrée au jour prévu. Les séances libres ou déplacées sans changer le planning restent dans le bilan. Les autres semaines ne sont pas recalculées à la confirmation. La semaine 12 clôt ce premier cycle ; un renouvellement complet de cycle reste à concevoir.

Le coach express tient compte des écarts de ressenti et des interruptions. Les points manquants ne poussent plus sa sélection vers une charge supérieure. Les RPE de référence sont des consignes pondérées par la durée, pas des mesures physiologiques. Le mode perte de poids est centré sur l’adhésion et le suivi, sans estimation de kilogrammes à partir des calories.

## Nouvelles séances et programmes

Dix séances : Reprendre doucement (10), Retrouver ses repères (20), Le métronome (15), La ligne tranquille (25), Garder une réserve (20), Finir avec aisance (30), Petites bosses, rythme stable (18), Un peu plus longtemps (35), Six minutes de précision (6), Huit minutes ondulées (8).

Trois programmes : Retour en selle (+100 XP uniques), L’art de la régularité (+100), Gérer sa réserve (+160). Catalogue désormais à six programmes et 77 badges. Les deux nouveaux express rapportent 0,5 point chacun.

Défis de maîtrise sans XP additionnel : trois séances distinctes à ≥90 % ; combo ≥60 s ; seconde moitié au moins aussi précise que la première sur les deux exercices de gestion (première moitié ≥80 %, couverture de chaque plateau ≥80 %). Séance complète, réglages constants, score non provisoire requis. Aucun classement physiologique.

## Données et transfert

Les nouveaux champs optionnels `program`, `programPlans`, `habits`, `journeys` sont normalisés à l’import et inclus dans le JSON v3. Les sauvegardes anciennes restent lisibles. Les historiques ne sont pas recalculés aux nouveaux tarifs. Les références de GPX manquants sont conservées. La copie et le partage JSON demeurent le moyen de transfert entre appareils ; aucune synchronisation distante ni compte utilisateur n’est activé.

## Repères et limites

- NIDDK, activité physique et alimentation durable : https://www.niddk.nih.gov/health-information/weight-management/adult-overweight-obesity/eating-physical-activity
- OMS, repères d’activité globale : https://www.who.int/europe/news-room/fact-sheets/item/physical-activity

Les repères de population ne deviennent pas une obligation immédiate de durée à vélo. Aucune promesse de perte de poids ni diagnostic. Les calories, la puissance et les poignées cardiaques du vélo ne sont pas étalonnées par ces changements. La connexion Bluefy/Toputure et l’effet physique de la résistance ont été confirmés par l’utilisateur avant ce lot ; la reconnaissance vocale Bluefy reste à éprouver sur son appareil.

## Suites distinctes

Synchronisation distante : nécessite choix et configuration d’une authentification et d’un stockage, puis gestion des conflits, suppressions et restauration. Pas de service configuré dans ce dépôt. Packs Grandes Alpes et Ardèche, extension photographique sous licences compatibles, validation professionnelle des progressions et nouveau cycle après semaine 12 restent à développer. Ils ne sont pas annoncés comme livrés.

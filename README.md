# Programme vélo

PWA personnelle de suivi d'entraînement sur vélo d'appartement, pensée pour le TOPUTURE TEB5 (32 niveaux de résistance).

## Objectif

L'application transforme un programme rigide en un **catalogue de séances à la carte** :

- choisir selon le temps disponible et l'énergie du jour ;
- suivre une séance segment par segment avec le niveau de résistance conseillé ;
- accumuler une charge hebdomadaire en points plutôt que respecter des jours imposés ;
- suivre le poids et les tours de taille ;
- visualiser l'historique et la progression ;
- fonctionner hors-ligne une fois installée ;
- conserver les données localement, sans compte ni serveur.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- CSS natif
- PWA / service worker
- localStorage
- Vercel

## Démarrage

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000.

## Vérification

```bash
npm run typecheck
npm run build
```

## Déploiement Vercel

Importer directement ce dépôt dans Vercel. Aucun secret ni variable d'environnement n'est nécessaire.

## Données

Les séances, mesures et préférences sont enregistrées uniquement dans le navigateur sous la clé `programme-velo:v1`.

L'écran **Données** permet d'exporter une sauvegarde JSON et de la réimporter sur un autre appareil.

## Programme

Le programme comporte 12 semaines avec une charge progressive et des semaines d'allègement. L'utilisateur reste libre de l'ordre des séances ; l'application suit surtout :

- les minutes effectuées ;
- les points de charge ;
- le nombre de séances intenses ;
- la récupération entre deux séances difficiles.

Les niveaux de résistance sont des repères de départ pour le TEB5 : le ressenti (RPE) reste prioritaire.

## Licence

Projet personnel.

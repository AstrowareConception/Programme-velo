# VeloQuest

**Ride · Level up · Repeat.**

VeloQuest est une PWA de suivi d'entraînement sur vélo d'appartement, conçue à l'origine autour du TOPUTURE TEB5 et de ses 32 niveaux de résistance, mais utilisable avec n'importe quel vélo à résistance réglable.

## Philosophie

Pas de calendrier rigide. VeloQuest propose un **catalogue de quêtes** à choisir selon le temps disponible, l'énergie du jour et la charge déjà accumulée :

- séances faciles de décrassage ;
- endurance normale et longue ;
- montée progressive ;
- HIIT court et 4×4 ;
- travail au seuil ;
- côtes ;
- escalier ;
- micro-séances bonus de 10, 15 ou 20 minutes ;
- séance libre pour enregistrer un entraînement improvisé ;
- Cols de légende avec profil altimétrique et carte interactive.

Le programme dure 12 semaines et suit des objectifs de points, minutes, variété et nombre de séances. Les séances intenses sont volontairement plafonnées : une **semaine parfaite** récompense la régularité et la diversité, pas le surentraînement.

Les challenges de cols utilisent des données globales réelles pour la distance, le dénivelé et les pentes. Les profils intermédiaires embarqués dans la V1 sont des profils d’entraînement simplifiés ; l’import GPX permettra ensuite d’obtenir une reproduction kilométrique plus fidèle.

## Gamification

- XP et niveaux ;
- semaine parfaite : +250 XP ;
- série de semaines parfaites ;
- badges de variété et de régularité ;
- badges de perte de poids et de tour de taille ;
- micro-séances bonus avec XP hebdomadaire plafonné ;
- recommandations selon la charge récente ;
- badges pour les ascensions, kilomètres et séances connectées ;
- badge d’icône PWA lié aux séances restant à accomplir.

## PWA / vie privée

- Next.js 16 + React 19 + TypeScript ;
- PWA installable ;
- service worker et fonctionnement offline après première visite ;
- aucune API, aucun compte, aucun backend ;
- données conservées dans `localStorage` sous la clé `veloquest:v1` ;
- export/import JSON depuis l'application ;
- télémétrie FTMS enregistrée et échantillonnée lorsqu’elle est disponible ;
- saisie manuelle enrichie en solution de repli.

### Bluetooth

VeloQuest utilise Web Bluetooth + FTMS lorsque le navigateur le permet. Chrome/Edge desktop et Chrome Android peuvent exploiter ce mode. Les navigateurs iOS actuels n’exposent pas Web Bluetooth aux PWA ; sur iPhone, le mode guidé et la saisie manuelle restent disponibles. Une enveloppe native CoreBluetooth/Capacitor pourra être ajoutée ultérieurement sans modifier le modèle de données.

## Développement

```bash
npm install
npm run dev
```

Vérification :

```bash
npm run typecheck
npm run build
```

## Déploiement Vercel

Importer le dépôt dans Vercel. Le preset Next.js est détecté automatiquement et aucune variable d'environnement n'est nécessaire.

## Sécurité d'entraînement

Les niveaux de résistance sont des repères de départ. Le ressenti (RPE), la cadence et l'absence de douleur restent prioritaires. Une micro-séance bonus doit rester facile et ne remplace jamais une séance structurée.

## Licence

Projet personnel / expérimental.

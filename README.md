# VeloQuest

**Ride · Level up · Repeat.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAstrowareConception%2FProgramme-velo&project-name=veloquest&repository-name=Programme-velo)

VeloQuest est une PWA de cyclisme indoor **local-first**, initialement conçue autour du TOPUTURE TEB5 (32 niveaux), mais utilisable manuellement avec n’importe quel vélo d’appartement.

L’objectif n’est pas d’imposer un calendrier rigide : VeloQuest transforme un programme de 12 semaines en un ensemble de **quêtes choisies selon le temps disponible, l’énergie du jour et la charge déjà réalisée**.

## Fonctionnalités

### Coach & séances guidées

- Coach Express selon le temps disponible et l’énergie du jour ;
- programme progressif sur 12 semaines ;
- décrassage, endurance, longue, progressif, HIIT, 4×4, seuil, côtes, escalier et séance libre ;
- micro-séances bonus 10 / 15 / 20 minutes avec XP plafonné ;
- pré-vol détaillé avant la séance ;
- chrono robuste aux pauses et suspensions mobiles ;
- précédent / pause / suivant ;
- prochain segment annoncé ;
- objectifs RPE, cadence et résistance ;
- maintien de l’écran éveillé si l’appareil le permet ;
- bips, annonces vocales et retour haptique configurables.

### Bluetooth FTMS

Sur navigateur compatible Web Bluetooth :

- Indoor Bike Data ;
- vitesse instantanée et moyenne ;
- cadence instantanée et moyenne ;
- distance ;
- niveau de résistance ;
- watts instantanés et moyens ;
- fréquence cardiaque si diffusée ;
- énergie / calories ;
- MET ;
- temps FTMS ;
- détection de la plage de résistance ;
- diagnostic du Fitness Machine Control Point ;
- demande de contrôle FTMS avec acquittement ;
- test manuel de résistance ;
- auto-résistance **opt-in**, uniquement après contrôle accordé.

Le pilotage automatique doit être validé sur le vélo réel avant utilisation régulière. Voir [le protocole TEB5](docs/TEB5-BLUETOOTH-VALIDATION.md).

> iPhone / iPad : les PWA iOS n’exposent actuellement pas Web Bluetooth. Le mode guidé, la saisie manuelle et tout le suivi restent utilisables. Une enveloppe native CoreBluetooth/Capacitor pourra être ajoutée ultérieurement.

### Parcours & GPX

- Alpe d’Huez, Mont Ventoux et Tourmalet fournis comme challenges ;
- carte OpenStreetMap interactive ;
- profil altimétrique ;
- position du cycliste ;
- import de fichiers GPX ;
- calcul distance, D+, pente lissée et profil ;
- transformation des pentes en niveaux de résistance ;
- progression par distance réelle si FTMS la fournit ;
- calibration globale de résistance TEB5 de **-4 à +4**.

### Suivi & données

- poids ;
- tour de taille ;
- tour abdominal ;
- objectifs ;
- courbes de progression ;
- journal détaillé des séances ;
- saisie rétroactive avec date/heure locale ;
- saisie manuelle enrichie lorsque le Bluetooth n’est pas disponible ;
- suppression d’une saisie erronée ;
- export CSV ;
- sauvegardes JSON versionnées et migrables ;
- estimation de l’empreinte locale ;
- récupération d’un état local corrompu ;
- aucune base de données distante.

### Gamification

- XP et niveaux nommés ;
- progression vers le prochain niveau ;
- semaine parfaite ;
- séries de semaines parfaites ;
- missions hebdomadaires ;
- badges de régularité, variété, volume, distance, FTMS, cols et objectifs physiques ;
- bonus limités pour ne pas encourager le surentraînement ;
- badge d’icône PWA quand l’API est disponible.

## Documentation

- [Guide utilisateur](docs/USER-GUIDE.md)
- [Validation Bluetooth du TOPUTURE TEB5](docs/TEB5-BLUETOOTH-VALIDATION.md)
- [Notice de confidentialité](app/confidentialite/page.tsx)

## PWA & vie privée

VeloQuest est volontairement **local-first** :

- aucun compte ;
- aucun backend métier ;
- profil et historique dans `localStorage` ;
- les GPX restent sur l’appareil ;
- les données FTMS sont traitées localement ;
- export explicite uniquement à la demande.

Les tuiles cartographiques OpenStreetMap et l’hébergement Vercel impliquent naturellement des requêtes réseau ordinaires.

## Stack

- Next.js 16 / App Router
- React 19
- TypeScript
- Leaflet / OpenStreetMap
- Web Bluetooth / FTMS
- PWA / Service Worker
- localStorage
- Vitest
- GitHub Actions
- Vercel

## Développement

```bash
npm install
npm run dev
```

Vérification complète :

```bash
npm run typecheck
npm test
npm run build
```

La CI exécute ces trois étapes sur chaque PR.

## Déploiement Vercel

Le dépôt contient `vercel.json` et un workflow `.github/workflows/deploy-vercel.yml`.

Deux possibilités :

1. importer le dépôt via le bouton **Deploy with Vercel** ;
2. ajouter le secret GitHub Actions `VERCEL_TOKEN`, puis laisser le workflow créer/lier `veloquest`, déployer en production et vérifier l’URL.

Aucune variable d’environnement applicative n’est requise.

## Avant la première séance connectée

1. utiliser VeloQuest manuellement ;
2. vérifier le sens des niveaux de résistance ;
3. connecter le TEB5 depuis un navigateur Web Bluetooth compatible ;
4. comparer les métriques avec l’écran physique ;
5. exécuter le laboratoire FTMS ;
6. tester quelques niveaux de résistance ;
7. seulement ensuite activer l’auto-résistance.

## Sécurité d’entraînement

Les niveaux proposés sont des repères de départ. Le **ressenti (RPE)**, la cadence, la récupération et l’absence de douleur restent prioritaires. La gamification ne doit jamais devenir une raison de multiplier les séances intenses.

## Statut

VeloQuest est fonctionnel en mode local/PWA. Le Bluetooth FTMS est implémenté avec diagnostic et contrôle, mais le comportement exact du TOPUTURE TEB5 doit encore être validé sur l’exemplaire physique.

## Licence

Projet personnel / expérimental.

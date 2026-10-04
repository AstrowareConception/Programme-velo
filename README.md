# VéloQuest

**Ride · Level up · Repeat.**

Application : [programme-velo.vercel.app](https://programme-velo.vercel.app/) · Dépôt : [AstrowareConception/Programme-velo](https://github.com/AstrowareConception/Programme-velo)

VéloQuest est une PWA personnelle Next.js / React / TypeScript. Elle associe un programme souple de douze semaines, des séances guidées, des parcours variés et un suivi local. Le matériel de référence est le **TOPUTURE TEB5, 32 niveaux de résistance**. Le mode manuel permet de suivre les consignes et de saisir les valeurs du vélo sans connexion Bluetooth.

## Fonctions disponibles

- Programme de douze semaines : objectifs de minutes, points, séances et variété, avec un plafond de séances difficiles.
- Catalogue libre, micro-séances de 10/15/20 minutes, séance libre et saisie rétroactive.
- Coach adaptatif local : temps disponible, énergie, historique, charge récente et RPE.
- Préparation, lecteur guidé, pause, alertes sonores/vocales/haptiques, calibration et maintien de l'écran lorsque disponible.
- Reprise locale d'une séance interrompue, y compris Time Attack, Segment Attack et défi actif.
- **14 parcours natifs**, dont Velleron, Vaison, Uchaux, Enclave des Papes et Corniches à **2/5–3/5** : bosses, descentes, faux-plats et récupérations, en complément des grands cols à 4/5–5/5.
- Recherche, filtres, tri, favoris et import GPX avec persistance des parcours personnels.
- Time Attack, records de parcours, fantôme et temps intermédiaires ; Segment Attack sur quatre secteurs, avec records séparés.
- Huit défis de parcours ; quatre campagnes : Découverte Provence (+500 XP), Tour Vallonné (+600), Légendes du Tour (+1 000), Défi des Alpes (+1 400).
- XP, niveaux, badges, collections, palmarès et analyses de performance.
- Journal, dates/heures locales, mesures datées de poids/taille/abdomen et suppression des saisies erronées.
- Export/import JSON (v3, compatible v2 et ancien état simple), exports CSV et estimation du stockage local.
- Lecture FTMS : vitesse, cadence, distance, résistance, puissance, fréquence cardiaque, moyennes, énergie, MET et temps **si le vélo les transmet**. Contrôle de résistance facultatif avec acquittement.

## Campagnes et historique

Les coches reflètent les parcours réellement terminés, même réalisés dans le désordre. « Continuer » propose la première étape encore manquante. Une séance complète peut compter pour plusieurs campagnes qui contiennent le même parcours.

Chaque campagne achevée débloque un badge et un **bonus unique calculé à partir de l'historique**. Répéter une étape ne multiplie pas ce bonus ; la séance conserve son XP habituel. Une tentative explicitement incomplète ou un Segment Attack ne valide jamais un parcours entier. Pour préserver les sauvegardes antérieures, les anciennes séances de parcours sans indicateur d'achèvement restent considérées comme terminées.

La suppression recalcule les semaines, niveaux, campagnes, badges, collections, statistiques et records depuis les séances restantes. Si la dernière réalisation d'une étape est supprimée, le bonus et le badge de cette campagne disparaissent ; une autre réalisation complète conserve l'étape. Les XP déjà attribués aux autres séances restent leurs valeurs enregistrées : les anciennes récompenses de record/défi ne sont pas réécrites rétroactivement.

## Géographie, simulation et mesures

| Source | Ce qu'elle représente | Limites |
| --- | --- | --- |
| Parcours natif | Profil géographique simplifié et coordonnées de référence | Ni trace GPS relevée ni itinéraire routier de navigation |
| GPX importé | Distance et altitude calculées depuis les points du fichier ; pente lissée sur environ 250 m | Dépend de la qualité GPS et altimétrique ; le D+ reste calculé |
| Simulation | Progression estimée à partir du temps des segments, résistance suggérée sur 1–32 | Aucun kilomètre extérieur mesuré ; chrono distinct d'une validation physique |
| FTMS | Données transmises par le compteur du vélo ; progression relative à la distance au départ | La précision et les capacités dépendent du firmware et de l'exemplaire |
| Saisie manuelle | Valeurs déclarées par l'utilisateur, généralement lues sur l'écran du vélo | VéloQuest ne les vérifie pas indépendamment |

Les calories de séance préremplies depuis FTMS sont la variation du compteur d'énergie sur les échantillons conservés, avec gestion des remises à zéro. « KCAL VÉLO » affiche le compteur du vélo. Une saisie manuelle permet de corriger la valeur de séance. Les watts et calories affichés par le matériel peuvent eux-mêmes être estimés.

Les tests FTMS simulés vérifient le protocole logiciel et l'interface. **Ils ne prouvent pas le fonctionnement du TEB5 physique**, notamment le changement effectif de résistance. Voir le [protocole matériel](docs/TEB5-BLUETOOTH-VALIDATION.md). Sur un appareil sans Web Bluetooth, le mode manuel reste disponible ; aucune enveloppe native iOS n'est livrée.

## Données et PWA

Aucun compte ni backend métier : profil, historique, mesures, préférences et favoris utilisent `veloquest:v1`, les parcours personnels `veloquest:custom-routes:v1` et la reprise `veloquest:active-session:v1`. Les sauvegardes JSON comprennent l'état et les GPX ; la reprise active reste propre à l'appareil et n'est pas transférée par ce fichier.

Les semaines suivent le calendrier local, y compris lors d'un changement d'heure. Les séances sont sauvegardées comme instants UTC et affichées dans le fuseau courant de l'appareil. Une mesure datée est enregistrée à midi local pour préserver le jour au moment de la saisie.

La PWA met en cache l'interface après chargement. Les cartes distantes demandent du réseau ; les capacités hors connexion dépendent de ce qui a déjà été chargé. Faire un export avant de changer de téléphone ou d'effacer les données du navigateur. Les cartes OpenStreetMap et l'hébergement Vercel impliquent des requêtes réseau ordinaires. [Confidentialité](https://programme-velo.vercel.app/confidentialite).

## Développement et validation

Node 22 en CI (Node 24 utilisé par Vercel). Les dépendances sont verrouillées par `package-lock.json`.

```bash
npm ci
npm run dev
```

Avant toute production, sur le commit proposé :

```bash
npm run typecheck
npm test
npx playwright install --with-deps chromium
npm run test:e2e
npm run build
```

La CI exécute les quatre contrôles sur les PR et sur `main`. Playwright couvre Chromium mobile (390 × 844) et ordinateur (1 280 × 900), avec persistance/rechargement, campagnes, saisie/suppression, records, reprise et FTMS simulé. Ces profils ne sont pas un test sur iPhone physique ou Safari.

`CHROMIUM_PATH` permet d'utiliser un Chromium local déjà installé. `E2E_BASE_URL` cible un serveur existant sans démarrer le serveur de développement ; les scénarios écrivent uniquement dans le stockage isolé du navigateur de test.

## Déploiement et version

Le projet Vercel **programme-velo** est relié au dépôt : les branches créent des previews et `main` alimente l'URL publique. Fusionner seulement après réussite des contrôles sur le commit exact de la PR. Le workflow de vérification attend ensuite que `/api/version` expose le commit de `main` ayant réussi la CI ; il ne crée pas un second projet Vercel.

La version est visible dans **Plus** et dans [l'endpoint de version](https://programme-velo.vercel.app/api/version), sans cache. Comparer ce SHA avec `main` et les métadonnées du déploiement Vercel ; une CI verte seule ne prouve pas la publication. Recharger l'application en ligne après une mise à jour, puis vérifier la conservation de l'historique.

## Guides

- [Guide utilisateur](docs/USER-GUIDE.md)
- [Validation Bluetooth du TEB5](docs/TEB5-BLUETOOTH-VALIDATION.md)
- [État technique de reprise](docs/PROJECT-STATE.md)

Les niveaux proposés sont des repères : le ressenti, la récupération et les limites d'intensité du programme restent prioritaires. Projet personnel / expérimental.

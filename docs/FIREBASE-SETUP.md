# Activer le cloud Firebase de VéloQuest

Le code est prêt pour Firebase Authentication (e-mail/mot de passe) et Cloud Firestore. VéloQuest reste hébergé sur Vercel. Aucun serveur, compte de service, clé privée, Cloud Function ni bucket Storage n’est nécessaire.

## 1. Créer le projet Firebase

1. Ouvre [la console Firebase](https://console.firebase.google.com/) avec ton compte Google.
2. Crée un projet, par exemple **VéloQuest**, et conserve son **Project ID** exact. Google Analytics est facultatif et n’est pas utilisé par cette intégration.
3. Commence avec l’offre gratuite Spark. Aucun compte de facturation n’est requis pour cette intégration de base. Les quotas restent à surveiller ; une limite atteinte suspend l’envoi, pas l’accès aux données locales.
4. Dans les paramètres du projet, ajoute une application **Web** (`</>`), nommée VéloQuest. N’active pas Firebase Hosting : le site reste sur Vercel.
5. Garde le bloc `firebaseConfig` affiché. Ces identifiants Web sont publics ; **ce ne sont pas des clés d’administration**.

## 2. Activer les comptes

1. Dans **Authentication → Get started / Commencer → Sign-in method / Fournisseurs**, active **Adresse e-mail / Mot de passe**. La connexion par lien e-mail n’est pas utilisée.
2. Dans les paramètres Authentication, ajoute `programme-velo.vercel.app` aux **domaines autorisés**, puis ton éventuel domaine personnalisé. Ajoute `localhost` seulement pour un développement local volontaire.
3. Dans **Templates / Modèles**, personnalise le nom de l’expéditeur et les messages de vérification/réinitialisation. Les liens doivent conserver les paramètres fournis par Firebase. Les actions e-mail sont traitées par Firebase ; aucune route supplémentaire n’est nécessaire dans VéloQuest.
4. L’application exige une adresse vérifiée avant l’accès Firestore. La création de compte envoie un e-mail ; le bouton **J’ai vérifié mon adresse** recharge le statut et le jeton.

## 3. Créer la base Firestore

1. Dans **Firestore Database**, crée une base **Standard**, avec l’identifiant **`(default)`**.
2. Choisis une région européenne adaptée, par exemple Paris si proposée. La localisation de Firestore se choisit avant d’enregistrer des données ; cela ne signifie pas que tous les services Firebase sont limités à cette région.
3. Choisis le **mode production**, jamais des règles publiques temporaires.
4. Dans l’onglet **Rules / Règles**, remplace le contenu par **l’intégralité du fichier [firestore.rules](../firestore.rules)** du dépôt, puis publie.
5. Les règles refusent les accès anonymes, les e-mails non vérifiés et les accès à un autre utilisateur. Les anciennes versions sont immuables pour le client. Ne remplace jamais ces règles par `allow read, write: if true`.

Le fichier [firestore.indexes.json](../firestore.indexes.json) désactive l’indexation du texte des fragments. Pour appliquer à la fois règles et index depuis le dépôt (Node.js 22+) :

```bash
npm ci
npx firebase login
npx firebase deploy --only firestore:rules,firestore:indexes --project TON_PROJECT_ID
```

Cette commande ne déploie aucun site et ne change pas l’hébergement Vercel. Sans CLI, ajoute une exemption d’indexation mono-champ pour le groupe de collections `chunks`, champ `text`, tous les index désactivés, dans la console Firestore. Publie aussi les règles ci-dessus.

## 4. Configurer Vercel

Ouvre **Vercel → projet programme-velo → Settings → Environment Variables**. Ajoute ces quatre valeurs issues de `firebaseConfig` :

| Variable Vercel | Valeur Firebase |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain`, généralement `ton-projet.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` |

Coche **Production**. Pour tester une préversion, utilise de préférence un projet Firebase de test et des valeurs **Preview** séparées, avec son domaine autorisé. Ne colle pas de JSON de compte de service. `storageBucket`, `measurementId` et `messagingSenderId` ne sont pas nécessaires.

**Ne configure pas `NEXT_PUBLIC_FIREBASE_EMULATORS` sur Vercel.** Cette option est uniquement destinée aux tests locaux et elle est ignorée sur un domaine public.

Dans **Deployments**, redéploie le dernier commit de `main`. Ces variables sont intégrées au build : une simple actualisation ne suffit pas après leur modification. Sur la PWA, termine toute séance avant d’appliquer la mise à jour proposée.

## 5. Premier essai téléphone + tablette

1. Sur l’appareil qui contient ton historique, exporte d’abord ton JSON existant et garde-le hors de cet appareil.
2. Ouvre **Plus → Sauvegarde et synchronisation**. Accepte le transfert des données personnelles, puis **Configurer mon compte cloud**.
3. Crée ton compte avec un mot de passe d’au moins 12 caractères. Ouvre l’e-mail reçu et vérifie l’adresse. Reviens dans VéloQuest et clique **J’ai vérifié mon adresse**.
4. Clique **Associer cet appareil — vérifier les données**. Vérifie les nombres de séances, mesures et parcours ; confirme la synchronisation.
5. Attends **Copie confirmée en ligne**. Une connexion réussie au compte ne signifie pas encore que l’historique est sauvegardé.
6. Sur le second appareil, connecte le **même compte**. Examine la première fusion. Les ajouts indépendants sont réunis ; un champ modifié différemment sur les deux appareils demande un choix explicite.
7. Enregistre une séance sur un appareil, puis ouvre l’autre. Au repos, la synchronisation est déclenchée après modification, au retour en ligne, à l’arrivée d’une nouvelle version et périodiquement. Le bouton **Synchroniser maintenant** permet de la demander.
8. Essaie hors connexion, puis reconnecte-toi avec l’application ouverte. Vérifie l’historique sur les deux appareils. Une application fermée ne garantit pas d’envoi en arrière-plan.
9. Dans **Voir les versions sauvegardées**, examine puis restaure une ancienne version. La restauration affecte le suivi synchronisé ; l’état courant est conservé avant remplacement.

## Ce qui est synchronisé

Profil, objectifs, séances enregistrées et leurs métriques/traces conservées, mesures corporelles, programmes/plans, habitudes, carnets, favoris et parcours personnels. Les réglages de son, résistance/cadence, affichage et photos restent locaux, ainsi que la connexion Bluetooth et la séance en cours.

Le stockage actuel et les exports JSON v2/v3 restent compatibles. Aucun point, record ou XP historique n’est recalculé par le cloud. Les identifiants existants servent à réunir les éléments sans doublons.

## Protection et limites explicites

- **Versions** : chaque état publié devient une version immuable. L’interface liste les 30 dernières ; les autres sont conservées aussi. Il n’y a pas encore de purge automatique ni de corbeille par élément : on récupère une suppression en restaurant une version qui la contient.
- **Conflits** : fusion à trois versions (base commune, appareil, cloud), avec identifiants des séances/mesures/parcours. Une suppression distante n’est pas annulée par un ancien appareil inchangé. Une modification opposée à une suppression demande un choix.
- **Concurrence** : le changement du pointeur cloud est transactionnel. Si un autre appareil publie entre lecture et validation, aucune version plus récente n’est écrasée ; il faut relancer la synchronisation.
- **Envoi interrompu** : une file IndexedDB prépare durablement le contenu et son identifiant avant l’envoi. La reprise est idempotente, même si le serveur avait accepté la requête avant une coupure. Les changements locaux intervenus pendant le transfert sont refusionnés, sans annuler une suppression récente.
- **Hors ligne** : le stockage local reste la source des modifications en attente. Le SDK Firestore utilise un cache mémoire, pas une seconde file persistante susceptible de rejouer des écritures sous un autre compte. Effacer le navigateur avant confirmation d’envoi peut encore faire perdre ces modifications.
- **Séance/saisie** : application distante différée pendant une séance, reprise, profil, guide, stockage en erreur ou champ de saisie actif. Une modification survenue durant l’envoi empêche l’application d’un résultat devenu périmé.
- **Onglets** : verrou Web Locks, vérification du stockage courant et refus d’un onglet périmé. Recharge un ancien onglet si l’application le demande. Sans Web Locks, le cloud est bloqué avec un message ; l’export reste disponible.
- **Stockage plein** : un journal local protège l’installation état + parcours + référence cloud. Si l’écriture est interrompue, elle est reprise au rechargement ; ne vide pas le stockage du navigateur pour corriger ce problème. L’écran de récupération propose de copier/partager le JSON du journal si l’écriture ne peut pas reprendre. Libère plutôt de l’espace et conserve cet export.
- **Taille** : limite applicative de 3 Mio par version, fragments séparés avec contrôle SHA-256. Une sauvegarde trop grosse est refusée explicitement, sans tronquer les données. Le quota local peut être atteint avant cette limite.
- **Confidentialité** : accès par compte vérifié, pas de lecture publique. Pas de chiffrement de bout en bout : les administrateurs du projet disposent des droits d’administration. Le consentement est explicite ; aucune connexion Firebase n’est initialisée tant que l’utilisateur n’a pas ouvert le cloud.
- **Coûts** : les versions sont des copies complètes, pas uniquement les différences. Leur stockage croît avec l’historique ; surveille les usages avant une ouverture au public. Pas d’envoi des mesures Bluetooth à chaque seconde. Les sauvegardes administrées/PITR de Firestore ne font pas partie de cette intégration et peuvent demander une facturation.

## Effacement définitif et exploitation

La déconnexion garde les données locales. La réinitialisation locale détache l’appareil du cloud et ne supprime pas les archives. Pour une demande d’effacement définitif, l’administrateur doit identifier l’UID dans Firebase Authentication, supprimer récursivement `users/UID` (sous-collections incluses), puis supprimer le compte Authentication. Le bouton de suppression d’un compte Authentication seul **ne supprime pas Firestore**. Conserve cette procédure dans ton exploitation et vérifie l’identité du demandeur.

Les règles n’autorisent pas de suppression d’archives depuis le navigateur. Cela protège les sauvegardes contre un effacement accidentel propagé. Pour une sauvegarde indépendante du projet Firebase, conserve aussi des exports JSON hors du service, et envisage les sauvegardes administrées avant une diffusion publique à grande échelle.

## Dépannage

| Message / situation | Vérification |
| --- | --- |
| Cloud non activé | Quatre variables Vercel remplies, nouveau build déployé, PWA actualisée |
| Accès refusé | Adresse vérifiée, bouton de rafraîchissement utilisé, règles publiées dans le bon projet et la base `(default)` |
| Connexion refusée | Fournisseur e-mail/mot de passe actif, bonne adresse, mot de passe ou réinitialisation |
| Envoi en attente | Application ouverte, réseau disponible, séance terminée, bon compte et appareil associé |
| Une autre sauvegarde vient d’arriver | Relancer Synchroniser ; la version concurrente est conservée |
| Ancien onglet | Recharger après avoir conservé toute saisie en cours |
| Quota / taille | Exporter le JSON, contrôler les usages Firebase ; ne pas effacer les données locales |

## Vérification développeur, sans compte réel

Installer Node.js 22+, Java 21+ et les navigateurs Playwright, puis :

```bash
npm ci
npx playwright install --with-deps chromium webkit
npm run test:cloud
```

Cette commande démarre les émulateurs Authentication/Firestore sur `127.0.0.1:9099` et `127.0.0.1:8080`, utilise exclusivement `demo-veloquest`, teste les règles et le SDK, construit une application de test sur le port 3015 puis exécute les parcours sur Chromium/WebKit. Aucun projet Google réel, coût ou e-mail réel. Le build de test contient la configuration des émulateurs : refaire `npm run build` sans ces variables pour un usage normal.

Sources officielles : [installation Web](https://firebase.google.com/docs/web/setup), [connexion e-mail](https://firebase.google.com/docs/auth/web/password-auth), [transactions](https://firebase.google.com/docs/firestore/manage-data/transactions), [règles](https://firebase.google.com/docs/firestore/security/get-started), [quotas](https://firebase.google.com/docs/firestore/quotas), [émulateurs et tests](https://firebase.google.com/docs/rules/unit-tests).

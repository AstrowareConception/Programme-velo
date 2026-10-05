# Hors connexion et mises à jour

Dans **Plus → Emporte ta séance**, vérifie la disponibilité sur l’appareil que tu utiliseras. Une première connexion reste nécessaire. Le message **Séances et parcours prêts hors connexion sur cet appareil** signifie que le service worker a vérifié les fichiers du build conservés dans son cache : page principale, scripts, styles, manifeste et icônes. Le catalogue natif et les séances sont inclus ; les GPX déjà importés et les historiques dépendent du stockage local existant.

## Préparer une sortie

1. Ouvre VéloQuest avec une connexion, puis **Plus**. Attends la préparation.
2. Utilise **Vérifier la disponibilité**. En ligne, les fichiers essentiels manquants ou corrompus de la version active sont retéléchargés si cette même version est encore accessible.
3. Pour les galeries, choisis **Préparer les photos · 263 Ko** : les cinq images documentées actuelles sont téléchargées et vérifiées. Le compteur indique les photos effectivement présentes. Les images consultées sont aussi conservées quand leur chargement réussit.
4. Coupe la connexion et recharge pour vérifier ton appareil avant la première utilisation réelle. Retrouve tes séances, parcours, profil, Voyage et reprise locale. Tu peux conserver les photos masquées dans les réglages, même après préparation.

Sans préparation photographique, une image manquante laisse ses textes et crédits avec une action de relance ; reconnecte-toi pour la charger. Les cartes externes, les vidéos et les podcasts ne font pas partie du paquet de VéloQuest. La page Confidentialité et les sites sources ne sont pas annoncés disponibles hors connexion. Une carte peut donc rester sans fond, tandis que les consignes et le profil local continuent à fonctionner.

Le navigateur peut retirer des fichiers ou des données locales en cas de manque d’espace ou selon ses règles. L’indicateur est une vérification à un instant donné, pas une garantie permanente. Le cache de l’application n’est pas une sauvegarde des historiques : conserve un export JSON pour un transfert d’appareil ou une suppression des données. Une connexion affichée par le navigateur n’assure pas que tous les serveurs sont accessibles.

## Appliquer une mise à jour

Une nouvelle version prépare son propre paquet, sans remplacer immédiatement celui du lecteur ouvert. **Plus** affiche **Une mise à jour est prête** et **Mettre à jour maintenant**. Tu peux continuer et revenir plus tard : aucune minuterie ne déclenche un rechargement imposé.

Le lecteur ouvert, même en pause ou sur le résultat à enregistrer, bloque l’activation. Utilise **Mettre la séance de côté** ou enregistre le résultat, puis ferme les formulaires. Si la reprise ne peut pas être écrite, le lecteur reste ouvert et la mise à jour demeure bloquée. Un défaut d’enregistrement du profil ou des GPX protège aussi l’application contre ce rechargement.

Au clic, tous les onglets de cette origine doivent répondre qu’ils sont au repos. Une séance dans un autre onglet bloque également l’activation. Un onglet ancien qui ne connaît pas ce dialogue, une page sans ce dialogue ou un onglet suspendu peuvent ne pas répondre : ferme les autres onglets de VéloQuest puis réessaie. Aucun abandon de séance n’est nécessaire pour une reprise déjà sauvegardée.

Après accord, les pages concernées sont brièvement verrouillées, le nouveau service worker est activé et elles se rechargent. Historiques, GPX, favoris, réglages et reprise restent dans leurs clés locales. Le premier démarrage du service worker ne provoque pas ce rechargement. La fermeture normale de tous les anciens onglets permet aussi au navigateur d’activer la version en attente. Une version de cache précédente est conservée ; les autres anciens caches VéloQuest sont retirés à l’activation, sans toucher aux données locales.

## Construction et validation

`npm run build` construit Next.js puis génère `public/sw.js` depuis `scripts/pwa-worker.js`. Ce fichier est un artefact ignoré par Git, pas une source à modifier. `scripts/build-pwa.mjs` liste les fichiers JS/CSS/polices du build et associe leurs SHA-256, celui de la page principale, le commit et une empreinte du paquet. Chaque installation échoue si une ressource essentielle manque ou appartient à un autre build ; l’ancienne version reste utilisable. Les images facultatives possèdent leurs empreintes documentées.

Les tests navigateur utilisent désormais le serveur de production. Les tests de métier isolent leurs simulations en bloquant les service workers ; `e2e/pwa.spec.ts` les autorise réellement et utilise un proxy HTTP de test pour proposer deux versions de worker et des coupures réseau. Le code testé reste celui généré par le build. Couverture : rechargement hors connexion, photos préparées ou absentes, cache évincé puis réparé, Voyage en pause dans un autre onglet, consentement et reprise, Time Attack sauvegardé, onglet sans réponse, échec d’écriture de reprise. Les contrôles des commits, CI et production sont consignés dans l’état de reprise externe après observation.

Installation et stockage sur iPhone/Android réels, veille, casque et connexion Bluetooth restent à essayer. Les tests Chromium ne qualifient ni Safari/iOS ni le TOPUTURE physique. Le mode manuel 32 niveaux reste indispensable.

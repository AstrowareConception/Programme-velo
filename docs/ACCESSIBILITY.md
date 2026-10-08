# Accessibilité des séances, fenêtres et couverture WebKit

## Périmètre de ce lot

Le parcours de séance (classique ou parcours) conserve un seul écran monté, de la préparation au bilan. Les rotations n’effacent pas les réglages et saisies. Le dialogue porte un nom accessible correspondant à son étape. Le clavier commence au titre, reste dans le dialogue avec Tab/Maj+Tab et revient au déclencheur après fermeture (ou à la navigation courante si le déclencheur a disparu). L’arrière-plan est inerte tant que la séance est ouverte ; son état et son défilement sont restaurés ensuite.

Échap ferme les réglages/détails ouverts. Ailleurs dans la séance, il revient au bouton **Mettre la séance de côté** sans l’activer : une touche accidentelle ne doit pas perdre les saisies du bilan. L’aide du dialogue annonce ce comportement aux lecteurs d’écran. La mise de côté conserve sa vérification existante de sauvegarde de reprise. Les saisies manuelles du bilan restent en mémoire jusqu’à l’enregistrement ; ne pas quitter avant de les enregistrer.

Le focus visible couvre aussi les listes déroulantes, les résumés de détails et les zones de texte. Sur petit écran, les champs du bilan peuvent se superposer verticalement. Avec un texte fortement agrandi en paysage, la présentation passe à un flux défilant lorsque les colonnes seraient trop étroites. L’objectif sans défilement reste valable aux dimensions tablette et taille de texte habituelles ; la lisibilité des textes agrandis est prioritaire.

## Secteurs, défis de parcours, Voyage et journal

Ces quatre fenêtres utilisent un composant commun `AppDialog`, rendu devant la navigation et les notifications. Elles possèdent un nom accessible et `aria-modal`, bloquent le fond et le défilement de la page, placent le focus sur leur titre et gardent Tab/Maj+Tab à l’intérieur. Échap, le bouton de fermeture et un clic sur l’arrière-plan les ferment ; un clic sur leur contenu ne les ferme pas. La durée choisie pour Voyage reste mémorisée.

La fermeture revient au bouton qui a ouvert la fenêtre. Ce bouton reste aussi la destination du retour quand le choix d’un secteur, d’un défi ou d’un Voyage ouvre le lecteur. La fenêtre précédente ne doit pas déplacer le focus du nouveau lecteur. Après suppression d’une séance, sa ligne n’existe plus : le retour se fait à la navigation courante. La confirmation de suppression et les protections de sauvegarde restent actives.

Cette fermeture par Échap concerne ces fenêtres de choix/consultation. Le lecteur conserve la différence décrite plus haut pour protéger la séance et les champs du bilan.

## Profil et première utilisation

Le profil utilise le même dialogue avec fermeture explicite : Échap se place sur **Fermer le profil** et le clic sur l’arrière-plan ne ferme pas le formulaire. Les saisies restent présentes pendant les rotations et un refus d’écriture. La fenêtre ne se ferme qu’après un enregistrement local confirmé ; sinon elle indique l’erreur et propose de réessayer. Les mesures corporelles restent facultatives.

Le guide de démarrage conserve son dialogue natif et la mémorisation de ses choix entre étapes. Le titre reçoit un focus visible ; Tab/Maj+Tab boucle dans les commandes, Échap quitte pour explorer librement en conservant les choix. Champs et actions peuvent se redisposer avec texte agrandi. La recette couvre la boucle clavier, le retour à une étape précédente, les réglages conservés, la transition au lecteur et une première séance complète enregistrée puis relue.

## Tests automatisés

La CI existante utilise le conteneur officiel `mcr.microsoft.com/playwright:v1.63.0-noble`, avec Chromium, WebKit et leurs dépendances préinstallés. La version de cette image doit rester alignée avec `@playwright/test` dans le lockfile. Aucun nouveau workflow ni déploiement supplémentaire. Cette configuration évite de réinstaller les 184 paquets système observés lors de la première exécution (près de douze minutes). Les deux projets Chromium conservent l’ensemble de la couverture. Les projets `mobile-webkit` et `tablet-webkit` exécutent une sélection explicite :

- clavier, texte à 200 % et largeur 320 px ;
- Secteurs, Défis de parcours, Voyage et journal : focus, Échap, transition au lecteur, rotation et retour après suppression ;
- profil : champs conservés après Échap/rotation/refus du stockage, puis réessai et relecture ;
- guide de première utilisation au clavier, jusqu’à la sauvegarde d’une séance ;
- score sans numéro de version et ancien barème toujours exclu des records ;
- préparation/bilan, rotation, sauvegarde et rechargement ;
- refus d’écriture et réessai sans perdre la séance ;
- nouveautés, repères et lexique ;
- diagnostic privé, copie/export et repli hors connexion ;
- transfert de sauvegarde avec presse-papiers et téléchargement indisponibles.

Commandes : `npx playwright install --with-deps chromium webkit`, puis `npm run test:e2e`. Pour la sélection WebKit seulement : `npx playwright test --project=mobile-webkit --project=tablet-webkit`. Les captures et traces d’échec sont conservées dans l’artefact de CI habituel.

Le test à 200 % augmente la taille racine du texte ; il ne simule pas toutes les variantes de zoom et de réglage typographique d’iOS. WebKit Playwright sous Linux n’est pas Safari installé sur iPad : les permissions, les médias, le Bluetooth de Bluefy et certains comportements du système restent à vérifier physiquement. Voir la [documentation Playwright](https://playwright.dev/docs/browsers#webkit).

## Recette physique restante

1. Sur iPad et iPhone, tester Safari puis Bluefy avec un profil de test ; noter version de l’application, du système et du navigateur.
2. Avec un clavier, ouvrir une séance et vérifier la boucle Tab/Maj+Tab, les détails, la mise de côté et la reprise ; ouvrir aussi Secteurs, Défis de parcours, Voyage et le détail du journal, puis vérifier Échap et le retour au déclencheur.
3. Avec VoiceOver, écouter le nom de chaque étape et vérifier que la navigation de fond est absente pendant la séance ; remplir puis enregistrer un bilan.
4. Agrandir le texte/zoom dans les réglages réellement disponibles ; vérifier préparation, pause, commandes, bilan et clavier virtuel en portrait/paysage. Ne pas accepter un bouton tronqué ou inaccessible.
5. Contrôler le rechargement, le transfert de sauvegarde et les refus de permissions sur le navigateur réel ; joindre le diagnostic de support en cas de problème.

Ce lot n’est pas une certification WCAG ou un audit exhaustif : contrastes de toutes les cartes, autres formulaires annexes et essais réels de première utilisation restent au backlog. Le pattern de dialogue s’appuie sur les [recommandations WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), avec la différence d’Échap décrite ci-dessus pour protéger les saisies.

Voir [la roadmap](ROADMAP.md) et [la recette bêta](BETA-TEST.md).

## Correction révélée par la première CI de ce lot

La CI 37749061577 a passé 332 scénarios, dont les 32 WebKit, et relevé deux échecs Chromium mobile : la zone d’affichage s’élargissait à 363 px pour une fenêtre de 320 px, et à 1095 px avec texte agrandi pour une fenêtre de 1024 px. Les traces montraient des clics décalés vers d’autres éléments. L’en-tête et les cartes de séances peuvent désormais revenir à la ligne ; les débordements du fond inerte sont contenus pendant la modale. Les tests de clic restent sans contournement et contrôlent aussi la largeur réelle. Le correctif a ensuite réussi dans la CI 37752400330 avant publication de la PR 60 ; cette section conserve la découverte historique.

# Accessibilité des séances et couverture WebKit

## Périmètre de ce lot

Le parcours de séance (classique ou parcours) conserve un seul écran monté, de la préparation au bilan. Les rotations n’effacent pas les réglages et saisies. Le dialogue porte un nom accessible correspondant à son étape. Le clavier commence au titre, reste dans le dialogue avec Tab/Maj+Tab et revient au déclencheur après fermeture (ou à la navigation courante si le déclencheur a disparu). L’arrière-plan est inerte tant que la séance est ouverte ; son état et son défilement sont restaurés ensuite.

Échap ferme les réglages/détails ouverts. Ailleurs dans la séance, il revient au bouton **Mettre la séance de côté** sans l’activer : une touche accidentelle ne doit pas perdre les saisies du bilan. L’aide du dialogue annonce ce comportement aux lecteurs d’écran. La mise de côté conserve sa vérification existante de sauvegarde de reprise. Les saisies manuelles du bilan restent en mémoire jusqu’à l’enregistrement ; ne pas quitter avant de les enregistrer.

Le focus visible couvre aussi les listes déroulantes, les résumés de détails et les zones de texte. Sur petit écran, les champs du bilan peuvent se superposer verticalement. Avec un texte fortement agrandi en paysage, la présentation passe à un flux défilant lorsque les colonnes seraient trop étroites. L’objectif sans défilement reste valable aux dimensions tablette et taille de texte habituelles ; la lisibilité des textes agrandis est prioritaire.

## Tests automatisés

Une seule CI existante installe Chromium et WebKit, sans nouveau workflow ni déploiement supplémentaire. Les deux projets Chromium conservent l’ensemble de la couverture. Les projets `mobile-webkit` et `tablet-webkit` exécutent une sélection explicite :

- clavier, texte à 200 % et largeur 320 px ;
- préparation/bilan, rotation, sauvegarde et rechargement ;
- refus d’écriture et réessai sans perdre la séance ;
- nouveautés, repères et lexique ;
- diagnostic privé, copie/export et repli hors connexion ;
- transfert de sauvegarde avec presse-papiers et téléchargement indisponibles.

Commandes : `npx playwright install --with-deps chromium webkit`, puis `npm run test:e2e`. Pour la sélection WebKit seulement : `npx playwright test --project=mobile-webkit --project=tablet-webkit`. Les captures et traces d’échec sont conservées dans l’artefact de CI habituel.

Le test à 200 % augmente la taille racine du texte ; il ne simule pas toutes les variantes de zoom et de réglage typographique d’iOS. WebKit Playwright sous Linux n’est pas Safari installé sur iPad : les permissions, les médias, le Bluetooth de Bluefy et certains comportements du système restent à vérifier physiquement. Voir la [documentation Playwright](https://playwright.dev/docs/browsers#webkit).

## Recette physique restante

1. Sur iPad et iPhone, tester Safari puis Bluefy avec un profil de test ; noter version de l’application, du système et du navigateur.
2. Avec un clavier, ouvrir une séance et vérifier la boucle Tab/Maj+Tab, les détails, la mise de côté et la reprise.
3. Avec VoiceOver, écouter le nom de chaque étape et vérifier que la navigation de fond est absente pendant la séance ; remplir puis enregistrer un bilan.
4. Agrandir le texte/zoom dans les réglages réellement disponibles ; vérifier préparation, pause, commandes, bilan et clavier virtuel en portrait/paysage. Ne pas accepter un bouton tronqué ou inaccessible.
5. Contrôler le rechargement, le transfert de sauvegarde et les refus de permissions sur le navigateur réel ; joindre le diagnostic de support en cas de problème.

Ce lot n’est pas une certification WCAG ou un audit exhaustif : contrastes de toutes les cartes, autres modales, formulaires annexes et parcours de première utilisation restent au backlog. Le pattern de dialogue s’appuie sur les [recommandations WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), avec la différence d’Échap décrite ci-dessus pour protéger les saisies.

Voir [la roadmap](ROADMAP.md) et [la recette bêta](BETA-TEST.md).

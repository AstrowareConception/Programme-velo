# Mode Voyage

Le Voyage permet de terminer **un même parcours en plusieurs séances**. Dans **Parcours**, choisis **Voyage en plusieurs séances**, puis un temps de 15, 30, 45 ou 60 minutes. Après le premier départ, **Quête** retrouve le parcours et propose **Continuer mon voyage**. Changer de voyage conserve toutes les portions déjà enregistrées ; choisir à nouveau ce parcours retrouve sa progression.

La prochaine portion commence au premier kilomètre manquant, jusqu’au budget disponible ou au début d’un passage déjà couvert. Une dernière portion peut donc être plus courte. La carte et le profil restent ceux du parcours entier ; les kilomètres et les villes affichés sont absolus. Aucun tracé, lieu ou dénivelé n’est compressé pour tenir dans le créneau.

## Simulation et mesures

Cette première version avance **sur le scénario temporel à 15 km/h**, y compris avec un vélo connecté. La durée exclut les pauses ; la résistance reprend les niveaux du profil original et leur calibration. La difficulté géographique reste celle du parcours ; les balades gardent leur effort adouci. Les segments sont découpés aux bornes de la portion, avec un arrondi de durée à la seconde.

Les mesures FTMS et celles saisies dans le journal décrivent le vélo. Elles sont distinctes de la distance virtuelle du Voyage, ne déplacent pas sa position et ne valident pas une portion. Sans mesure du vélo, la case distance du journal reste vide ; les kilomètres simulés figurent dans les informations Voyage. Les exports CSV distinguent également ces deux données.

## Pause et fin

Tu peux mettre en pause, fermer le lecteur et reprendre depuis Quête, ou recharger la page. La reprise reconstruit la portion en cours. Le Voyage ne remplace pas une séance interrompue : reprends-la ou abandonne-la d’abord. Comme les autres séances minutées, un lecteur resté actif peut rattraper le temps écoulé ; cela ne prouve pas que tu as pédalé en arrière-plan.

Les commandes de saut de segment sont désactivées dans ce mode. Seule une portion entièrement achevée puis enregistrée contribue au voyage. Un arrêt précoce garde la durée et les mesures dans l’historique, avec la mention **portion inachevée**, sans kilomètres validés. Avant de valider cet arrêt, **Continuer cette portion** permet de revenir au lecteur en pause. Fermer conserve aussi ce formulaire pour la prochaine reprise.

## Progression et récompenses

Les portions achevées sont réunies par parcours. Les chevauchements et répétitions comptent une seule fois. Il faut couvrir tout le parcours, sans trou, pour valider la route, les campagnes, les collections et les trophées liés. Une portion ne valide jamais seule sa route parente, ni un record Time Attack ou Segment Attack.

Les sessions Voyage ont **0 XP individuels**. À l’achèvement du parcours, ses XP sont attribués **une seule fois en Voyage**. Une séance classique complète déjà enregistrée à cette date sur ce parcours exclut ce second bonus ; les futures séances classiques conservent leur récompense habituelle. Les bonus uniques des campagnes restent distincts. Les points de semaine sont proportionnels à la distance de chaque portion achevée ; minutes, séances et charge restent dans le suivi d’activité. Une tentative Voyage inachevée n’attribue pas de points.

Trois trophées sans XP supplémentaires : **Première escale**, **Au bout du voyage**, **Carnet de voyage** (trois parcours différents achevés en Voyage). Les anciens objectifs et leurs seuils restent inchangés.

Supprimer une portion recalcule la couverture, la prochaine position, les XP et les trophées. Les portions plus loin sont conservées ; un passage manquant doit être refait. La suppression d’une autre séance peut aussi modifier l’éligibilité au bonus. Le JSON v3 conserve la sélection et les portions ; les sauvegardes anciennes restent compatibles.

## Limites de cette version

Un voyage concerne un parcours natif ou un GPX personnel, sans raccord automatique entre étapes. Les carnets Napoléon et Estérel restent libres ; il n’y a pas de liaison inventée à Gap. Le carnet personnel composé de plusieurs routes sera un lot ultérieur.

Si le GPX personnel a été supprimé, le journal et les récompenses restent calculables depuis les métadonnées enregistrées, mais la reprise nécessite le parcours d’origine avec le même identifiant (restaurer son export JSON). Réimporter seulement le GPX peut créer un nouvel identifiant. Des métadonnées contradictoires de distance ou récompense empêchent de combiner des portions. Modifier une trace existante nécessite donc un nouvel identifiant.

Le fonctionnement réel du TOPUTURE TEB5, l’installation et la veille sur appareils physiques restent à vérifier. Les tests automatisés simulent le temps et certaines API du navigateur.

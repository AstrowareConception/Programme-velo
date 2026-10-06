# Lecteur, alertes et média personnel

Actualisé le 5 octobre 2026.

## Choisir une vue

**Plus → Ton cockpit**, la préparation et le lecteur proposent **Vue complète** et **Vue essentielle**. La vue essentielle garde niveau manuel 1–32, temps restant, RPE, cadence cible, prochaine consigne et commandes. Pour un parcours, le lieu atteint et le suivant restent affichés ; pour une course, le chrono et le record restent présents. Carte, profil et détails du paysage reviennent en vue complète. Le changement ne remet pas à zéro une séance, Time Attack ou Segment Attack.

Le choix est une préférence locale exportée dans le JSON v3. Les sauvegardes anciennes conservent la vue complète par défaut. Pause, reprise, mise de côté et enregistrement restent disponibles selon les règles du mode : une course chronométrée ne propose pas de pause.

## Régler et vérifier les alertes

Ouvre **Son, voix et média** avant de partir. Active bips et/ou voix, règle leur volume de 0 à 100 %, puis choisis tous les segments ou seulement les changements de résistance, RPE ou cadence. Un nouveau nom de ville à consigne identique peut ainsi rester silencieux. Le retour haptique se règle dans Plus et dépend du navigateur.

**Tester mes alertes** envoie une courte consigne. Vérifie ce que tu entends avec ton casque et ton média : le volume du téléphone, le mode silencieux, les permissions et le traitement audio du système interviennent aussi. « Test envoyé » indique l’émission, sans prétendre mesurer ce qui est audible. Le volume zéro coupe bips et voix ; il ne coupe pas les vibrations activées séparément.

La voix utilise le niveau corrigé par la calibration globale et l’ajustement du coach. Le **préavis dix secondes** est facultatif, désactivé par défaut, et concerne les segments minutés. Il annonce la prochaine consigne une fois avant le changement ; au changement, la consigne actuelle est annoncée. Il ne fournit pas de prédiction temporelle pour une course pilotée par la distance FTMS. En arrière-plan, les annonces sont évitées plutôt que rejouées en rafale au retour.

## Écouter un podcast ou regarder YouTube

1. Lance le podcast ou la musique dans ton application habituelle.
2. Reviens dans VéloQuest et choisis la vue essentielle si tu veux alléger l’écran.
3. Teste les alertes avec le média en lecture et règle leur volume.
4. Pour une vidéo, active le mode image dans l’image lorsque YouTube et ton appareil le proposent. Sur ordinateur/tablette, garde les deux fenêtres côte à côte et VéloQuest visible.

Le mode flottant de YouTube et sa lecture en arrière-plan sont deux fonctions différentes ; leur disponibilité dépend notamment du contenu, de l’appareil et de l’offre YouTube. VéloQuest ne contient pas de lecteur YouTube intégré et ne contourne aucune restriction. Les alertes vocales peuvent réduire, interrompre ou remplacer le son du média selon le système : cette coexistence doit être essayée sur ton appareil.

## Écran éveillé et arrière-plan

Le réglage **Garder l’écran éveillé** demande un maintien uniquement pendant une séance en cours. La préparation ne l’annonce pas déjà accordé. Le lecteur affiche l’état réel : demande, accord, indisponibilité, refus ou interruption. Pause, fin et fermeture relâchent la demande. Un accord tardif après fermeture est relâché lui aussi.

Quand VéloQuest redevient visible, l’application redemande le maintien si la séance tourne et affiche un rappel pour vérifier la consigne et la connexion du vélo. **Réessayer le maintien** est proposé après refus ou interruption. Le système garde la décision finale, notamment selon la batterie et la visibilité.

Verrouiller l’écran ou masquer VéloQuest peut suspendre minuteurs, annonces et Bluetooth. La reprise locale conserve l’état connu ; elle ne prouve pas une mesure continue du vélo pendant l’absence. Garde VéloQuest visible pour une séance guidée fiable. Le mode manuel et la saisie finale restent disponibles.

## Portée des vérifications

Les **Photos des paysages** sont facultatives dans les fiches, la préparation et la vue complète ; elles sont masquées pendant l’effort en vue essentielle. Une galerie fermée ne charge aucune photo. La navigation libre n’avance ni le lecteur ni les kilomètres du Voyage. Les légendes distinguent le lieu illustré du point de vue photographique. [Guide des photos](LANDSCAPE-PHOTOS.md).

Les tests unitaires couvrent préférences, sauvegardes, calibration, filtrage des annonces, volume et contexte audio. Les tests Chromium mobile/ordinateur couvrent changements de vue, pause/reprise, arrivée, course/secteur, conservation des historiques et simulation des accords/refus/libérations du maintien de l’écran. Voix et maintien sont simulés : ils ne prouvent ni l’audibilité, ni le fonctionnement réel du TEB5, ni une installation Safari/iPhone, ni la lecture simultanée d’un média sur un téléphone physique.

À réception du vélo et sur les appareils utilisés : essayer casque/podcast, alerte de changement, volume nul, passage arrière-plan/retour, veille, reprise et reconnexion. Suivre aussi le [protocole matériel](TEB5-BLUETOOTH-VALIDATION.md). Exporter les données avant un transfert d’appareil ; elles restent locales.

## Références de plateforme

- [YouTube : image dans l’image](https://support.google.com/youtube/answer/7552722?hl=fr) — disponibilité et réglages selon appareil/contenu.
- [MDN : Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) — visibilité, refus et libération par le système.
- [MDN : Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) — limitations des tâches en arrière-plan.

Références consultées le 5 octobre 2026. Les essais physiques restent à réaliser.

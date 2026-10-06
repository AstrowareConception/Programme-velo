# Canal de Nantes à Brest — premier pack

Sources France Vélo Tourisme consultées le 6 octobre 2026 :
- Pontivy–Josselin : https://www.francevelotourisme.com/itineraire/la-velodyssee-eurovelo-1/pontivy-josselin ; GPX https://www.francevelotourisme.com/etape/gpx/369
- Josselin–Peillac : https://www.francevelotourisme.com/itineraire/la-velodyssee-eurovelo-1/josselin-peillac ; GPX https://www.francevelotourisme.com/etape/gpx/370

Sources et empreintes SHA256 dans `scripts/canal-sources.json`. Génération : `python3 scripts/build-exploration-profiles.py --sources scripts/canal-sources.json --output lib/canal-profiles.json`. Altitudes du GPX officiel, lissage médian, stations de 500 m, dénivelé calculé sur le profil produit. La géométrie vient du GPX et conserve les distances cumulées ; aucune liaison droite inventée. Les deux traces complètes partagent exactement leur extrémité à Josselin.

| Parcours | Distance calculée | D+ lissé | Difficulté intérieure |
| --- | --- | --- | --- |
| Pontivy → Josselin | 48,10 km | 128 m | 2/5 |
| Josselin → Peillac | 45,87 km | 73 m | 1/5 |
| Pontivy · premiers biefs | 7,55 km | 70 m | 1/5, effort doux ajustable |
| Josselin · parenthèse au fil de l’eau | 7,58 km | 8 m | 1/5 |

Les deux portions courtes sont coupées sur les points réels des GPX autour de 7,5 km. Elles ne rejoignent pas la ville terminale ni ne valident le parent. Les variantes de visite (Timadeuc, centres anciens) ne sont pas ajoutées. Aucune photo du site touristique n’est réutilisée sans licence.

84 parcours au total, 38 balades et 12 thèmes. Le carnet personnel prêt à créer relie les deux étapes complètes. Il réutilise les validations et récompenses existantes sans nouveau bonus par duplication de carnets. Les objectifs historiques fixes restent inchangés.

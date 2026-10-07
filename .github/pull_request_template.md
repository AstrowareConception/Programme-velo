## Objet

Décrire le problème traité et le résultat attendu sans dépendre d’un contexte de conversation externe.

## Changements

- 

## Compatibilité / données

- [ ] Aucun format persistant modifié
- [ ] Migration ou compatibilité ascendante documentée si nécessaire
- [ ] Les anciennes sauvegardes/historiques restent pris en charge, ou la rupture est explicitement documentée

## Validation

- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run test:e2e`
- [ ] `npm run build`
- [ ] Contrôles spécifiques au lot documentés ci-dessous

Pour une PR purement documentaire, indiquer clairement les contrôles non pertinents ; les garde-fous documentaires/CI applicables doivent rester verts.

## Continuité du projet

- [ ] `main` et les PR ouvertes ont été vérifiés avant de commencer
- [ ] La description de cette PR suffit à comprendre le lot sans relire un chat
- [ ] `docs/PROJECT-STATE.md` est mis à jour si ce lot change l’état de référence, l’architecture, les données, la compatibilité ou le déploiement
- [ ] `docs/ROADMAP.md` est mis à jour si les priorités ou le statut d’un chantier changent
- [ ] Les limites des tests simulés et des validations matérielles réelles sont distinguées lorsque le matériel est concerné

Voir [docs/CONTINUITY.md](../docs/CONTINUITY.md).

## Après fusion

- [ ] Vérifier la CI sur le commit final de `main`
- [ ] Vérifier Vercel et `/api/version` si le lot doit être publié
- [ ] Consigner le résultat final dans le checkpoint lorsque c’est pertinent

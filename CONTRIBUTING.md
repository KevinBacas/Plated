# Contribuer à Plated

## Branches

Le dépôt suit un GitHub Flow simple : `main` est l’unique branche permanente et la branche de production. Pas de branches permanentes `develop`, `staging` ou `release`. Un environnement de prévisualisation éventuel correspond à un déploiement, pas à une nouvelle branche permanente.

Depuis un arbre de travail propre :

```bash
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c docs/installation-locale
```

Choisir `feat/<sujet>` pour une fonctionnalité, `fix/<sujet>` pour une correction ou `docs/<sujet>` pour la documentation. Garder chaque branche courte et centrée sur un changement vérifiable indépendamment. Si le dossier contient déjà des modifications, les inspecter et les préserver avant de changer de branche.

Ne jamais committer de fonctionnalité, de correction ou de préparation de release directement sur `main`. Une urgence suit le même circuit sur `fix/<sujet>`. Une divergence locale se résout sur la branche de travail, sans réécrire l’historique de `main`.

## Validation et pull request

1. Installer l’environnement décrit dans [le guide de développement](docs/development.md).
2. Pour un changement applicatif, exécuter les contrôles ci-dessous et vérifier le parcours touché sur la plateforme concernée. Pour une modification documentaire uniquement, vérifier les chemins, liens locaux, versions et commandes modifiés, ainsi que `git diff --check` ; exécuter les commandes dont le fonctionnement est modifié.
3. Inspecter le diff, ajouter les fichiers concernés explicitement et créer un commit descriptif, par exemple `docs: document local setup`.
4. Pousser la branche et ouvrir une PR vers `main`, en indiquant le résultat attendu, les vérifications réellement effectuées et les limites restantes.

```bash
npm run typecheck
npm test
npm run lint
npm run build:web
git diff --check
```

Exemple de publication de la branche de documentation :

```bash
git push -u origin docs/installation-locale
gh pr create --base main --head docs/installation-locale
```

`gh` et l’authentification GitHub ne sont nécessaires que pour les opérations GitHub ; l’interface web permet aussi d’ouvrir la PR. Ne pas inclure les fichiers générés (`dist/`, `.expo/`, `expo-env.d.ts`, `ios/`, `android/`) ni les secrets dans le commit.

## Fusion et protection de main

Fusionner uniquement une PR validée, avec tous les contrôles requis réussis. Supprimer la branche temporaire après fusion. Ne pas activer la fusion automatique ou fusionner une PR quand la demande porte seulement sur sa préparation.

**État de la CI dans le dépôt :** le seul workflow versionné est [Deploy production](.github/workflows/deploy-production.yml), déclenché par un `push` sur `main`. Il valide puis déploie **après fusion**. Aucun workflow `pull_request` ne fournit actuellement de contrôles avant fusion : consigner les validations locales dans la PR et ne pas considérer l’absence de checks comme une validation automatique.

La protection de branche se configure dans GitHub, hors des fichiers du dépôt. La configuration recommandée exige une PR et une revue, interdit les pushes forcés et la suppression de `main`. Si une CI de PR est ajoutée, rendre ses contrôles obligatoires avant fusion. Ne pas rendre obligatoire pour les PR le job de déploiement qui ne s’exécute que sur `main`. Ces recommandations ne signifient pas que les règles distantes sont déjà activées.

Chaque fusion déclenche le [déploiement web](docs/deployment.md). `main` peut temporairement être en avance sur la production pendant un déploiement ou après un échec : identifier la production par le SHA du déploiement réussi. Les tags `vMAJEUR.MINEUR.PATCH` et releases GitHub désignent des commits de `main` dont le déploiement a été vérifié.

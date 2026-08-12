---
name: release-production
description: "Publier une version complète de Plated en production, de la validation locale à la release GitHub. Utiliser quand l'utilisateur demande de livrer, publier, déployer ou releaser les changements du dépôt Plated : vérifier le code, commit directement sur main, push vers origin/main, déployer la PWA avec Expo EAS Hosting, créer un tag et une release GitHub avec des notes, vérifier la production et restituer les notes dans le chat."
---

# Release Production

Exécuter le workflow depuis la racine du dépôt Plated. Traiter l'invocation explicite de ce skill comme l'autorisation des mutations listées dans sa description, mais demander confirmation avant toute mutation supplémentaire.

## 1. Préparer la release

1. Lire `AGENTS.md` et la documentation exacte d'Expo SDK 54.
2. Exécuter `scripts/release-context.sh` depuis ce dossier et inspecter ses résultats.
3. Arrêter avant toute mutation distante si :
   - la branche courante n'est pas `main` ;
   - `main` diverge de `origin/main` ou a du retard ;
   - des fichiers modifiés ne relèvent manifestement pas de la release ;
   - l'authentification GitHub ou Expo est absente ;
   - une release ou un tag portant la version prévue existe déjà.
4. Ne jamais écraser l'historique, forcer un push, réutiliser un tag ou supprimer une release.
5. Déterminer la version :
   - prendre la version explicitement demandée, si présente ;
   - sinon, prendre `v<expo.version>` si aucun tag SemVer n'existe ;
   - sinon, incrémenter le patch du dernier tag `vMAJEUR.MINEUR.PATCH` ;
   - choisir une montée mineure ou majeure seulement si la portée des changements l'exige clairement, et l'annoncer avant les mutations.

## 2. Valider avant publication

Exécuter dans cet ordre et corriger les erreurs avant de continuer :

```bash
npm run typecheck
npm test
npm run lint
npm run build:web
git diff --check
```

Vérifier aussi que `dist/index.html` et `dist/sw.js` existent. Ne jamais publier un build dont une vérification échoue.

## 3. Préparer les notes

Rédiger en français une note concise à partir du diff et des commits depuis le dernier tag. Utiliser seulement les sections pertinentes :

- `Nouveautés`
- `Améliorations`
- `Corrections`
- `Vérifications`

Ne pas inventer de changement. Mentionner les contrôles réellement réussis et conserver exactement le même texte pour la release GitHub et le message final.

## 4. Commit et push sur main

1. Inspecter `git status`, `git diff` et `git diff --cached`.
2. Ajouter uniquement les fichiers confirmés avec `git add -- <chemins explicites>`. Ne jamais utiliser `git add .`, `-A` ou `--all`.
3. Si des changements existent, créer un commit Conventional Commit décrivant la release. Si le worktree est propre, utiliser le commit `HEAD` sans créer de commit vide.
4. Enregistrer le SHA exact avec `git rev-parse HEAD`.
5. Pousser avec `git push origin main`.
6. Vérifier que `HEAD` et `origin/main` ont le même SHA.

## 5. Déployer Expo en production

Le build web ayant déjà réussi, publier avec :

```bash
npx --yes eas-cli@latest deploy --prod --non-interactive
```

Conserver l'URL immuable du déploiement et l'URL de production retournées. Vérifier les deux avec une requête HTTP et exiger un statut `200`. Pour éviter une réponse CDN périmée sur l'alias, ajouter un paramètre de requête unique lors du contrôle.

Si le déploiement échoue, ne pas créer de tag ni de release. Rapporter que le commit est déjà poussé et donner la commande de reprise.

## 6. Créer le tag et la release GitHub

Après validation du déploiement uniquement :

1. Vérifier à nouveau que la version n'existe ni comme tag local/distant, ni comme release GitHub.
2. Créer une release GitHub non brouillon ciblant le SHA déployé avec `gh release create <tag> --target <sha> --title <titre> --notes <notes>`.
3. Cette commande doit créer et pousser le tag ; ne pas lancer un second `git push --tags` sans nécessité prouvée.
4. Vérifier avec `gh release view <tag>` que la release est publiée et pointe vers le bon tag.
5. Exécuter `git fetch --tags origin`, puis confirmer que le tag local et le SHA déployé correspondent.

Si la création de release échoue après le déploiement, ne pas redéployer. Diagnostiquer l'état distant, puis reprendre uniquement la création ou la vérification manquante.

## 7. Restituer dans le chat

Donner :

- la version et le SHA ;
- l'URL de production et l'URL du déploiement ;
- l'URL de la release GitHub ;
- le résultat des validations ;
- les notes de release exactes ;
- tout avertissement utile, notamment le délai de mise à jour du service worker PWA.

N'annoncer le succès complet que si commit/push, déploiement, contrôles HTTP, tag et release GitHub sont tous vérifiés.

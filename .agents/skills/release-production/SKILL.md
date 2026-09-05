---
name: release-production
description: "Livrer une version web de Plated via une pull request vers main, suivre le déploiement automatique EAS Hosting, vérifier la production puis créer le tag et la release GitHub. Utiliser lorsque l'utilisateur demande une livraison ou une release de production."
---

# Release Production

Exécuter depuis la racine du dépôt. Lire `AGENTS.md`, `CONTRIBUTING.md`, `docs/deployment.md` et la [documentation Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/). La procédure de déploiement fait référence ; ce skill coordonne sa réalisation et les vérifications de release.

Une demande explicite de release autorise les opérations nécessaires à cette livraison, sous réserve des règles de branche et des permissions de l'environnement. Une demande limitée à préparer une PR s'arrête à la PR. Ne pas committer ni pousser directement sur `main` ; ne pas contourner les revues ou contrôles requis.

## 1. Préparer la version sur une branche temporaire

1. Inspecter la branche, les modifications et l'authentification GitHub. Préserver les modifications hors périmètre. Utiliser Node 22 et `npm ci` selon le guide de développement.
2. Exécuter `git fetch origin --tags`. Pour un nouveau changement, créer une branche courte `feat/<sujet>`, `fix/<sujet>` ou `docs/<sujet>` depuis `origin/main` à jour. Reprendre une branche dédiée existante si elle contient déjà le travail à livrer.
3. Le script `.agents/skills/release-production/scripts/release-context.sh` peut compléter le diagnostic. Il est en lecture seule côté services, mais lance EAS CLI via `npx` et peut nécessiter un téléchargement. Son échec d'authentification Expo locale ne bloque pas une livraison par CI si le secret GitHub fonctionne ; une opération EAS manuelle exige ses propres accès.
4. Choisir la version explicitement demandée. À défaut, prendre `v<expo.version>` si aucun tag SemVer n'existe, sinon incrémenter le patch du dernier tag stable. Annoncer une montée mineure ou majeure lorsque la portée la justifie. Vérifier que la version n'existe ni comme tag local/distant ni comme release GitHub.
5. Aligner la version choisie dans `app.json`, `package.json` et les métadonnées racines de `package-lock.json` sur la branche. Si le commit déjà fusionné porte la bonne version, ne pas créer de commit vide ou de PR inutile.

## 2. Valider et préparer les notes

```bash
npm run typecheck
npm test
npm run lint
npm run build:web
git diff --check
```

Vérifier `dist/index.html`, `dist/manifest.json` et `dist/sw.js`. Corriger les erreurs avant de continuer. Les tests unitaires ne remplacent pas la vérification du parcours touché dans le navigateur.

Rédiger des notes en français à partir du diff et des commits depuis le dernier tag stable. Utiliser seulement les sections utiles parmi Nouveautés, Améliorations, Corrections et Vérifications. Ne mentionner que des changements et contrôles avérés. Enregistrer les notes dans un fichier pour les transmettre avec `--notes-file`.

## 3. Passer par une pull request

1. Inspecter `git status`, `git diff` et `git diff --cached`. Ajouter seulement les fichiers concernés avec `git add -- <chemins explicites>`, puis committer sur la branche temporaire.
2. Pousser cette branche, ouvrir ou mettre à jour sa PR vers `main`, et y consigner les validations. Le dépôt n'a actuellement aucun workflow de PR ; les vérifications du workflow de production arrivent après fusion.
3. Quand la livraison inclut la fusion et que la PR est validée, respecter les protections et tous les contrôles requis. Si une revue requise manque ou qu'un contrôle échoue, rapporter l'étape précise à résoudre ; ne pas forcer la fusion.
4. Relever le SHA exact du commit fusionné et récupérer les références distantes. Utiliser ce SHA pour la suite, pas le SHA de tête de la branche avant fusion. Supprimer la branche temporaire après fusion, en préservant tout travail local restant.

## 4. Suivre le déploiement automatique

Chaque push sur `main` déclenche `.github/workflows/deploy-production.yml`. Rechercher le run correspondant au SHA fusionné et attendre sa réussite avec les outils GitHub. Ne pas lancer un deuxième `eas deploy --prod` pendant que la CI publie le même commit.

Conserver l'ID du run, le SHA, l'ID EAS, l'URL immuable et l'URL de production. Vérifier les réponses HTTP et les parcours web/PWA décrits dans `docs/deployment.md`. Pour l'alias, utiliser un paramètre de requête unique. Si un commit ultérieur a déjà remplacé l'alias, distinguer le déploiement du SHA visé et la version actuellement en ligne ; ne pas affirmer que le premier est encore la production.

Si la CI ou la vérification échoue, ne pas créer de nouveau tag/release. Diagnostiquer l'état atteint et appliquer uniquement la reprise nécessaire décrite dans le guide de déploiement. Une relance d'un ancien run peut remettre un ancien commit en production : vérifier les déploiements plus récents avant de relancer. Un retour arrière utilise un déploiement précédemment validé et ne réécrit pas `main`.

## 5. Créer et vérifier la release GitHub

Après vérification du déploiement uniquement :

1. Vérifier à nouveau l'absence du tag et de la release. Ne jamais écraser l'historique, forcer un push ou réutiliser un tag existant pour une autre version.
2. Créer la release non brouillon sur le SHA déployé :

```bash
gh release create <tag> --target <sha-deploye> --title <titre> --notes-file <fichier-notes>
```

3. Cette commande crée le tag distant s'il est absent ; ne pas ajouter de `git push --tags`.
4. Vérifier avec `gh release view <tag>`, puis `git fetch --tags origin` et `git rev-list -n 1 <tag>` que la release existe et que son tag désigne exactement le SHA vérifié.

Si cette étape échoue après le déploiement, inspecter les objets distants avant de réessayer. Reprendre uniquement la création ou la vérification manquante, sans redéployer ni supprimer une release existante.

## 6. Restituer le résultat

Donner la version, le SHA, la PR, le run, les URLs de production/déploiement/release, les contrôles réalisés et les limites éventuelles. Reprendre les notes publiées sans inventer de résultat. N'annoncer une release terminée que si la fusion, le déploiement, les vérifications et le tag/release sont confirmés.

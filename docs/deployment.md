# Déploiement et releases

## Cible et configuration

La livraison automatique concerne la **PWA web sur EAS Hosting**. Le projet est lié par [app.json](../app.json) au compte Expo `kevinbacas`, slug `Plated`, projet `a42b4d2a-b6d5-4eca-a110-1932aadc5c53`. Retrouver les déploiements et les URLs dans la section Hosting du [projet Expo](https://expo.dev/accounts/kevinbacas/projects/Plated).

`web.output` vaut `static`. `npm run build:web` exécute l’export Expo puis Workbox et produit `dist/`, notamment `index.html`, `manifest.json` et `sw.js`. Ne pas remplacer cette commande par le seul export Expo : la PWA perdrait la génération de son service worker.

## Production automatique

Le workflow [Deploy production](../.github/workflows/deploy-production.yml) se déclenche à chaque push sur `main`, y compris une fusion de PR de documentation. Il utilise Ubuntu, Node 22 et une concurrence `production` avec `cancel-in-progress: false` pour ne pas interrompre un déploiement en cours.

Le job effectue :

1. Checkout du commit et installation par `npm ci`.
2. Configuration d’EAS CLI (`latest`) via `expo/expo-github-action@v8` et `EXPO_TOKEN`.
3. `npm run typecheck`, `npm test`, `npm run lint`, `npm run build:web`.
4. `eas deploy --prod --non-interactive` uniquement si les étapes précédentes réussissent.

Le workflow ne se déclenche pas sur les PR et ne crée ni tag ni release GitHub. La procédure de [contribution](../CONTRIBUTING.md) décrit les validations avant fusion. Une fusion réussie n’est pas une preuve de déploiement réussi.

### Configuration initiale des accès

Un mainteneur disposant des accès au projet Expo et aux secrets du dépôt doit :

1. Vérifier que Hosting est initialisé pour ce projet et que son sous-domaine est choisi avant le premier déploiement non interactif.
2. Créer un jeton d’accès personnel Expo pour un compte autorisé à déployer ce projet.
3. Ajouter le jeton au dépôt GitHub sous **Settings → Secrets and variables → Actions → New repository secret**, avec le nom `EXPO_TOKEN`.
4. Suivre la première exécution de `Deploy production` et vérifier les URLs retournées.

Le secret est fourni à l’action Expo qui configure l’authentification pour la suite du job. Ne jamais le mettre dans `app.json`, une variable `EXPO_PUBLIC_*`, un fichier committé ou les notes de PR. Le workflow actuel ne déclare pas d’environnement GitHub avec approbation manuelle ; l’autorisation de déployer découle de la fusion vers `main`.

## Vérifier une livraison

Depuis une machine disposant de GitHub CLI authentifié, remplacer les paramètres ci-dessous par les valeurs observées :

```bash
gh run list --workflow deploy-production.yml --commit <sha> --limit 5
gh run view <run-id>
gh run view <run-id> --log-failed
```

La dernière commande sert au diagnostic d’un échec. Associer le SHA du run réussi à l’ID et à l’URL immuable affichés par EAS. Vérifier cette URL et l’alias de production, avec un paramètre de requête unique pour éviter une réponse périmée :

```bash
curl --fail --silent --show-error -o /dev/null -w '%{http_code}\n' 'https://<url-deploiement>/?check=<identifiant-unique>'
curl --fail --silent --show-error -o /dev/null -w '%{http_code}\n' 'https://<url-production>/?check=<identifiant-unique>'
curl --head --fail 'https://<url-production>/sw.js'
```

Attendre un statut `200` pour les pages et vérifier dans le navigateur la collection, le journal, les réglages et la mise à jour PWA. Une réponse HTTP seule ne valide pas ces interactions. Consigner le SHA, le run, les URLs et les contrôles réalisés dans la release lorsqu’une release versionnée est demandée.

## Prévisualisation et reprise

Pour une prévisualisation web demandée, depuis une branche validée et avec un compte Expo autorisé :

```bash
npm run build:web
npx --yes eas-cli@latest whoami
npx --yes eas-cli@latest deploy --non-interactive
```

Une session locale peut être ouverte par `npx --yes eas-cli@latest login`. L’option `--prod` est réservée à la production ; un déploiement sans cette option fournit une URL de prévisualisation. La première initialisation Hosting peut nécessiter une session interactive. Voir les [déploiements et alias EAS](https://docs.expo.dev/eas/hosting/deployments-and-aliases/).

Si la CI échoue avant la publication, corriger le code par PR ou réparer les accès selon le diagnostic. Pour relancer un échec transitoire du **même SHA**, vérifier d’abord qu’il est toujours le commit à livrer et qu’aucun déploiement plus récent n’a pris sa place, puis utiliser `gh run rerun <run-id> --failed`. Le workflow ne propose pas de déclenchement manuel `workflow_dispatch`.

Si EAS a publié mais qu’une vérification ultérieure échoue, inspecter Hosting avant de relancer : un nouveau déploiement n’est pas automatiquement nécessaire. Éviter de publier manuellement le même commit pendant que GitHub Actions le déploie.

## Retour arrière

Identifier un déploiement précédemment vérifié, conserver ses ID/SHA/URL et vérifier qu’aucun job de production en cours ne remplacera immédiatement le retour arrière. Pour une restauration de production autorisée :

```bash
npx --yes eas-cli@latest deploy:alias --prod --id <id-deploiement-valide>
```

Cette commande réassigne l’alias à un déploiement existant, sans reconstruire le code. Vérifier ensuite l’alias et la PWA. Corriger ou réverter le changement fautif sur une branche `fix/<sujet>` via PR pour que les prochaines fusions ne réintroduisent pas le problème. Ne pas réécrire `main` ni déplacer les tags existants. La syntaxe de promotion est décrite dans la [documentation EAS](https://docs.expo.dev/eas/hosting/deployments-and-aliases/).

## Versions et releases GitHub

Un déploiement à chaque fusion ne nécessite pas forcément un nouveau numéro de version. Lorsqu’une release est demandée :

1. Choisir une version SemVer non utilisée. Mettre à jour ensemble `expo.version` dans `app.json`, `version` dans `package.json` et les métadonnées racines de `package-lock.json`, sur une branche temporaire via PR.
2. Valider et fusionner la PR dans le cadre de l’autorisation de livraison ; retenir le **SHA de fusion**, qui peut différer du SHA de la branche.
3. Attendre le déploiement GitHub Actions correspondant et vérifier la production avant de taguer.
4. Créer la release sur ce SHA exact, avec des notes en français rédigées dans un fichier :

```bash
gh release create <tag-vX.Y.Z> --target <sha-deploye> --title <titre> --notes-file <fichier-notes>
```

Vérifier au préalable que le tag et la release n’existent ni localement ni à distance. Vérifier ensuite la release avec `gh release view <tag-vX.Y.Z>`, récupérer les tags et contrôler le SHA avec `git rev-list -n 1 <tag-vX.Y.Z>`. Si seule la création de release échoue, reprendre cette étape sans redéployer. Le [skill de release](../.agents/skills/release-production/SKILL.md) guide les agents sur cette même procédure.

## Cache et mises à jour PWA

Workbox précache les ressources de `dist/`, active immédiatement le nouveau service worker et nettoie les anciens caches. `app/+html.tsx` vérifie les mises à jour au chargement et au retour au premier plan ; la bannière web propose de recharger lorsqu’une nouvelle version prend le contrôle.

[public/_headers](../public/_headers) exprime les règles pour les hébergeurs compatibles avec le format Netlify/Cloudflare Pages : pas de cache pour `sw.js`, revalidation du HTML/manifeste et cache long pour les bundles avec hash. La présence de ce fichier ne prouve pas qu’EAS applique ces directives. Examiner les en-têtes HTTP réels et la [politique de cache EAS](https://docs.expo.dev/eas/hosting/reference/caching/) avant de diagnostiquer une mise à jour bloquée. Ne pas effacer le stockage du navigateur de l’utilisateur pour forcer une mise à jour : il contient ses observations.

## Builds natifs

[eas.json](../eas.json) définit deux profils de **build natif**, indépendants de l’alias web : `preview` en distribution interne et `production`, tous deux avec incrément automatique du numéro de build. Les versions de build sont gérées à distance (`appVersionSource: remote`).

Pour une construction iOS explicitement demandée, avec les accès et identifiants de signature configurés :

```bash
npx --yes eas-cli@latest build --platform ios --profile preview
# Ou pour un binaire destiné à la distribution en production :
npx --yes eas-cli@latest build --platform ios --profile production
```

L’identifiant iOS est `com.kevinbacas.plated`. L’identifiant `android.package` n’est pas encore défini ; le configurer avant une première livraison Android. Aucun workflow de publication aux stores, profil `submit` ou mécanisme EAS Update n’est configuré dans ce dépôt. Un build natif ne constitue pas une soumission aux stores, et la CI web ne valide pas un binaire natif.

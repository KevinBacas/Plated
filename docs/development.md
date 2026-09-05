# Développement local et architecture

## Stack et versions

[package.json](../package.json) définit les plages autorisées ; [package-lock.json](../package-lock.json) fixe les versions installées par `npm ci`. Le tableau décrit le lockfile au moment de cette documentation : le mettre à jour avec les dépendances.

| Élément | Version installée / configuration |
| --- | --- |
| Application | `1.0.1` dans `package.json` et `app.json` |
| Node.js | Majeure `22` pour le développement et GitHub Actions ; [.nvmrc](../.nvmrc) |
| Expo | SDK 54, package `54.0.36` (plage `~54.0.35`) |
| React / React DOM | `19.1.0` |
| React Native | `0.81.5`, nouvelle architecture activée |
| React Native Web | `0.21.2` |
| Expo Router | `6.0.24`, routes typées activées |
| TypeScript | `5.9.3`, mode strict, alias `@/*` vers la racine |
| Stockage | `expo-sqlite` `16.0.10` et API `localStorage` |
| Animation | Reanimated `~4.1.1` et Worklets `0.5.1` déclarés |
| Qualité | ESLint `9.39.5`, `eslint-config-expo`, `tsx` `4.23.11` et `node:test` |
| PWA | Workbox CLI `7.4.1`, manifeste et service worker |
| Livraison | EAS Hosting ; EAS CLI `>= 21.7.0` dans `eas.json`, `latest` utilisé par le workflow |

Consulter la [documentation exacte du SDK 54](https://docs.expo.dev/versions/v54.0.0/) avant de modifier le code Expo. Le SDK indique Node 20.19.x au minimum, mais le dépôt utilise Node 22 pour rester aligné avec son déploiement EAS. Les correctifs de Node/npm et la version EAS résolue par `latest` ne sont pas épinglés par le dépôt.

Pour une dépendance Expo, utiliser `npx expo install <paquet>` afin de sélectionner une version compatible avec le SDK. Versionner le changement de manifeste et de lockfile ensemble ; éviter les mises à niveau implicites du SDK pendant une correction sans rapport.

## Organisation et flux de données

| Chemin | Rôle |
| --- | --- |
| `app/_layout.tsx` | Providers de thème et d’observations, navigation racine |
| `app/(tabs)/` | Collection, journal et réglages |
| `app/target/[targetId].tsx` | Détail d’une plaque et historique des observations |
| `app/+html.tsx` | Document HTML web, manifeste et enregistrement du service worker |
| `context/observations.tsx` | Lecture, ajout, suppression et persistance du journal |
| `data/targets.ts` | Catalogue statique des départements et pays |
| `lib/` | Types et fonctions de formatage, recherche, progression et préférence de thème |
| `components/`, `hooks/`, `constants/` | UI partagée, variantes par plateforme et couleurs |
| `public/`, `assets/` | Manifeste PWA, ressources copiées au build et images |
| `tests/` | Tests du catalogue, recherche, progression, thème et contraste |
| `workbox-config.cjs` | Précache, activation et navigation hors ligne du service worker |
| `.github/workflows/` | Validation et déploiement après push sur `main` |
| `.agents/skills/release-production/` | Procédure de release pour un agent |

L’entrée de l’application est `expo-router/entry`. Les écrans lisent le catalogue et appellent `useObservations()`. Le provider sérialise les observations en JSON sous `plated.observations.v1`, puis met à jour l’état React. L’import `expo-sqlite/localStorage/install` fournit l’API de stockage sur mobile ; le web utilise le stockage du navigateur. La préférence de thème est enregistrée séparément sous `plated.theme-preference`.

Il n’y a pas d’API distante ni de base partagée à démarrer, migrer ou peupler. Les URLs de développement, de prévisualisation et de production ont des espaces de stockage web distincts. Préserver la compatibilité des données existantes lors d’une modification des clés ou du format stocké.

Les composants utilisent React Native et des styles définis dans le code. Les fichiers `.web.tsx` et `.ios.tsx` portent les variantes de plateforme. Le React Compiler est activé dans `app.json` ; les dossiers natifs sont générés et ignorés par Git.

## Installation et lancement

Depuis la racine du clone :

```bash
nvm install
nvm use
npm ci
npm run web
```

`nvm` est facultatif si Node 22 est déjà installé. `npm ci` nécessite l’accès au registre npm et remplace `node_modules` à partir du lockfile. Aucune variable d’environnement applicative n’est requise ; `EXPO_TOKEN` sert à la livraison, pas au développement.

### Mobile

- `npm start` démarre Expo et affiche le QR code ; l’appareil et la machine doivent pouvoir se joindre sur le réseau.
- Expo Go doit être compatible avec **SDK 54**. Vérifier les versions proposées sur [expo.dev/go](https://expo.dev/go) ; ne pas supposer que la version disponible sur l’App Store accepte cet ancien SDK.
- `npm run ios` ouvre la cible iOS configurée (simulateur : macOS et Xcode requis). `npm run android` nécessite un émulateur Android Studio ou un appareil accessible via ADB.
- Si Expo Go ne convient pas, compiler localement avec `npx expo run:ios` ou `npx expo run:android` après installation des outils natifs [décrits par Expo](https://docs.expo.dev/get-started/set-up-your-environment/). Ces commandes génèrent les projets natifs ; ne pas les committer. Il n’y a actuellement ni dépendance `expo-dev-client`, ni profil EAS `development` dans ce dépôt.

Les profils EAS `preview` et `production` sont décrits dans [le guide de déploiement](deployment.md). Ils ne sont pas nécessaires pour tester la version web.

### Build web et PWA en local

```bash
npm run build:web
npx --yes serve@14 dist --listen 4173
```

La commande `serve` télécharge un utilitaire ponctuel ; ce n’est pas une dépendance du projet. Ouvrir `http://localhost:4173` pour tester les fichiers exportés, le manifeste et le service worker. `npm run web` sert le mode développement et ne génère pas `dist/sw.js`.

Pour un changement de PWA, contrôler l’installation, une recharge hors ligne après un premier chargement réussi et la bannière de mise à jour après un nouveau build servi sur la même origine. Si un ancien service worker masque les modifications, le désinscrire et vider son cache dans les outils du navigateur ; éviter d’effacer `localStorage`, qui contient le journal.

### Vérifications et dépannage

```bash
npm run typecheck
npm test
npm run lint
npm run build:web
git diff --check
```

Les tests existants couvrent la logique pure, pas une session complète dans l’interface ni la persistance réelle sur appareil. Compléter par un essai du parcours touché : ajouter une observation, recharger, consulter le journal, changer le thème selon le changement.

En cas de cache Metro incohérent, utiliser `npx expo start --clear`. Pour diagnostiquer des dépendances Expo incompatibles, utiliser `npx expo install --check` et examiner le résultat avant de modifier les versions. Ne pas lancer `npm run reset-project` pour réparer l’installation : ce script déplace les écrans existants et recrée un squelette.

## Démarrage pour un agent

1. Lire [AGENTS.md](../AGENTS.md), [CONTRIBUTING.md](../CONTRIBUTING.md) et les fichiers de configuration ; inspecter `git status` et préserver les changements en cours.
2. Créer la branche de travail depuis `origin/main` à jour, ou reprendre une branche dédiée existante.
3. Sélectionner Node 22, exécuter `npm ci`, puis les contrôles adaptés au changement. En environnement sans interface, les tests, le typecheck, le lint et le build web ne nécessitent ni simulateur ni identifiants Expo.
4. Pour consulter l’UI sans ouvrir automatiquement de navigateur, utiliser `CI=1 npx expo start --web --localhost --port 8081`, puis connecter l’outil de navigateur à l’URL indiquée. Arrêter le serveur à la fin de la vérification.
5. Lire les résultats avant de préparer la PR ; signaler explicitement une commande bloquée par le réseau ou une plateforme non testée. Une sandbox peut demander des autorisations séparées pour installer les dépendances, ouvrir un port ou écrire dans `.git`.

La préparation d’une PR s’arrête à une PR vérifiable. La procédure de release ne s’applique que lorsque la livraison est demandée.

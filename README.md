# Plated

Un journal de plaques local, conçu pour noter rapidement les départements français et les pays de l’Union européenne croisés sur la route. La version web est installable sur l’écran d’accueil d’un iPhone.

## Version web installable

Après déploiement, ouvrez l’URL dans Safari sur iPhone, touchez Partager puis **Sur l’écran d’accueil**. Les observations sont conservées dans le navigateur de chaque téléphone et restent donc indépendantes.

## Lancer en local

1. Installe [Expo Go](https://expo.dev/go) sur l’iPhone.
2. Dans ce dossier, exécute `npm install`, puis `npm start`.
3. Scanne le QR code affiché avec Expo Go.

Les observations restent sur le téléphone, dans une base SQLite locale. Désinstaller l’application efface donc le journal.

## Déploiement web et mises à jour

Le build web génère un service worker Workbox. Lorsqu'une nouvelle version prend le contrôle de la PWA,
une bannière propose de recharger l'application. La recherche de mise à jour est relancée au démarrage et
chaque fois que la PWA revient au premier plan.

Le fichier `public/_headers` configure le cache pour les hébergeurs qui prennent en charge le format
Netlify/Cloudflare Pages. Sur un autre hébergeur, appliquez les mêmes règles dans sa configuration :

- `/sw.js` ne doit pas être mis en cache ;
- les pages HTML et le manifeste doivent être revalidés ;
- les bundles sous `/_expo/static/`, dont le nom contient un hash, peuvent être conservés un an.

## Vérifications

```bash
npm test
npm run typecheck
npm run lint
```

Le catalogue embarqué contient 101 départements français et 26 pays de l’Union européenne — la France est couverte par les départements.

## Stratégie de branches

Le dépôt suit une variante simple du **trunk-based development**, proche de GitHub Flow :

- `main` est l’unique branche permanente et représente toujours la production ;
- chaque fonctionnalité ou correction est développée sur une branche temporaire créée depuis un `main` à jour (`feat/<sujet>`, `fix/<sujet>` ou `docs/<sujet>`) ;
- la branche temporaire est testée indépendamment, puis intégrée directement dans `main` par pull request après validation ;
- les branches doivent rester courtes, ciblées et être supprimées après leur fusion ;
- il n’existe pas de branche permanente `develop`, `staging` ou `release` : les environnements et versions déployées sont identifiés par le commit ou le tag issu de `main`.

Ce modèle est couramment employé dans l’industrie sous les noms de **trunk-based development** ou **GitHub Flow**. Il convient bien à ce dépôt tant que `main` est protégée : les vérifications automatiques doivent réussir, la pull request doit être validée et le déploiement doit pouvoir être annulé rapidement. Une correction urgente suit le même circuit sur une branche `fix/<sujet>` afin de ne pas contourner ces garanties.

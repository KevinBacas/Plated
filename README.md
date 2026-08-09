# Plated

Un journal de plaques local, conçu pour noter rapidement les départements français et les pays de l’Union européenne croisés sur la route. La version web est installable sur l’écran d’accueil d’un iPhone.

## Version web installable

Après déploiement, ouvrez l’URL dans Safari sur iPhone, touchez Partager puis **Sur l’écran d’accueil**. Les observations sont conservées dans le navigateur de chaque téléphone et restent donc indépendantes.

## Lancer en local

1. Installe [Expo Go](https://expo.dev/go) sur l’iPhone.
2. Dans ce dossier, exécute `npm install`, puis `npm start`.
3. Scanne le QR code affiché avec Expo Go.

Les observations restent sur le téléphone, dans une base SQLite locale. Désinstaller l’application efface donc le journal.

## Vérifications

```bash
npm test
npm run typecheck
npm run lint
```

Le catalogue embarqué contient 101 départements français et 26 pays de l’Union européenne — la France est couverte par les départements.

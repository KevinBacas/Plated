# Plated

Un journal de plaques pour noter les départements français et les pays de l’Union européenne croisés sur la route. Le catalogue embarqué contient 101 départements et 26 pays de l’UE, la France étant couverte par les départements.

L’application partage son code entre iOS, Android et le web. La version web est une PWA installable : sur iPhone, ouvrir l’URL de production dans Safari, puis **Partager → Sur l’écran d’accueil**.

Les observations sont conservées localement sur chaque appareil : `localStorage` du navigateur sur le web, stockage adossé à SQLite sur mobile. Il n’y a ni compte utilisateur, ni serveur applicatif, ni synchronisation entre appareils. Effacer les données du site ou désinstaller l’application native peut supprimer le journal.

## Démarrage rapide

Prérequis : Git, **Node.js 22** et npm. Avec [nvm](https://github.com/nvm-sh/nvm), la version majeure est définie dans [.nvmrc](.nvmrc), en accord avec le workflow de production.

```bash
git clone https://github.com/KevinBacas/Plated.git
cd Plated
nvm install
nvm use
npm ci
npm run web
```

Sans nvm, installer Node 22 puis exécuter les commandes npm. Ouvrir l’adresse indiquée par Expo, généralement `http://localhost:8081`. Aucun fichier `.env`, secret Expo ou service externe n’est nécessaire pour développer et lancer les vérifications.

Pour modifier le projet, créer d’abord une branche temporaire depuis `main` à jour : voir [Contribuer](CONTRIBUTING.md).

## Documentation

- [Développement local et architecture](docs/development.md) : stack, versions, dossiers, mobile, tests et démarrage pour un agent.
- [Contribuer](CONTRIBUTING.md) : branches, validation, PR et fusion.
- [Déploiement et releases](docs/deployment.md) : EAS Hosting, secret GitHub, vérifications, reprise et retour arrière.
- [Instructions pour les agents](AGENTS.md) : conventions à respecter pendant les modifications.

## Commandes principales

| Commande | Usage |
| --- | --- |
| `npm ci` | Installer les versions exactes de `package-lock.json` |
| `npm start` | Démarrer Metro / Expo |
| `npm run web` | Développer dans le navigateur |
| `npm run ios` / `npm run android` | Démarrer Expo et ouvrir la cible native configurée |
| `npm test` | Exécuter les tests unitaires avec le runner Node via `tsx` |
| `npm run typecheck` | Vérifier TypeScript sans générer de JavaScript |
| `npm run lint` | Exécuter ESLint avec la configuration Expo |
| `npm run build:web` | Exporter le site dans `dist/` et générer le service worker Workbox |

`main` est l’unique branche permanente et la branche de production. Chaque fusion déclenche le déploiement web GitHub Actions ; le SHA du dernier déploiement réussi identifie la version réellement en ligne.

# Plated

A license plate journal for recording the French departments and European Union countries spotted on the road. The built-in catalog contains 101 departments and 26 EU countries, with France covered by its departments.

The application shares its code across iOS, Android, and the web. The web version is an installable PWA: on iPhone, open the production URL in Safari, then choose **Share → Add to Home Screen**.

Observations are stored locally on each device: browser `localStorage` on the web and SQLite-backed storage on mobile. There are no user accounts, application servers, or synchronization between devices. Clearing site data or uninstalling the native application may delete the journal.

## Trip sessions

Start a session from **Collection**, a plate detail, or the **Sessions** tab before a car trip. New observations join the active session automatically. Finish it when you arrive; the recap shows the start/end dates, duration, total sightings, unique departments and countries, the plates spotted, and a podium of the three most encountered French regions. The podium counts department sightings, including repeated sightings; countries and observations outside the session do not contribute. Ties use French alphabetical order. With fewer than three regions, only the recorded regions appear. Expand **Voir les plaques** to see counts and the last sighting for each plate.

Only one session can be active at a time, and it survives closing/reopening the app. The global collection and journal include every observation. Existing observations and new sightings recorded without an active session remain **Hors session**. Undoing or deleting an observation also updates its session recap. Sessions are stored locally on the same device as the journal.

## Quick start

Prerequisites: Git, **Node.js 22**, and npm. With [nvm](https://github.com/nvm-sh/nvm), the major version is defined in [.nvmrc](.nvmrc), matching the production workflow.

```bash
git clone https://github.com/KevinBacas/Plated.git
cd Plated
nvm install
nvm use
npm ci
npm run web
```

Without nvm, install Node 22 and then run the npm commands. Open the address printed by Expo, usually `http://localhost:8081`. No `.env` file, Expo secret, or external service is required to develop the application or run checks.

Before changing the project, create a temporary branch from an up-to-date `main`: see [Contributing](CONTRIBUTING.md).

## Documentation

- [Local development and architecture](docs/development.md): stack, versions, directories, mobile development, tests, and agent setup.
- [Contributing](CONTRIBUTING.md): branches, validation, pull requests, and merging.
- [Deployment and releases](docs/deployment.md): EAS Hosting, the GitHub secret, verification, recovery, and rollback.
- [Agent instructions](AGENTS.md): conventions to follow when making changes.

## Main commands

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the exact versions from `package-lock.json` |
| `npm start` | Start Metro / Expo |
| `npm run web` | Develop in the browser |
| `npm run ios` / `npm run android` | Start Expo and open the configured native target |
| `npm test` | Run unit tests with the Node test runner through `tsx` |
| `npm run typecheck` | Check TypeScript without generating JavaScript |
| `npm run lint` | Run ESLint with the Expo configuration |
| `npm run build:web` | Export the site to `dist/` and generate the Workbox service worker |

PRs targeting `main` run [PR CI](.github/workflows/pr-ci.yml): whitespace checks, TypeScript, unit tests, lint, and the web PWA build. See [Contributing](CONTRIBUTING.md) for the required-check setup.

`main` is the only permanent branch and the production branch. Each merge triggers the GitHub Actions web deployment; the SHA of the last successful deployment identifies the version actually running in production.

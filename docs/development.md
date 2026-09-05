# Local development and architecture

## Stack and versions

[package.json](../package.json) defines allowed version ranges; [package-lock.json](../package-lock.json) pins the versions installed by `npm ci`. The table reflects the lockfile when this documentation was written: update it alongside dependency changes.

| Component | Installed version / configuration |
| --- | --- |
| Application | `1.0.1` in `package.json` and `app.json` |
| Node.js | Major version `22` for development and GitHub Actions; [.nvmrc](../.nvmrc) |
| Expo | SDK 54, package `54.0.36` (range `~54.0.35`) |
| React / React DOM | `19.1.0` |
| React Native | `0.81.5`, New Architecture enabled |
| React Native Web | `0.21.2` |
| Expo Router | `6.0.24`, typed routes enabled |
| TypeScript | `5.9.3`, strict mode, `@/*` alias pointing to the repository root |
| Storage | `expo-sqlite` `16.0.10` and the `localStorage` API |
| Animation | Declared versions: Reanimated `~4.1.1` and Worklets `0.5.1` |
| Quality | ESLint `9.39.5`, `eslint-config-expo`, `tsx` `4.23.11`, and `node:test` |
| PWA | Workbox CLI `7.4.1`, manifest, and service worker |
| Delivery | EAS Hosting; EAS CLI `>= 21.7.0` in `eas.json`, with `latest` used by the workflow |

Read the [exact SDK 54 documentation](https://docs.expo.dev/versions/v54.0.0/) before changing Expo code. The SDK specifies Node 20.19.x as its minimum, but this repository uses Node 22 to match its EAS deployment. The repository does not pin Node/npm patch versions or the EAS version resolved by `latest`.

For an Expo dependency, use `npx expo install <package>` to select a version compatible with the SDK. Commit manifest and lockfile changes together; avoid implicitly upgrading the SDK while making an unrelated fix.

## Structure and data flow

| Path | Role |
| --- | --- |
| `app/_layout.tsx` | Theme and observation providers, root navigation |
| `app/(tabs)/` | Collection, journal, and settings |
| `app/target/[targetId].tsx` | License plate details and observation history |
| `app/+html.tsx` | Web HTML document, manifest, and service worker registration |
| `context/observations.tsx` | Reading, adding, deleting, and persisting journal entries |
| `data/targets.ts` | Static catalog of departments and countries |
| `lib/` | Types and functions for formatting, search, progress, and theme preference |
| `components/`, `hooks/`, `constants/` | Shared UI, platform variants, and colors |
| `public/`, `assets/` | PWA manifest, assets copied during the build, and images |
| `tests/` | Tests for the catalog, search, progress, theme, and contrast |
| `workbox-config.cjs` | Service worker precaching, activation, and offline navigation |
| `.github/workflows/` | Validation and deployment after a push to `main` |
| `.agents/skills/release-production/` | Release procedure for an agent |

The application entry point is `expo-router/entry`. Screens read the catalog and call `useObservations()`. The provider serializes observations as JSON under `plated.observations.v1`, then updates React state. The `expo-sqlite/localStorage/install` import provides the storage API on mobile; the web uses browser storage. The theme preference is stored separately under `plated.theme-preference`.

There is no remote API or shared database to start, migrate, or seed. Development, preview, and production URLs have separate web storage. Preserve compatibility with existing data when changing storage keys or formats.

Components use React Native and styles defined in code. Files ending in `.web.tsx` and `.ios.tsx` contain platform variants. The React Compiler is enabled in `app.json`; native directories are generated and ignored by Git.

## Installation and startup

From the root of the clone:

```bash
nvm install
nvm use
npm ci
npm run web
```

`nvm` is optional if Node 22 is already installed. `npm ci` requires npm registry access and replaces `node_modules` using the lockfile. No application environment variables are required; `EXPO_TOKEN` is used for delivery, not development.

### Mobile

- `npm start` starts Expo and displays the QR code; the device and development machine must be able to reach each other over the network.
- Expo Go must support **SDK 54**. Check the versions available at [expo.dev/go](https://expo.dev/go); do not assume the current App Store version supports this older SDK.
- `npm run ios` opens the configured iOS target (the simulator requires macOS and Xcode). `npm run android` requires an Android Studio emulator or a device accessible through ADB.
- If Expo Go is unsuitable, build locally with `npx expo run:ios` or `npx expo run:android` after installing the native tools [described by Expo](https://docs.expo.dev/get-started/set-up-your-environment/). These commands generate native projects; do not commit them. This repository currently has neither an `expo-dev-client` dependency nor an EAS `development` profile.

The EAS `preview` and `production` profiles are described in [the deployment guide](deployment.md). They are not required to test the web version.

### Local web build and PWA

```bash
npm run build:web
npx --yes serve@14 dist --listen 4173
```

The `serve` command downloads a utility for this task; it is not a project dependency. Open `http://localhost:4173` to test the exported files, manifest, and service worker. `npm run web` serves development mode and does not generate `dist/sw.js`.

For PWA changes, check installation, an offline reload after a successful first load, and the update banner after serving a new build from the same origin. If an old service worker hides changes, unregister it and clear its cache in browser developer tools; avoid clearing `localStorage`, which contains the journal.

### Checks and troubleshooting

```bash
npm run typecheck
npm test
npm run lint
npm run build:web
git diff --check
```

Existing tests cover pure logic, not a full UI session or actual persistence on a device. Also test the affected user flow: adding an observation, reloading, viewing the journal, or changing the theme, as appropriate.

If the Metro cache is inconsistent, use `npx expo start --clear`. To diagnose incompatible Expo dependencies, use `npx expo install --check` and inspect the result before changing versions. Do not run `npm run reset-project` to repair an installation: this script moves existing screens and creates a new skeleton.

## Agent setup

1. Read [AGENTS.md](../AGENTS.md), [CONTRIBUTING.md](../CONTRIBUTING.md), and the configuration files; inspect `git status` and preserve existing changes.
2. Create the working branch from an up-to-date `origin/main`, or resume an existing dedicated branch.
3. Select Node 22, run `npm ci`, then run checks appropriate to the change. In a headless environment, tests, typechecking, linting, and the web build require neither a simulator nor Expo credentials.
4. To inspect the UI without automatically opening a browser, use `CI=1 npx expo start --web --localhost --port 8081`, then connect the browser tool to the displayed URL. Stop the server after verification.
5. Read the results before preparing the PR; explicitly report commands blocked by network access or platforms that were not tested. A sandbox may require separate permissions to install dependencies, open a port, or write to `.git`.

Preparing a PR ends with a reviewable PR. The release procedure only applies when delivery is requested.

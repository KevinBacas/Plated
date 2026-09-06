# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# Repository context and local setup

- Read `README.md`, `CONTRIBUTING.md`, and `docs/development.md` before making changes. Read `docs/deployment.md` for delivery work.
- Plated is an Expo SDK 54 / React 19 / React Native 0.81 application for iOS, Android, and a static web PWA. Check `package.json` and `package-lock.json` for exact dependency versions.
- Use Node.js 22 (`.nvmrc`, matching production CI) and npm. Install with `npm ci`; start web development with `npm run web`. No application secrets, backend, or database service are needed locally.
- Routes live in `app/`, shared UI in `components/`, the catalog in `data/targets.ts`, and observation state/persistence in `context/observations.tsx`. Preserve existing local data: browser localStorage on web, the expo-sqlite localStorage implementation on native.
- Inspect the current branch and working tree first. Preserve existing changes. Never run `npm run reset-project` as an installation or repair step.

# Documentation language

- Write repository documentation, skills, PR titles and descriptions, and release notes in English.

# Branching workflow

- Treat `main` as the only permanent branch and as the production branch. Do not create permanent `develop`, `staging`, or `release` branches.
- Never commit feature work directly to `main`. Start each change from an up-to-date `main` on a short-lived branch named `feat/<topic>`, `fix/<topic>`, or `docs/<topic>`.
- Keep each branch focused on one independently testable change. Run the relevant tests and checks before proposing it.
- Merge validated work into `main` through a pull request. Do not merge when required checks fail.
- Delete temporary branches after they are merged. Use commits or tags on `main` to identify deployments and releases.
- Handle urgent production fixes with the same workflow on a short-lived `fix/<topic>` branch; do not bypass validation.

# Validation

- For application changes, run `npm run typecheck`, `npm test`, `npm run lint`, `npm run build:web`, and `git diff --check`. For documentation-only changes, verify affected paths, versions, links, and commands plus `git diff --check`.
- Validate changed user flows on the affected platform. Unit tests cover pure logic; a web build does not prove native or PWA update behavior.
- `.github/workflows/pr-ci.yml` runs the `PR validation` check on PRs targeting `main`: whitespace, TypeScript, unit tests, lint, web build, and PWA output. Wait for it to pass before merging; report local results and any unperformed platform checks in the PR.
- Keep package and lockfile changes together. Use `npx expo install` for Expo-compatible dependencies. Do not commit generated `dist/`, `.expo/`, `expo-env.d.ts`, `ios/`, or `android/`.

# Deployment and releases

- `.github/workflows/deploy-production.yml` validates and deploys the web app to EAS Hosting after every push to `main`, using the GitHub Actions secret `EXPO_TOKEN`.
- Preparing a PR does not include merging it or publishing a release. For a requested production release, follow `.agents/skills/release-production/SKILL.md` and `docs/deployment.md` within the user's authorized scope.
- Version changes also go through a temporary branch and PR. Keep `app.json`, `package.json`, and root package-lock metadata aligned.
- After an authorized merge, follow the deployment for the exact merged SHA; avoid a duplicate manual deployment while CI is running. Create a version tag/release only after verifying the deployment.
- Identify the live version by its successfully deployed SHA and immutable EAS URL. `main` may be ahead while deployment is pending or failed. Never tag an unverified deployment or overwrite an existing tag.

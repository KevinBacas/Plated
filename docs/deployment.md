# Deployment and releases

## Target and configuration

Automatic delivery targets the **web PWA on EAS Hosting**. [app.json](../app.json) links the project to Expo account `kevinbacas`, slug `Plated`, project `a42b4d2a-b6d5-4eca-a110-1932aadc5c53`. Find deployments and URLs in the Hosting section of the [Expo project](https://expo.dev/accounts/kevinbacas/projects/Plated).

`web.output` is set to `static`. `npm run build:web` runs the Expo export followed by Workbox and produces `dist/`, including `index.html`, `manifest.json`, and `sw.js`. Do not replace this command with only the Expo export: the PWA would lose service worker generation.

## Automatic production deployment

The [Deploy production](../.github/workflows/deploy-production.yml) workflow runs on every push to `main`, including merges of documentation PRs. It uses Ubuntu, Node 22, and a `production` concurrency group with `cancel-in-progress: false` to avoid interrupting a running deployment.

The job performs these steps:

1. Check out the commit and install dependencies with `npm ci`.
2. Configure EAS CLI (`latest`) through `expo/expo-github-action@v8` and `EXPO_TOKEN`.
3. Run `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build:web`.
4. Run `eas deploy --prod --non-interactive` only if the previous steps succeed.

The deployment workflow does not run on PRs or create GitHub tags or releases. The separate [PR CI](../.github/workflows/pr-ci.yml) workflow validates PRs without Expo secrets or deployment access; the [contribution guide](../CONTRIBUTING.md) explains how to make its check mandatory. Production repeats the application checks on the merged commit before publishing. A successful merge does not prove that deployment succeeded.

### Initial access setup

A maintainer with access to the Expo project and repository secrets must:

1. Check that Hosting is initialized for this project and its subdomain is selected before the first non-interactive deployment.
2. Create an Expo personal access token for an account authorized to deploy this project.
3. Add the token to the GitHub repository under **Settings → Secrets and variables → Actions → New repository secret**, using the name `EXPO_TOKEN`.
4. Follow the first `Deploy production` run and verify the returned URLs.

The secret is passed to the Expo action, which configures authentication for the rest of the job. Never put it in `app.json`, an `EXPO_PUBLIC_*` variable, a committed file, or PR notes. The current workflow does not declare a GitHub environment with manual approval; merging into `main` authorizes the deployment.

## Verifying a delivery

From a machine with authenticated GitHub CLI, replace the placeholders below with observed values:

```bash
gh run list --workflow deploy-production.yml --commit <sha> --limit 5
gh run view <run-id>
gh run view <run-id> --log-failed
```

The last command is for diagnosing a failure. Associate the successful run's SHA with the deployment ID and immutable URL printed by EAS. Check that URL and the production alias, using a unique query parameter to avoid a stale response:

```bash
curl --fail --silent --show-error -o /dev/null -w '%{http_code}\n' 'https://<deployment-url>/?check=<unique-id>'
curl --fail --silent --show-error -o /dev/null -w '%{http_code}\n' 'https://<production-url>/?check=<unique-id>'
curl --head --fail 'https://<production-url>/sw.js'
```

Expect a `200` status for the pages, and check the collection, journal, settings, and PWA update flow in the browser. An HTTP response alone does not validate these interactions. Record the SHA, run, URLs, and checks performed in the release when a versioned release is requested.

## Preview deployments and recovery

For a requested web preview, from a validated branch and with an authorized Expo account:

```bash
npm run build:web
npx --yes eas-cli@latest whoami
npx --yes eas-cli@latest deploy --non-interactive
```

Start a local session with `npx --yes eas-cli@latest login`. The `--prod` option is reserved for production; deployment without that option provides a preview URL. Initial Hosting setup may require an interactive session. See [EAS deployments and aliases](https://docs.expo.dev/eas/hosting/deployments-and-aliases/).

If CI fails before publishing, fix the code through a PR or repair access according to the diagnosis. To retry a transient failure for the **same SHA**, first check that it is still the commit to deliver and that no newer deployment has replaced it, then use `gh run rerun <run-id> --failed`. The workflow does not provide a manual `workflow_dispatch` trigger.

If EAS has published but a later check fails, inspect Hosting before retrying: a new deployment is not automatically necessary. Avoid manually publishing the same commit while GitHub Actions is deploying it.

## Rollback

Identify a previously verified deployment, retain its ID/SHA/URL, and check that no running production job will immediately overwrite the rollback. For an authorized production restore:

```bash
npx --yes eas-cli@latest deploy:alias --prod --id <known-good-deployment-id>
```

This command reassigns the alias to an existing deployment without rebuilding the code. Then verify the alias and PWA. Fix or revert the faulty change on a `fix/<topic>` branch through a PR so subsequent merges do not reintroduce the problem. Do not rewrite `main` or move existing tags. The promotion syntax is described in the [EAS documentation](https://docs.expo.dev/eas/hosting/deployments-and-aliases/).

## Versions and GitHub releases

Deploying after every merge does not necessarily require a new version number. When a release is requested:

1. Choose an unused SemVer version. Update `expo.version` in `app.json`, `version` in `package.json`, and the root metadata in `package-lock.json` together, on a temporary branch through a PR.
2. Validate and merge the PR within the scope of the delivery authorization; record the **merge SHA**, which may differ from the branch SHA.
3. Wait for the corresponding GitHub Actions deployment and verify production before tagging.
4. Create the release on that exact SHA, with English notes written to a file:

```bash
gh release create <tag-vX.Y.Z> --target <deployed-sha> --title <title> --notes-file <notes-file>
```

First verify that the tag and release do not exist locally or remotely. Then verify the release with `gh release view <tag-vX.Y.Z>`, fetch the tags, and check the SHA with `git rev-list -n 1 <tag-vX.Y.Z>`. If only release creation fails, resume that step without redeploying. The [release skill](../.agents/skills/release-production/SKILL.md) guides agents through the same procedure.

## Caching and PWA updates

Workbox precaches resources from `dist/`, immediately activates the new service worker, and cleans up old caches. `app/+html.tsx` checks for updates on load and when the application returns to the foreground; the web banner offers to reload when a new version takes control.

[public/_headers](../public/_headers) defines rules for hosts supporting the Netlify/Cloudflare Pages format: no caching for `sw.js`, revalidation of HTML/the manifest, and long-lived caching for hashed bundles. The presence of this file does not prove EAS applies those directives. Inspect actual HTTP headers and the [EAS caching policy](https://docs.expo.dev/eas/hosting/reference/caching/) before diagnosing a stuck update. Do not clear the user's browser storage to force an update: it contains their observations.

## Native builds

[eas.json](../eas.json) defines two **native build** profiles, independent of the web alias: `preview` for internal distribution and `production`, both with automatic build number increments. Build versions are managed remotely (`appVersionSource: remote`).

For an explicitly requested iOS build, with access and signing credentials configured:

```bash
npx --yes eas-cli@latest build --platform ios --profile preview
# Or for a binary intended for production distribution:
npx --yes eas-cli@latest build --platform ios --profile production
```

The iOS identifier is `com.kevinbacas.plated`. The `android.package` identifier is not yet defined; configure it before the first Android delivery. No store publication workflow, `submit` profile, or EAS Update mechanism is configured in this repository. A native build is not a store submission, and web CI does not validate native binaries.

---
name: release-production
description: "Deliver a Plated web release through a pull request to main, follow the automatic EAS Hosting deployment, verify production, then create the GitHub tag and release. Use when the user requests a production delivery or release."
---

# Release Production

Run from the repository root. Read `AGENTS.md`, `CONTRIBUTING.md`, `docs/deployment.md`, and the [Expo SDK 54 documentation](https://docs.expo.dev/versions/v54.0.0/). The deployment guide is the reference procedure; this skill coordinates its execution and release verification.

An explicit release request authorizes the operations needed for that delivery, subject to branch rules and environment permissions. A request limited to preparing a PR ends at the PR. Do not commit or push directly to `main`; do not bypass required reviews or checks.

## 1. Prepare the version on a temporary branch

1. Inspect the branch, changes, and GitHub authentication. Preserve changes outside the scope of the release. Use Node 22 and `npm ci` as described in the development guide.
2. Run `git fetch origin --tags`. For a new change, create a short-lived `feat/<topic>`, `fix/<topic>`, or `docs/<topic>` branch from an up-to-date `origin/main`. Resume an existing dedicated branch if it already contains the work to deliver.
3. The `.agents/skills/release-production/scripts/release-context.sh` script can provide additional diagnostics. It is read-only with respect to remote services, but launches EAS CLI through `npx` and may require a download. Missing local Expo authentication does not block CI delivery if the GitHub secret works; manual EAS operations require their own access.
4. Use the explicitly requested version. Otherwise, use `v<expo.version>` if no SemVer tag exists, or increment the patch of the latest stable tag. Announce a minor or major bump when the scope justifies it. Check that the version does not exist as a local/remote tag or GitHub release.
5. Align the selected version in `app.json`, `package.json`, and the root metadata in `package-lock.json` on the branch. If the already-merged commit has the correct version, do not create an empty commit or unnecessary PR.

## 2. Validate and prepare release notes

```bash
npm run typecheck
npm test
npm run lint
npm run build:web
git diff --check
```

Check `dist/index.html`, `dist/manifest.json`, and `dist/sw.js`. Fix errors before continuing. Unit tests do not replace verifying the affected flow in the browser.

Write release notes in English from the diff and commits since the latest stable tag. Use only the relevant sections among New features, Improvements, Fixes, and Validation. Mention only confirmed changes and checks. Save the notes to a file to pass with `--notes-file`.

## 3. Use a pull request

1. Inspect `git status`, `git diff`, and `git diff --cached`. Stage only relevant files with `git add -- <explicit-paths>`, then commit on the temporary branch.
2. Push that branch, open or update its PR targeting `main`, and record validation results. The repository currently has no PR workflow; production workflow checks run after merging.
3. When delivery includes merging and the PR is validated, respect branch protections and all required checks. If a required review is missing or a check fails, report the specific step to resolve; do not force the merge.
4. Record the exact merged commit SHA and fetch remote references. Use this SHA for the remaining steps, not the branch head SHA before merging. Delete the temporary branch after merging, preserving any remaining local work.

## 4. Follow the automatic deployment

Each push to `main` triggers `.github/workflows/deploy-production.yml`. Find the run corresponding to the merge SHA and use GitHub tools to wait for it to succeed. Do not run a second `eas deploy --prod` while CI is publishing the same commit.

Keep the run ID, SHA, EAS deployment ID, immutable URL, and production URL. Verify HTTP responses and the web/PWA flows described in `docs/deployment.md`. Use a unique query parameter for the alias. If a later commit has already replaced the alias, distinguish the target SHA's deployment from the version currently live; do not claim the former is still production.

If CI or verification fails, do not create a new tag/release. Diagnose the current state and perform only the necessary recovery described in the deployment guide. Retrying an old run can put an old commit back into production: check for newer deployments before retrying. A rollback uses a previously validated deployment and does not rewrite `main`.

## 5. Create and verify the GitHub release

Only after verifying the deployment:

1. Check again that the tag and release do not exist. Never overwrite history, force a push, or reuse an existing tag for another version.
2. Create a published, non-draft release targeting the deployed SHA:

```bash
gh release create <tag> --target <deployed-sha> --title <title> --notes-file <notes-file>
```

3. This command creates the remote tag if it is absent; do not add `git push --tags`.
4. Verify with `gh release view <tag>`, then `git fetch --tags origin` and `git rev-list -n 1 <tag>`, that the release exists and its tag points to the exact verified SHA.

If this step fails after deployment, inspect remote objects before retrying. Resume only the missing creation or verification step, without redeploying or deleting an existing release.

## 6. Report the result

Provide the version, SHA, PR, run, production/deployment/release URLs, checks performed, and any limitations. Include the published notes without inventing results. Only report a release as complete when merging, deployment, verification, and the tag/release are confirmed.

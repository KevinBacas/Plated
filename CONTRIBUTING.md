# Contributing to Plated

## Branches

The repository follows a simple GitHub Flow: `main` is the only permanent branch and the production branch. There are no permanent `develop`, `staging`, or `release` branches. An optional preview environment corresponds to a deployment, not a new permanent branch.

From a clean working tree:

```bash
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c docs/local-setup
```

Use `feat/<topic>` for a feature, `fix/<topic>` for a fix, or `docs/<topic>` for documentation. Keep each branch short-lived and focused on one independently testable change. If the working tree already contains changes, inspect and preserve them before switching branches.

Never commit features, fixes, or release preparation directly to `main`. Urgent fixes follow the same process on `fix/<topic>`. Resolve local divergence on the working branch without rewriting the history of `main`.

## Validation and pull requests

1. Set up the environment described in [the development guide](docs/development.md).
2. For application changes, run the checks below and verify the affected user flow on the relevant platform. For documentation-only changes, check affected paths, local links, versions, and commands, as well as `git diff --check`; run any commands whose behavior has changed.
3. Inspect the diff, stage the relevant files explicitly, and create a descriptive commit, such as `docs: document local setup`.
4. Push the branch and open a PR targeting `main`, describing the expected outcome, checks actually performed, and remaining limitations.

```bash
npm run typecheck
npm test
npm run lint
npm run build:web
git diff --check
```

Example of publishing the documentation branch:

```bash
git push -u origin docs/local-setup
gh pr create --base main --head docs/local-setup
```

`gh` and GitHub authentication are only needed for GitHub operations; the web interface can also be used to open a PR. Do not commit generated files (`dist/`, `.expo/`, `expo-env.d.ts`, `ios/`, `android/`) or secrets.

Write repository documentation, skills, PR titles and descriptions, and release notes in English.

## Merging and protecting main

Only merge a validated PR with all required checks passing. Delete the temporary branch after merging. Do not enable auto-merge or merge a PR when the request only covers preparing it.

### Pull request CI

[PR CI](.github/workflows/pr-ci.yml) runs when a PR targeting `main` is opened, updated with new commits, or reopened. It also runs for drafts and documentation-only PRs, with no path filters, so its required check is always reported. New runs cancel older runs for the same PR without affecting production deployments.

The `PR validation` job checks GitHub's test merge commit against its first parent (the base branch) for whitespace errors, then uses Node 22 from `.nvmrc` and `npm ci` with an npm download cache. Separate steps run TypeScript, unit tests, ESLint, the web build, and checks that `dist/index.html`, `dist/manifest.json`, and `dist/sw.js` are non-empty. Any failed step fails the job; the run has a 15-minute timeout.

The workflow uses `pull_request`, a read-only `GITHUB_TOKEN`, and checkout without persisted credentials. It has no Expo authentication or deployment step and needs no repository secrets, including for fork PRs. GitHub may still require maintainer approval before running a fork contributor's workflow. Resolve merge conflicts before expecting checks: GitHub does not run `pull_request` workflows for conflicting PRs.

Open the PR's Checks tab or run `gh pr checks <pr-number>` to inspect the result. For a transient CI failure, inspect the failed step before rerunning it from GitHub Actions. Keep manual platform validation in the PR: this job does not build native binaries or test browser interactions.

### Required-check setup

After the first successful CI run, configure a branch protection rule or ruleset targeting `main` in GitHub. Require a PR and the **`PR validation`** status check from GitHub Actions; require the branch to be up to date before merging so validation includes the current base branch. Keep this job name stable because branch rules reference it.

Branch protection is configured in GitHub, outside the repository files. Also require a review and prevent force pushes and deletion of `main`. Do not require the deployment job for PRs, since [Deploy production](.github/workflows/deploy-production.yml) only runs on a push to `main`, **after merging**. Adding this workflow does not itself enable remote branch rules. If a merge queue is introduced later, add a `merge_group` trigger before requiring this check in the queue.

Each merge triggers the [web deployment](docs/deployment.md). `main` may temporarily be ahead of production while deployment is running or after a failure: identify production by the SHA of the successful deployment. Tags named `vMAJOR.MINOR.PATCH` and GitHub releases identify commits on `main` whose deployment has been verified.

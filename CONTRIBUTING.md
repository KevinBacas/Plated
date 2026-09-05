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

**Current repository CI:** the only versioned workflow is [Deploy production](.github/workflows/deploy-production.yml), triggered by a `push` to `main`. It validates and deploys **after merging**. No `pull_request` workflow currently provides checks before merging: record local validation results in the PR and do not treat the absence of checks as automatic validation.

Branch protection is configured in GitHub, outside the repository files. The recommended configuration requires a PR and a review, and prevents force pushes and deletion of `main`. If PR CI is added, make its checks required before merging. Do not require the deployment job for PRs, since it only runs on `main`. These recommendations do not imply that the remote rules are already enabled.

Each merge triggers the [web deployment](docs/deployment.md). `main` may temporarily be ahead of production while deployment is running or after a failure: identify production by the SHA of the successful deployment. Tags named `vMAJOR.MINOR.PATCH` and GitHub releases identify commits on `main` whose deployment has been verified.

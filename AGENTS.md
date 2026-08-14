# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# Branching workflow

- Treat `main` as the only permanent branch and as the production branch. Do not create permanent `develop`, `staging`, or `release` branches.
- Never commit feature work directly to `main`. Start each change from an up-to-date `main` on a short-lived branch named `feat/<topic>`, `fix/<topic>`, or `docs/<topic>`.
- Keep each branch focused on one independently testable change. Run the relevant tests and checks before proposing it.
- Merge validated work into `main` through a pull request. Do not merge when required checks fail.
- Delete temporary branches after they are merged. Use commits or tags on `main` to identify deployments and releases.
- Handle urgent production fixes with the same workflow on a short-lived `fix/<topic>` branch; do not bypass validation.

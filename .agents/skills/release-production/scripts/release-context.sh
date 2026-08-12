#!/usr/bin/env bash

set -eu

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

echo "Repository: $repo_root"
echo "Branch: $(git branch --show-current)"
echo "HEAD: $(git rev-parse --short=12 HEAD)"
echo "Expo version: $(node -p "require('./app.json').expo.version")"

echo
echo "Working tree:"
git status --short --branch

echo
echo "Latest SemVer tag:"
git tag --list 'v[0-9]*.[0-9]*.[0-9]*' --sort=-version:refname | head -n 1

echo
echo "Commits since latest SemVer tag:"
latest_tag="$(git tag --list 'v[0-9]*.[0-9]*.[0-9]*' --sort=-version:refname | head -n 1)"
if [ -n "$latest_tag" ]; then
  git log --oneline "$latest_tag"..HEAD
else
  git log --oneline --max-count=20
fi

echo
echo "Required tools:"
for command_name in node npm npx git gh curl; do
  if command -v "$command_name" >/dev/null 2>&1; then
    echo "OK  $command_name"
  else
    echo "MISSING  $command_name"
  fi
done

echo
echo "GitHub authentication:"
gh auth status || true

echo
echo "Expo authentication:"
npx --yes eas-cli@latest whoami || true

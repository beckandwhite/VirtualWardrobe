#!/usr/bin/env bash
set -Eeuo pipefail

: "${REPO_URL:?REPO_URL must be set to the GitHub repository URL}"
: "${RUNNER_TOKEN:?RUNNER_TOKEN must be supplied at runtime and must never be committed}"

runner_name="${RUNNER_NAME:-virtualwardrobe-${HOSTNAME}}"
runner_labels="${RUNNER_LABELS:-self-hosted,linux,x64,virtualwardrobe-private}"
runner_workdir="${RUNNER_WORKDIR:-/home/runner/_work}"

cleanup() {
  if [[ -f .runner ]]; then
    ./config.sh remove --unattended --token "${RUNNER_TOKEN}" || true
  fi
}
trap cleanup EXIT INT TERM

./config.sh \
  --unattended \
  --ephemeral \
  --replace \
  --url "${REPO_URL}" \
  --token "${RUNNER_TOKEN}" \
  --name "${runner_name}" \
  --labels "${runner_labels}" \
  --work "${runner_workdir}"

exec ./run.sh
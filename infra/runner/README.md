# Private GitHub Actions runner

This directory defines the optional M5-3 runner path. M5-1 and M5-2 remain the
default GitHub-hosted CI path; this runner is not required by any repository
workflow except the explicitly dispatched smoke job.

## Supported profile

- Host: a maintained Linux host with Docker Engine or Docker Desktop, 2 vCPU,
  4 GB RAM, and persistent storage for the runner work volume.
- Docker: Compose v2 and an engine supporting `cap_drop`, `read_only`, and
  `no-new-privileges`.
- Image: Ubuntu 24.04 with GitHub Actions runner `2.328.0`, built from the
  pinned `Dockerfile` argument.
- Runner labels: `self-hosted`, `linux`, `x64`, and
  `virtualwardrobe-private`.
- Egress: outbound HTTPS to GitHub and the package registries needed by a job;
  inbound connections are not required. Apply host or network firewall rules
  if the deployment needs a narrower allow-list.
- Isolation: the container runs as the unprivileged `runner` user, drops all
  capabilities, enables `no-new-privileges`, has a read-only root filesystem,
  and does not mount the Docker socket. Jobs must not require Docker-in-Docker.

## One disposable runner

Create a short-lived repository runner token in GitHub under **Settings >
Actions > Runners > New self-hosted runner**. Do not put it in a file tracked
by Git or in `docker-compose.yml`.

PowerShell:

```powershell
$env:REPO_URL = 'https://github.com/beckandwhite/VirtualWardrobe'
$env:RUNNER_TOKEN = '<paste-token-in-your-local-shell-only>'
docker compose -f infra/runner/docker-compose.yml up --build --abort-on-container-exit --exit-code-from runner
Remove-Item Env:RUNNER_TOKEN
```

The container registers one **ephemeral** runner, executes one job, and removes
its registration on exit. Stop it with `docker compose ... down` and remove the
named `runner-work` volume when the work directory must be destroyed.

## Labeled smoke job

The repository contains `runner-smoke.yml`, which is dispatch-only and targets
the `virtualwardrobe-private` label. With the container running, dispatch it
from the Actions tab or with:

```powershell
gh workflow run runner-smoke.yml --repo beckandwhite/VirtualWardrobe
gh run watch --repo beckandwhite/VirtualWardrobe
```

The job checks the runner labels, OS, architecture, and the repository working
directory, then exits. The runner is ephemeral, so the next smoke run needs a
new registration token and a new container.

For an offline preflight that never contacts GitHub or uses a token:

```powershell
./infra/runner/smoke.ps1
```

## Maintenance and teardown

Keep the runner version and base image current, rebuild after dependency or
workflow changes, and review GitHub's self-hosted runner security advisories.
Treat every job as trusted code: private runners can expose their host and
network to workflows that reach them. Never use this runner for untrusted pull
requests from forks. Revoke the runner token after use, remove the container,
and delete the named work volume for full teardown.

The setup intentionally does not install a service, create a host user, mount
the Docker socket, or register a persistent runner. Those are operator-level
choices requiring a separately approved hosting and security decision.
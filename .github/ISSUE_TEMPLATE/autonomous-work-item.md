---
name: Autonomous work item
about: A groomed item for the "Ready to pickup" column, precise enough for an autonomous agent to execute.
title: "Improve <area>: <short title>"
labels: []
---

**Parent:** #<number or none> · **Depends on:** <#number or none> · **Run order:** <first / after #number>

<!-- Add exactly ONE size label before moving this issue to Ready to pickup:
     size:S = small, precise work · size:M = moderate scope/judgment · size:L = cross-cutting work.
     See Plans/autonomous-sizing.md for the routing guidance. -->

> **Autonomous-run spec.** Follow the steps and scope below. Do only what is listed.
> Run the full [AGENTS.md autonomous run lifecycle](../../AGENTS.md#autonomous-run-lifecycle):
> on pickup move this card to **In Progress** and add your `<run-id>-<model-id>` run label;
> commit, push, and open a PR with `Closes #<this issue>`.
> If an acceptance criterion or step is materially ambiguous, stop and leave the
> issue in **Planning/Grilling** while requesting clarification rather than guessing.

## Goal

<One paragraph: what changes and why. State any feature that does NOT move.>

## Files you may touch

- `path/to/file` (what you may change in it)
- **create** `new/file` (purpose)

Do **NOT** touch <files/areas that are out of bounds for this item>.

## Locked decisions (from grooming)

- <Any decision already made, so the executor does not re-open it.>

## Steps

1. **`file`** — <precise instruction>.
2. <Additional bounded implementation steps>.

## Verify

- <Exact command(s) and the observable result that means success>.

## Close-out (autonomous)

When Verify passes and the PR's CI + required checks are **all green**, the work is ready —
**merge the PR and close this item** (squash-merge, confirm it closed, move the card to **Done**,
drop the run label). If any check is **failing**, do not merge: add the `HUMAN!!!` label, leave the
card in **In Progress**, and stop. See
[AGENTS.md § Autonomous run lifecycle](../../AGENTS.md#autonomous-run-lifecycle) for the exact commands.

## Decision logging (autonomous runs)

GitHub is the source of truth for this issue's scope and status. Record durable
implementation decisions in
[`Plans/00-decisions-and-log.md`](../../Plans/00-decisions-and-log.md), following
its chronological format. Keep execution progress, blockers, and verification
results on this GitHub issue.

## Out of scope

- <Adjacent work that belongs to another item.>

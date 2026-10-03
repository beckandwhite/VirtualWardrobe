# Autonomous Work Sizing (S / M / L)

**Adopted:** 2026-10-03
**Board:** GitHub Project *VirtualWardrobe* → **Status: "Ready to pickup"**

## Purpose

Every work item in the **Ready to pickup** column gets a **size**
that says *which model — and therefore which machine — should pick it up*. This
turns "who runs this?" from a judgment call into a label an autonomous agent can
read for itself.

The model and machine names below are the expected executor tiers, not runtime
models used by VirtualWardrobe. Use the task's scope and ambiguity to assign a
size; do not size an issue based only on the feature's ML/runtime dependencies.

## The scheme

| Size | Model (working name) | Machine | Context | Pick this when… |
|---|---|---|---|---|
| **`size:S`** | Gemma 4 12B | Mac mini M4, 16 GB | standard | The item is small and **precise**: a tight, numbered step list, one or two files, low ambiguity, little design judgment. Mechanical edits and wiring-up-existing-code fit here. |
| **`size:M`** | Qwen3 ~27–30B | 48 GB box (MBP/Mac Pro) | standard | Moderate scope: a handful of files, a new small endpoint, or a change needing **real but bounded judgment** (drag interactions, join logic, redaction). |
| **`size:L`** | Cloud / frontier model | Cloud (limited access) | **>128 K** | Heavy or cross-cutting: many files across layers, multi-phase work, or a task whose context genuinely won't fit smaller — reserve for when S/M can't. |

## How it's applied

- Size lives as a **GitHub label**: `size:S`, `size:M`, or `size:L`, applied to
  the issue. It is visible in `gh issue view <n>` and to any agent that reads
  the issue — so an executor can confirm *"am I the right model for this?"*
  before starting.
- Every item in project **Status: Ready to pickup** should carry exactly one
  size label. Items still in *Ideas* or *Planning/Grilling* do not need a size
  until their scope and acceptance criteria are ready for implementation.
- VirtualWardrobe also has a **Board Status** field. Keep that field consistent
  with the repository workflow in [`AGENTS.md`](../AGENTS.md) (for example,
  **To Do** for work ready to start); it does not replace the project **Status**
  column used for autonomous planning.

## Self-routing rule for an autonomous executor

1. Read the issue and its `size:*` label.
2. If your model tier is **smaller** than the label, **do not start** — leave a
   comment saying so and stop. (A 12B should not attempt a `size:L`.)
3. If it matches (or you're a larger model deliberately taking a smaller item),
   proceed, following the issue's steps exactly.
4. Record durable decisions and deviations using the repository convention below.

## Decision-log convention

GitHub issue bodies are the full work-item specification and operational source
of truth. Update the issue first if its definition changes. Record durable
implementation decisions in the append-only
[`00-decisions-and-log.md`](00-decisions-and-log.md), following its chronological
format; keep concise status and dependencies in the
[`02-product-backlog.md`](02-product-backlog.md). Put execution updates and
blockers on the GitHub issue. If an acceptance criterion remains materially
ambiguous, leave the issue in **Planning/Grilling** and ask for clarification
rather than silently guessing.

## Adding a new autonomous work item

Start from the
[autonomous work-item issue template](../.github/ISSUE_TEMPLATE/autonomous-work-item.md)
and follow the GitHub issue and project workflow in [`AGENTS.md`](../AGENTS.md).
Before moving an issue to **Ready to pickup**, ensure its GitHub body has a
bounded scope, explicit acceptance criteria, verification steps, and any needed
constraints; then apply exactly one `size:*` label and update the concise
backlog summary when its identifier or durable status changes.

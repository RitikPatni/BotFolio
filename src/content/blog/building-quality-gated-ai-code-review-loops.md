---
title: "Building Quality-Gated AI Code Review Loops"
description: "How to implement planner, executor, auditor, and quality-gate loops that keep AI-generated code reviewable before delivery."
date: "2026-08-07"
draft: false
tags:
  - "ai"
  - "code-review"
  - "workflow"
  - "quality"
  - "multi-model"
category: "blog"
---
AI coding agents are fast. They are also wrong often enough that speed without verification becomes a liability. The problem is not generation; it is allowing generated code to receive one cursory pass and land in a repository unchecked.

The fix is a **quality-gated loop**: a small pipeline in which each stage has one job, every handoff is explicit, and nothing reaches a user until an independent gate approves it.

This article covers two practical patterns: one for improving an existing codebase and one for building from a blank canvas.

---

## The two loops

| | **Audit-review loop** | **Complete reviewer loop** |
|---|---|---|
| **When to use** | You already have code and want it reviewed and improved. | You are building something from scratch. |
| **Flow** | Reviewer → Enhancer → Quality gate | Planner → Executor → Auditor → Quality gate |
| **Key difference** | Starts with an existing implementation. | Starts with a plan and a blank canvas. |

The names are deliberately boring. That is useful: the quality comes from the boundaries between stages, not from giving one agent an impressive title.

---

## Pattern 1: Audit-review loop

Use this when the code already exists and you want a focused improvement pass.

### The flow

_Diagram drawn with [Koboyo](https://koboyo.com) — edit the live canvas [here](https://koboyo.com/edit/diagrams-qpkara)._

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://koboyo.com/e/89d777d9-43fa-46c9-b9e6-bab572455650/5f340914-9086-4e02-93cd-6b6cc3820020.svg?theme=dark">
  <img alt="Audit-review loop: Existing code → Reviewer → Enhancer → Quality gate → Approved, or back to Enhancer" src="https://koboyo.com/e/89d777d9-43fa-46c9-b9e6-bab572455650/5f340914-9086-4e02-93cd-6b6cc3820020.svg">
</picture>

### Why separate the roles?

The reviewer is optimised for depth. It should find edge cases, logic errors, missing tests, and violations of the existing design.

The enhancer is optimised for accurate execution. It should not spend its context budget rediscovering the repository or inventing a different solution. It receives a concrete handoff and applies it.

The quality gate is deliberately independent. It gets a fresh view of the result and checks whether the requested change actually works, whether the constraints were respected, and whether the fix introduced a new problem.

The point is not to use three different brands. The point is to prevent the same reasoning process from writing, approving, and rationalising its own work.

### Make the review actionable

A weak review says:

> Fix the error handling.

A useful review gives the enhancer enough information to act without another discovery expedition:

```
ISSUE: Failed requests can leave the cache marked as fresh.
SEVERITY: High
LOCATION: src/cache/refresh.ts, refreshCache()
CHANGE: Move the freshness update after the awaited request succeeds.
VERIFY: Run npm test -- cache/refresh.test.ts
```

The reviewer should provide exact file paths, relevant symbols or line ranges, expected behaviour, and verification commands. The enhancer should not need to run a second search just to understand the assignment.

### The loop budget

Set a hard limit, usually three rounds. If the quality gate keeps rejecting the result, the problem is probably structural: the review missed a constraint, the handoff is ambiguous, or the requested change is larger than the loop can safely handle.

Do not let an automated loop become an endless argument. Stop, surface the unresolved issue, and return to planning.

---

## Pattern 2: Complete reviewer loop

Use this when there is no implementation yet and the work needs more than a quick edit.

### The flow

```
USER TASK
    │
    ▼
┌─────────────────────────────┐
│ ① PLANNER                   │
│                             │  → Clarifies the goal and constraints.
│                             │  → Inspects the repository.
│                             │  → Produces a self-contained handoff.
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ ② EXECUTOR                  │
│                             │  → Receives the handoff.
│                             │  → Applies the changes.
│                             │  → Runs the stated checks.
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ ③ AUDITOR                   │
│                             │  → Compares the result with the plan.
│                             │  → Checks constraints and deliverables.
│                             │  → Reports evidence, not confidence.
└──────────────┬──────────────┘
               │
               ▼
       ┌───────────────┐
       │ ④ QUALITY GATE │
       │               │
       ▼               │
┌──────────────────┐   │
│ APPROVED? → DONE │   │
│ NEEDS WORK? ─────┘   │  → Sends targeted critique to the executor.
└──────────────────┘
```

### The handoff packet

The handoff is the most important artifact in the system. The planner creates it, the executor follows it, and the auditor checks against it.

```text
---HANDOFF PACKET---
GOAL: Add a dark-mode toggle to settings

FILE PATHS (already found):
  src/components/ThemeToggle.astro — new component
  src/layouts/BaseLayout.astro — add toggle to header
  src/styles/theme.scss — add dark-mode variables

CONSTRAINTS:
- Do not modify src/styles/reset.scss — it is canonical.
- Keep light mode as the default; avoid a flash on load.
- Match existing component patterns.

STEPS:
1. Create ThemeToggle.astro with persistence for the selected theme.
2. Add the component to the existing header navigation.
3. Add dark-mode variables without changing light-mode defaults.
4. Run npm run build.
5. Run the relevant component and integration tests.

DELIVERABLES:
- src/components/ThemeToggle.astro
- src/layouts/BaseLayout.astro
- src/styles/theme.scss

VERIFICATION:
- Build passes with zero errors.
- Light mode remains the default.
- The component follows existing project conventions.
---END HANDOFF---
```

A good handoff removes ambiguity before implementation starts. It identifies the files, constraints, sequence, and proof required for completion.

### Why planning includes discovery

Implementation agents are expensive when they spend half their time looking for files, reading command documentation, or guessing at interfaces. The planner should do that discovery once and put the findings in the handoff.

The executor can then spend its context on changing the right things and verifying them. This also makes the work easier to audit: the reviewer can compare the final diff with a concrete plan instead of a vague request.

---

## Implementation with Hermes Agent

The architecture is independent of provider or model brand. Configure your planner, executor, auditor, and quality gate according to the strengths and cost limits of your environment.

### Role-based routing

```bash
# Route delegated implementation work to the executor configuration.
hermes config set delegation.provider <executor-provider>
hermes config set delegation.model <executor-model>
hermes config set delegation.max_iterations 12
```

The main session can handle planning and auditing, while the quality gate can run as a separate one-shot process:

```bash
hermes chat \
  --provider <quality-gate-provider> \
  --model <quality-gate-model> \
  -q "<review prompt>" \
  --quiet
```

The placeholders are intentional. The workflow should survive a provider change without rewriting the engineering process.

### Dispatch the executor

```python
delegate_task(
    goal="Execute the plan from the HANDOFF PACKET",
    context="<complete HANDOFF PACKET>",
    toolsets=["terminal", "file"],
)
```

### Routing table

| Role | Responsibility |
|------|----------------|
| Planner | Clarifies the task, researches the repository, and writes the handoff. |
| Executor | Applies the handoff literally and runs the verification commands. |
| Auditor | Checks the result against the plan and the stated constraints. |
| Quality gate | Provides an independent final verdict with evidence. |

The roles matter more than the labels attached to the tools performing them.

---

## Pitfalls

**Do not let one stage approve its own work.** The quality gate needs a genuinely fresh perspective. It should not inherit the executor's assumptions or treat an implementation summary as proof.

**Do not skip stages because the diff looks good.** The auditor catches plan-level mistakes; the quality gate catches problems that both the planner and executor missed.

**Keep the handoff self-contained.** A delegated executor has no useful context beyond what you provide. Include paths, interfaces, constraints, commands, and acceptance criteria.

**Respect the loop budget.** Three rounds is usually enough. Repeated rejection is a signal to revisit the plan, not permission to keep applying random patches.

**Do not trust self-reports.** "Done" is not evidence. Confirm that the files exist, the tests ran, the build passed, and the resulting behaviour matches the request.

---

## When to use which

- **Existing codebase, want a review?** → Audit-review loop.
- **Building something new?** → Complete reviewer loop.
- **Quick one-off edit?** → Neither. Do not over-engineer it.
- **Trivial change in one file?** → A single pass is enough.

The threshold is simple: if the task has three or more meaningful steps across two or more files, a loop usually earns its overhead. If it is a one-line change, use the shortest reliable path.

---

The core insight is not a particular model or provider. Those will change. It is the pattern: **clear plan → literal execution → independent audit → quality gate**. Each stage has one job, and nothing ships until someone who did not write the code says it is good.

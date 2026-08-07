---
title: "Building Quality-Gated AI Code Review Loops"
description: "How to implement auditor-reviewer and planner-executor-reviewer loops that gate AI-generated code through multiple specialized models before delivery."
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
AI coding agents are fast. They're also wrong — a lot. The problem isn't speed; it's that generated code usually gets one pass through a single model and lands in your repo unchecked.

The fix is a **quality-gated loop**: multiple specialized models arranged in a pipeline where each phase has one job, and nothing reaches the user until a dedicated reviewer approves it.

Here are the two patterns I use daily, with the exact implementation.

---

## The Two Loops

| | **Audit-Review Loop** | **Complete Reviewer Loop** |
|---|---|---|
| **When to use** | You already have code. You want it reviewed and enhanced. | You're building something from scratch. |
| **Flow** | Reviewer → Enhancer → Quality Gate | Planner → Executor → Auditor → Quality Gate |
| **Key difference** | Starts with existing code. No planner needed. | Starts with a blank canvas. Planner creates the blueprint first. |

---

## Pattern 1: Audit-Review Loop (for existing code)

### The Flow

```
EXISTING CODE
    │
    ▼
┌─────────────────────────┐
│ ① REVIEWER (strong model) │  → Deep analysis. Finds issues, gaps, bugs.
│    DeepSeek V4 Pro        │  → Produces ISSUES LIST with severity levels.
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ ② ENHANCER (fast model)   │  → Receives issues list.
│    DeepSeek V4 Flash      │  → Implements fixes via delegate_task.
│    (delegate_task)        │  → Returns patch set.
└──────────┬──────────────┘
           │
           ▼
       ┌───────────────┐
       │ ③ QUALITY LOOP │
       │               │
       ▼               │
┌──────────────────┐   │
│ GATE (Kimi K2.7)  │   │  → Spawned as one-shot `hermes chat`
│                   │   │  → APPROVED → DONE
│ APPROVED? → DONE  │   │  → NEEDS MORE WORK → loop back to ①
│ NEEDS MORE WORK?──┘   │     with Kimi's new issues list
└──────────────────┘
```

### Why three different models?

- **Reviewer (V4 Pro)**: Strong reasoning. Can spot edge cases, logic errors, and consistency violations that a fast model misses.
- **Enhancer (V4 Flash)**: Cheap and fast. Just applies patches, no thinking required. The issues list already tells it exactly what to do.
- **Quality Gate (Kimi K2.7 Code)**: A fresh pair of eyes. Different training, different biases. Catches things both the reviewer and enhancer missed.

### Key insight: the reviewer must pre-research

The reviewer phase doesn't just say "fix the error handling." It gives the enhancer **exact file paths, line numbers, and old_string/new_string pairs**. The enhancer should never run `find` or `grep` — all discovery is done by the stronger model upfront.

### The Loop

Max 3 rounds. If Kimi keeps rejecting, something is structurally wrong. Break out and deliver with a note.

---

## Pattern 2: Complete Reviewer Loop (for building from scratch)

### The Flow

```
USER TASK
    │
    ▼
┌─────────────────────────────┐
│ ① PLANNER                     │
│    DeepSeek V4 Pro            │  ← Analyzes task, produces HANDOFF PACKET
│    → goal, constraints, steps │
│    → pre-researched file paths│
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ ② EXECUTOR                    │
│    DeepSeek V4 Flash          │  ← delegate_task subagent
│    → receives handoff packet  │  → applies patches, runs verify commands
│    → zero discovery allowed   │  → returns execution summary
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ ③ AUDITOR                     │
│    DeepSeek V4 Pro            │  ← Checks execution vs plan
│    → plan compliance          │  → constraint compliance
│    → deliverable check        │  → produces audit report + verdict
└──────────────┬──────────────┘
               │
               ▼
       ┌───────────────┐
       │ ④ REVIEW LOOP │
       │               │
       ▼               │
┌──────────────────┐   │
│ REVIEWER          │   │
│ Kimi K2.7 Code    │   │  ← Spawned as one-shot `hermes chat`
│                   │   │
│ APPROVED? → DONE  │   │
│ NEEDS IMPROVEMENT?│───┘  (loop back to ② with Kimi's critique)
└──────────────────┘
```

### The Handoff Packet

This is the most important artifact. The planner creates it, the executor executes it, the auditor checks against it.

Format:

```
---HANDOFF PACKET---
GOAL: Add dark mode toggle to settings

FILE PATHS (already found):
  src/components/ThemeToggle.astro — new component
  src/layouts/BaseLayout.astro — add toggle to header
  src/styles/theme.scss — add dark mode variables

CONSTRAINTS:
- Do NOT modify src/styles/reset.scss — it's canonical
- Keep light mode as default (no flash on load)
- Match existing component patterns (UiIcon, SocialIcon)

STEPS:
1. CREATE src/components/ThemeToggle.astro — Astro component with <script> island for theme persistence
2. PATCH src/layouts/BaseLayout.astro — add <ThemeToggle /> inside header <nav>
3. PATCH src/styles/theme.scss — add :root[data-theme="dark"] block with inverted colors
4. VERIFY: npm run build (no errors)
5. VERIFY: grep -r "data-theme" dist/ (confirms output)

DELIVERABLES:
- src/components/ThemeToggle.astro (NEW)
- src/layouts/BaseLayout.astro (PATCHED)
- src/styles/theme.scss (PATCHED)

VERIFICATION:
- Build passes with zero errors
- Dark mode variables don't override light mode defaults
- Component follows UiIcon/SocialIcon pattern
---END HANDOFF---
```

### Why pre-research matters

Subagents spend 50%+ of their API calls on discovery — finding files, reading CLIs, exploring codebase structure. By embedding exact paths, line numbers, and interfaces in the handoff, the executor's API budget goes entirely toward actual patching and verification.

A handoff with 6 steps → the executor finishes in 6-8 API calls. Without pre-research → those same 6 steps burn 12-18 calls, and half on discovery.

---

## Implementation (with Hermes Agent)

### Configuring model routing

```bash
# Executor uses delegated model
hermes config set delegation.provider deepseek
hermes config set delegation.model deepseek-v4-flash
hermes config set delegation.max_iterations 12
```

The planner and auditor use the main session model (DeepSeek V4 Pro). The quality gate reviewer is spawned as a separate process:

```bash
hermes chat --provider opencode-go -m kimi-k2.7-code -q "<review prompt>" --quiet
```

### Dispatching the executor

```python
delegate_task(
    goal="Execute the plan from the HANDOFF PACKET",
    context="<full HANDOFF PACKET text>",
    toolsets=['terminal', 'file']
)
```

### Model routing table

| Role | Model | Why |
|------|-------|-----|
| Planner | DeepSeek V4 Pro | Strong reasoning. Handles ambiguity. |
| Executor | DeepSeek V4 Flash | Cheap, fast, literal. Follows instructions. |
| Auditor | DeepSeek V4 Pro | Same strong reasoning. 360° check. |
| Quality Gate | Kimi K2.7 Code | Independent model. Fresh perspective. |

---

## Pitfalls

**Don't let one model review itself.** The auditor and quality gate must be different from the executor. A model that wrote the code cannot find its own bugs.

**Don't skip phases.** Even if the executor output looks good, run the full pipeline. The auditor catches plan-level mistakes the executor silently followed; the quality gate catches things neither saw.

**The handoff packet must be self-contained.** The executor has zero conversation context. Include every file path, every command, every constraint.

**Respect the loop budget.** 3 rounds max. If the quality gate keeps rejecting, the plan is wrong — not the execution. Redo the planning phase instead of looping.

**Don't trust self-reports.** The executor saying "done" is not verification. The auditor must check deliverables exist and pass the verification checklist.

---

## When to Use Which

- **Existing codebase, want a review?** → Audit-Review Loop
- **Building something new?** → Complete Reviewer Loop
- **Quick one-off edit?** → Neither. Don't over-engineer.
- **Trivial change in a single file?** → Single model. The overhead isn't worth it.

The threshold is simple: if the task has 3+ steps across 2+ files, use a loop. If it's a one-line change, just do it.

---

The core insight isn't about specific models — those will change. It's about the pattern: **strong planner → literal executor → independent reviewer**. Each phase has one job, and nothing ships until someone who didn't write the code says it's good.

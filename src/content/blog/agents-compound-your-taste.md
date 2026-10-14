---
title: "Agents compound your taste — both directions"
description: "Agents didn't make code review optional. They made your judgment about primitives the highest-leverage input in the system — in both directions."
date: "2026-10-08"
draft: true
tags:
  - "ai-agents"
  - "engineering"
  - "tech-debt"
  - "taste"
category: "blog"
---
We had a badge component in our design system. It was made by designers, and it had some ambiguity. We asked the agent to match the existing patterns, and it returned something with five or six props. Any combination of them was technically valid — nothing errored, the wrong ones just silently rendered nothing.

```tsx
// what the agent built: every visible distinction became a prop
<Badge tone="warning" outlined compact size="sm" showIcon />

// what the component always meant: two concepts
<Badge type="status" variant="warning" />
```

Nobody did anything wrong here. That's the point.

## Ambiguity is a primitive

The agent is faithful, not judgmental. The failure mode isn't bugs — it's unpriced ambiguity that compounds quietly, inside code that works.

## When context becomes debt

Here's the same failure shape, at a bigger blast radius. In my own AI assistant setup, I was looking at token churn and noticed it was noticeably higher than it should be. I started digging. The system has watchdog governance alerts and a whole memory-management setup — and everything produced the right results most of the time. But the tokens were higher, until I noticed that per-thread pruning had been turned off for some reason, and there were whale sessions that had never been pruned. They got compacted, but still carried the burden of roughly ten to twenty times extra tokens on every single call.

The measured version, from the logs: over 21 days, 8,912 API calls across 524 sessions consumed 865 million input tokens. Six sessions — aged 22 to 51 days, never retired — accounted for 654 million of them. Seventy-six percent of the system's entire input consumption. A fresh session's prompt weighs about 9,500 tokens; these carried 105,000 to 211,000 per call. Eleven to twenty-two times what a simple message actually needed, on every call, for weeks.

<picture>
  <img alt="Six unretired sessions accounted for 654 million of 865 million input tokens over 21 days" src="/diagrams/context-debt.svg">
</picture>

*The figures are from the anonymized logs described below.*

And here's the part that matters: compaction *was* running. Pruning config *existed*. Every dashboard was green, because the system was doing exactly what it was configured to do. The agent operating inside that system treats the config as ground truth — it faithfully optimized everything it was asked to, and nothing asked it to question the configuration itself. The existing monitoring and prompts did not expose the design failure.

This was a taste issue.

## Good context compounds too

What fixed it was one config flip and a shorter prune window. But the payoff wasn't the tokens. Proof the context was the problem: a reminders feature I'd built at the start had never worked — the crons kept reminding me from wherever I happened to be creating them. Once the old session was pruned, the agent had to look at the actual config to find the right place. And it found it, and delivered the reminders there, first try. Clean context in, right behavior out. It compounds in that direction too. The session history had made it complicated.

The agent wasn't broken. The context was. The system carried its own accident so faithfully that neither of us could see the original design anymore.

## The hidden tax of plausible output

Now scale this to how we build systems with agents. Say we don't fix the badge component. At every new request it just keeps piling on the props, and we won't be able to see it — because visually, things look alright. But at the end, it slows the agents down too. What is simple for us is also simple for agents, and vice versa. That's not a slogan: agents are trained on human-written code, so human legibility is their native format. When human legibility breaks down, their ground truth degrades with it.

That's the mechanism: the more we write clear code for humans, the more agents find it easier to consume — that's what they're good at. If you make a system with bad primitives, agents will make it worse exponentially. With good primitives, they'll make it better exponentially. And what counts as good or bad primitives — that's your taste.

Most agents will not stop at the boundary where your design is ambiguous. They will choose a plausible interpretation and keep building. The result will most likely look like your intent. The process, I don't think so — because the ambiguity is now part of the system.

There's a second-order problem. Agents make things look clean and hide the complexity until you actually decide to look for it. They're optimized to produce locally acceptable output: defensive enough to pass the checks in front of them, not necessarily simple enough to preserve the system's design. The complexity stays hidden — until you touch the code, or someday you opt to do something simple and it can't, because the earlier outputs were hanging by thin threads.

And then you're exactly where old tech debt put human-driven systems: forced to add one more thin thread, because business wanted it faster.

<picture>
  <img alt="The agent compounds clear primitives into better output, and ambiguous primitives into hidden complexity" src="/diagrams/taste-compounds.svg">
</picture>

*The compounding goes both ways — and the direction is chosen before the agent starts.*

*Diagram drawn with [Koboyo](https://koboyo.com), then art-directed for this essay.*

## Design before delegation

All of this could have been solved by stressing a little on the design, on the intent, on the taste — before it went too far. Because agents are good at flattery. They will make you believe that whatever you're building is state of the art and going to work when you have 10 million users.

Here's what owning it actually looked like for the badge. I refactored it — from five or six props down to two: `type` and `variant`. Better types that yell at you when you use the wrong combination and won't ship even if the agent allows it, because it will not build. Thanks to the engineers who built TypeScript and build systems.

Because what I was looking for was mechanical gates — gates that stop you irrespective of your model. Then you're forced to rethink the component, and most likely you'll figure out the right approach at that time.

<picture>
  <img alt="Mechanical gates turn intent into enforced types and reject invalid combinations before shipping" src="/diagrams/mechanical-gate.svg">
</picture>

*The gate does not need better taste. It preserves yours.*

It's still under debate. The person who developed the badge developed ten or fifteen more components the same ambiguous way, and I'm looking at bringing the system back to zero, because the foundation is wrong. They want to move fast — they've been told, convincingly, that what they have is state of the art.

Let me be clear about where I stand on agents: I don't have any issues with them. I rewrote the assistant system with agents too — probably worse models, as well. The tool was never the problem. The question was always who owns the intent.

The strongest counterargument to all of this is that agents will get better at asking clarifying questions, so intent-ownership stops mattering. Here's my answer: an agent can only ask about the ambiguity it can see. The badge agent could have asked "what should happen with invalid combinations?" — but the honest answer was that nobody had decided. That decision is the taste you can't delegate. And if your plan is better models instead: a good system means any new engineer — even a fresh graduate — does a good job on it, and a system full of tech debt means even an experienced engineer has a tough time. In model terms: if the system is good, lower-tier models have a good time and frontier models get to have fun building new stuff. If it's bad, lower-tier models make things worse, and frontier models can often make it work — but I know exactly what "the cost multiplies" looks like: 654 million tokens, 76 percent of that system's entire input consumption over 21 days.

So if you're in the "just hand it over to an agent, it will handle it, don't look at code" brigade — that's who this is against. Reading code is more important than ever — not reading every line an agent emits, but reading the primitives, the interfaces, the invariants the code hangs on. If it looks easy for you, it's going to be easy for your agent. If it's ambiguous for you, you can imagine worse for your agent.

I'll explain owning the intent with this blog itself: you have to know what the piece is supposed to do and how it should land. I took help to frame it better — but the intent was mine, so I own it. Same with code. You don't leave that to the agent when the system is going to have a bigger impact. And once it ships, you don't get to say "the agent wrote it."

Agents compound whatever you bring to them. Bring taste, and they compound it. Bring ambiguity, and they compound that too — quietly, invisibly, until the day you need the system to do something simple and it can't.

---

*Token figures measured from my own assistant's API logs over a 21-day window: 8,912 calls across 524 sessions, 865 million input tokens total, of which six unretired sessions aged 22–51 days accounted for 654 million (76%). Per-call weights compared against a fresh-session median of ~9,500 tokens. Design system and assistant details anonymized.*

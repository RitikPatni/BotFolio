/**
 * Content for the /work-with-me page.
 * Voice rules: sentence case, quiet, no fabricated proof (PRODUCT.md).
 */

export const WORK_HERO = {
  lead: "Product engineering and AI automation, taken on as one fixed-scope engagement at a time — audited, built, and handed over in weeks.",
};

export const WORK_OFFER = {
  intro: [
    "I build product surfaces for a living — websites, product frontends, email workflows, and design systems — with a bias for accessibility, performance, and delivery you can plan around. The same engagement can include AI-assisted workflows: automation pipelines, agent tooling, and quality-gated review loops that fit how your team already works.",
  ],
  shapes: [
    {
      title: "Product and frontend builds",
      description:
        "New surfaces, redesigns, and design-system work, scoped so you see working software in weeks rather than quarters.",
    },
    {
      title: "AI-assisted workflows",
      description:
        "Automation and agent pipelines that take repetitive manual steps out of your team's week, with quality gates so nothing ships unchecked.",
    },
    {
      title: "Audits and quality gates",
      description:
        "A close read of your frontend or release process, ending with a prioritized list of fixes — not a slide deck.",
    },
  ],
};

export const WORK_PROCESS = {
  intro: "Every engagement follows the same shape, so the scope stays honest and the delivery stays calm.",
  steps: [
    {
      index: "01",
      title: "Audit",
      description:
        "A short, paid discovery. We look at what you have, what is slowing you down, and agree on the smallest engagement that is actually useful.",
    },
    {
      index: "02",
      title: "Build",
      description:
        "Fixed scope, regular check-ins, working software early. No open-ended retainers to start — those come later, only if you want one.",
    },
    {
      index: "03",
      title: "Handover",
      description:
        "Documentation, a walkthrough, and a clean exit. If you prefer, a small maintenance arrangement keeps things running afterwards.",
    },
  ],
};

export const WORK_PROOF = {
  intro: "Nothing on this page needs to be taken on faith — the archive is public.",
  items: [
    {
      title: "Building quality-gated AI code review loops",
      description:
        "How I run AI review against real quality gates in my own publishing pipeline — the same discipline I bring to client workflows.",
      href: "/blog/building-quality-gated-ai-code-review-loops",
    },
    {
      title: "A decade of shipped product work",
      description:
        "From bootstrapping projects from scratch to keeping legacy systems shipping — the longer story is on the About page.",
      href: "/about",
    },
  ],
};

export const WORK_AVAILABILITY = {
  label: "Availability",
  text: "One engagement at a time. Remote, working IST hours.",
};

export const WORK_CONTACT = {
  title: "Start a conversation",
  description:
    "Tell me what is slowing your team down. Email is fastest; LinkedIn works too.",
  /* Reuse the About page's contact channels — no new addresses. */
  socials: ["email", "linkedin", "github"],
};

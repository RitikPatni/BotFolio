export type ContactIntent = {
  id: string;
  label: string;
  description: string;
};

export type ContactChannel = {
  /** Matches the `icon` key on a SocialProfile entry in SITE_CONFIG.socials. */
  icon: string;
  helper: string;
  /** Intent ids this channel is relevant for. */
  intents: string[];
};

export const CONTACT_INTENTS: ContactIntent[] = [
  {
    id: "frontend",
    label: "Frontend/Product",
    description: "Product engineering, DX, architecture, and web strategy.",
  },
  {
    id: "photography",
    label: "Photography",
    description: "Shoots, collabs, and visual storytelling projects.",
  },
  {
    id: "css",
    label: "CSS Craft",
    description: "CSS ideas, creative coding, and visual experiments.",
  },
  {
    id: "general",
    label: "Say Hi",
    description: "General conversations and quick hellos.",
  },
];

export const CONTACT_CHANNELS: ContactChannel[] = [
  {
    icon: "github",
    helper: "Frontend engineering notes, code, and experiments.",
    intents: ["frontend", "general"],
  },
  {
    icon: "linkedin",
    helper: "Professional conversations and collaboration discussions.",
    intents: ["frontend", "general"],
  },
  {
    icon: "instagram",
    helper: "Wildlife and macro photography conversations.",
    intents: ["photography", "general"],
  },
  {
    icon: "code",
    helper: "Playful CSS challenges and front-end problem solving.",
    intents: ["frontend", "css", "general"],
  },
  {
    icon: "goodreads",
    helper: "Reading list, highlights, and book notes.",
    intents: ["general"],
  },
];

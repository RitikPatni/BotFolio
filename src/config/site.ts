export type NavLink = {
  href: string;
  label: string;
};

export type PersonaMode = "studio" | "field";

export type SocialProfile = {
  label: string;
  href: string;
  icon: string;
  iconSource: "iconsvg.xyz";
};

export const NAV_LINKS_BY_PERSONA: Record<PersonaMode, NavLink[]> = {
  studio: [
    { href: "/coding", label: "Journal" },
    { href: "/blog", label: "Notes" },
    { href: "/about", label: "About" },
  ],
  field: [
    { href: "/photography", label: "Gallery" },
    { href: "/library", label: "Archive" },
    { href: "/about", label: "About" },
  ],
};

export const SITE_CONFIG = {
  personName: "Ritik Patni",
  defaultDescription:
    "Ritik Patni - frontend developer and wildlife/macro photographer.",
  rssTitle: "Ritik Patni RSS Feed",
  socials: [
    {
      label: "GitHub",
      href: "https://github.com/RitikPatni",
      icon: "github",
      iconSource: "iconsvg.xyz",
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/ritikpatni/",
      icon: "linkedin",
      iconSource: "iconsvg.xyz",
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/ritikpatni/",
      icon: "instagram",
      iconSource: "iconsvg.xyz",
    },
    {
      label: "CSSBattle",
      href: "https://cssbattle.dev/player/yJin3lFzHMfkagr5R9DXYf336Jr1",
      icon: "code",
      iconSource: "iconsvg.xyz",
    },
    {
      label: "Goodreads",
      href: "https://www.goodreads.com/user/show/87703289-ritik-patni",
      icon: "goodreads",
      iconSource: "iconsvg.xyz",
    },
  ] as SocialProfile[],
};

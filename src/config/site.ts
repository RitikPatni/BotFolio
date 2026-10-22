export type NavLink = {
  href: string;
  label: string;
};

export type SocialProfile = {
  label: string;
  href: string;
  icon: string;
  iconSource: "iconsvg.xyz";
};

/* One nav. Each label is also its page's <h1> and <title> prefix. */
export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/coding", label: "Journal" },
  { href: "/blog", label: "Notes" },
  { href: "/photography", label: "Gallery" },
  { href: "/library", label: "Library" },
  { href: "/uses", label: "Uses" },
  { href: "/about", label: "About" },
];

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
      href: "https://www.instagram.com/ritikpatni_/",
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

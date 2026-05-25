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

export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/newsletter", label: "Newsletter" },
  { href: "/uses", label: "Uses" },
  { href: "/library", label: "Library" },
  { href: "/photography", label: "Photography" },
  { href: "/contact", label: "Contact" },
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
  ] as SocialProfile[],
};

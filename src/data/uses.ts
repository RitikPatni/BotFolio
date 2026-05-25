export type UsesItem = {
  /** Primary display text for the list item. */
  text: string;
  /** Optional short inline label shown before the text (e.g. "Personal", "Office"). */
  label?: string;
};

export type UsesCard = {
  /** Small uppercase badge shown above the card title (e.g. "Computers"). */
  badge: string;
  /** Card heading. */
  title: string;
  /** List of items inside the card. */
  items: UsesItem[];
  /** When true the card spans the full grid width. */
  wide?: boolean;
  /** When true the item list renders in a multi-column auto-fill grid. */
  columns?: boolean;
};

export type UsesSection = {
  /** Section heading rendered as an h2 divider row. */
  label: string;
  /** Cards within this section. */
  cards: UsesCard[];
};

const HARDWARE: UsesSection = {
  label: "Hardware",
  cards: [
    {
      badge: "Computers",
      title: "MacBooks",
      items: [
        { label: "Personal", text: "MacBook Pro (2021) — M1 Pro, 32 GB" },
        { label: "Office", text: "MacBook Pro (2025) — M4 Pro, 24 GB" },
      ],
    },
    {
      badge: "Peripherals",
      title: "Desk setup",
      items: [
        { text: "Tofu65 keyboard" },
        { text: 'Stack Overflow "The Key" keyboard' },
        { text: "Maja keyboard" },
        { text: "Logitech MX Master 3 (white)" },
      ],
    },
  ],
};

const SOFTWARE: UsesSection = {
  label: "Software",
  cards: [
    {
      badge: "Apps",
      title: "Daily drivers",
      wide: true,
      columns: true,
      items: [
        { text: "Adobe Lightroom Classic" },
        { text: "Visual Studio Code" },
        { text: "Cursor" },
        { text: "Hermes Agent" },
        { text: "Hyper" },
        { text: "MonoLisa" },
      ],
    },
  ],
};

const PHOTOGRAPHY: UsesSection = {
  label: "Photography",
  cards: [
    {
      badge: "Bodies",
      title: "Camera bodies",
      items: [{ text: "Sony A6700" }, { text: "Fujifilm X-T200" }],
    },
    {
      badge: "Glass",
      title: "Lenses",
      items: [
        { text: "Sony FE 200–600mm F5.6–6.3 G OSS" },
        { text: "Tamron 90mm F2.8 Di III MACRO VXD" },
        { text: "Sigma 30mm F1.4 DC DN Contemporary" },
        { text: "Fujinon XF 70–300mm F4–5.6 R LM OIS WR" },
        { text: "Viltrox AF 56mm F1.4 XF" },
      ],
    },
  ],
};

export const USES_SECTIONS: UsesSection[] = [HARDWARE, SOFTWARE, PHOTOGRAPHY];

export type BookCategory = {
  id: string;
  label: string;
};

export const BOOK_CATEGORIES: BookCategory[] = [
  { id: "all", label: "All" },
  { id: "fiction", label: "Fiction" },
  { id: "non-fiction", label: "Non-fiction" },
  { id: "english", label: "English" },
  { id: "hindi", label: "Hindi" },
];

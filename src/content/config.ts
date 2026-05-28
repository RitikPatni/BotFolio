import { defineCollection, z } from "astro:content";

const baseSchema = z.object({
  title: z.string(),
  description: z.string().default(""),
  date: z.coerce.date(),
  draft: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  category: z.string().default(""),
});

const highlightsSchema = baseSchema.extend({
  source_url: z.union([z.string().url(), z.literal("")]).default(""),
});

const blog = defineCollection({
  type: "content",
  schema: baseSchema.extend({
    source_url: z.string().default(""),
    source_type: z.string().default(""),
    source_title: z.string().default(""),
    source_author: z.string().default(""),
    reading_status: z.string().default(""),
    reading_start_date: z.string().default(""),
    reading_end_date: z.string().default(""),
    language: z.string().default(""),
    genres: z.array(z.string()).default([]),
    published_year: z.string().default(""),
    isbn13: z.string().default(""),
    isbn10: z.string().default(""),
    publisher: z.string().default(""),
    openlibrary_url: z.string().default(""),
  }),
});

const newsletter = defineCollection({
  type: "content",
  schema: baseSchema,
});

const books = defineCollection({
  type: "content",
  schema: baseSchema.extend({
    author: z.string().default(""),
    language: z.string().default(""),
    genres: z.array(z.string()).default([]),
    published_year: z.string().default(""),
    isbn13: z.string().default(""),
    isbn10: z.string().default(""),
    publisher: z.string().default(""),
    openlibrary_url: z.union([z.string().url(), z.literal("")]).default(""),
  }),
});

const highlights = defineCollection({
  type: "content",
  schema: highlightsSchema,
});

export const collections = { blog, newsletter, books, highlights };

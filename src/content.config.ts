import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

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
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
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
  loader: glob({ pattern: "**/*.md", base: "./src/content/newsletter" }),
  schema: baseSchema,
});

const books = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/books" }),
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
  loader: glob({ pattern: "**/*.md", base: "./src/content/highlights" }),
  schema: highlightsSchema,
});

const resources = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/resources" }),
  schema: baseSchema.extend({
    url: z.union([z.string().url(), z.literal("")]).default(""),
  }),
});

export const collections = { blog, newsletter, books, highlights, resources };

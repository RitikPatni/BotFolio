import { defineCollection, z } from 'astro:content';

const baseSchema = z.object({
  title: z.string(),
  description: z.string().default(''),
  date: z.coerce.date(),
  draft: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  source_path: z.string().optional(),
  source_url: z.string().url().optional(),
  category: z.string().optional()
});

const blog = defineCollection({
  type: 'content',
  schema: baseSchema
});

const newsletter = defineCollection({
  type: 'content',
  schema: baseSchema
});

const books = defineCollection({
  type: 'content',
  schema: baseSchema
});

const highlights = defineCollection({
  type: 'content',
  schema: baseSchema
});

export const collections = { blog, newsletter, books, highlights };

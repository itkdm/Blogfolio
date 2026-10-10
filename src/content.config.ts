import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const blogs = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/blogs' }),
  schema: z.object({
    name: z.string(), url: z.url(), screenshot: z.string(),
    categories: z.array(z.string()), tags: z.array(z.string()), techStack: z.array(z.string()).optional(),
    featured: z.boolean().default(false), addedAt: z.string(),
  }),
});

export const collections = { blogs };

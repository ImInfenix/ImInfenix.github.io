import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';
import { siteSchema, homeSchema, aboutSchema, portfolioSchema, timelineSchema, timelineEntrySchema } from './schemas';

// Folder names are the single source of identity; Markdown needs no frontmatter.
function metadataId({ entry }: { entry: string }) {
  const id = entry.replace(/\/metadata\.yaml$/, '');
  if (!id.split('/').every((part) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(part))) {
    throw new Error(`Identifiant de dossier invalide : ${entry}`);
  }
  return id;
}

export const collections = {
  site: defineCollection({ loader: glob({ base: './src/data', pattern: 'site.yaml' }), schema: siteSchema }),
  home: defineCollection({ loader: glob({ base: './src/data', pattern: 'home.yaml' }), schema: homeSchema }),
  about: defineCollection({ loader: glob({ base: './src/data', pattern: 'about.yaml' }), schema: aboutSchema }),
  projects: defineCollection({
    loader: glob({ base: './src/content/projects', pattern: '*/metadata.yaml', generateId: metadataId }),
    schema: portfolioSchema,
  }),
  games: defineCollection({
    loader: glob({ base: './src/content/games', pattern: '*/metadata.yaml', generateId: metadataId }),
    schema: portfolioSchema,
  }),
  timelines: defineCollection({
    loader: glob({ base: './src/content/timelines', pattern: '*/metadata.yaml', generateId: metadataId }),
    schema: timelineSchema,
  }),
  timelineEntries: defineCollection({
    loader: glob({ base: './src/content/timelines', pattern: '*/*/metadata.yaml', generateId: metadataId }),
    schema: timelineEntrySchema,
  }),
  descriptions: defineCollection({
    loader: glob({ base: './src/content', pattern: '**/*.md', generateId: ({ entry }) => entry.replace(/\.md$/, '') }),
    schema: z.object({}).strict(),
  }),
};

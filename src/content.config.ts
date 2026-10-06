import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { siteSchema, homeSchema, aboutSchema, portfolioSchema, timelineSchema, timelineEntrySchema, siteTranslationSchema, homeTranslationSchema, aboutTranslationSchema, portfolioTranslationSchema, timelineTranslationSchema, timelineEntryTranslationSchema } from './schemas';

// Metadata identifies entries; each Markdown file contains one complete translation.
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
  siteTranslations: defineCollection({ loader: glob({ base: './src/translations', pattern: 'site/*.md', generateId: ({ entry }) => entry.replace(/\.md$/, '') }), schema: siteTranslationSchema }),
  homeTranslations: defineCollection({ loader: glob({ base: './src/translations', pattern: 'home/*.md', generateId: ({ entry }) => entry.replace(/\.md$/, '') }), schema: homeTranslationSchema }),
  aboutTranslations: defineCollection({ loader: glob({ base: './src/translations', pattern: 'about/*.md', generateId: ({ entry }) => entry.replace(/\.md$/, '') }), schema: aboutTranslationSchema }),
  projectTranslations: defineCollection({ loader: glob({ base: './src/translations', pattern: 'projects/*/*.md', generateId: ({ entry }) => entry.replace(/\.md$/, '') }), schema: portfolioTranslationSchema }),
  gameTranslations: defineCollection({ loader: glob({ base: './src/translations', pattern: 'games/*/*.md', generateId: ({ entry }) => entry.replace(/\.md$/, '') }), schema: portfolioTranslationSchema }),
  timelineTranslations: defineCollection({ loader: glob({ base: './src/translations', pattern: 'timelines/*/*.md', generateId: ({ entry }) => entry.replace(/\.md$/, '') }), schema: timelineTranslationSchema }),
  timelineEntryTranslations: defineCollection({ loader: glob({ base: './src/translations', pattern: 'timelines/*/*/*.md', generateId: ({ entry }) => entry.replace(/\.md$/, '') }), schema: timelineEntryTranslationSchema }),
};

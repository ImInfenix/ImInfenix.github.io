import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import {
  siteSchema,
  homeSchema,
  aboutSchema,
  portfolioSchema,
  timelineSchema,
  timelineEntrySchema,
  siteTranslationSchema,
  homeTranslationSchema,
  aboutTranslationSchema,
  portfolioTranslationSchema,
  timelineTranslationSchema,
  timelineEntryTranslationSchema,
} from './schemas';

// Metadata identifies entries; each Markdown file contains one complete translation.
function metadataId({ entry }: { entry: string }) {
  const id = entry.replace(/\/metadata\.yaml$/, '');
  if (!id.split('/').every((part) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(part))) {
    throw new Error(`Identifiant de dossier invalide : ${entry}`);
  }
  return id;
}

function translationLoader(pattern: string) {
  return glob({
    base: './src/translations',
    pattern,
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  });
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
  siteTranslations: defineCollection({ loader: translationLoader('site/*.md'), schema: siteTranslationSchema }),
  homeTranslations: defineCollection({ loader: translationLoader('home/*.md'), schema: homeTranslationSchema }),
  aboutTranslations: defineCollection({ loader: translationLoader('about/*.md'), schema: aboutTranslationSchema }),
  projectTranslations: defineCollection({ loader: translationLoader('projects/*/*.md'), schema: portfolioTranslationSchema }),
  gameTranslations: defineCollection({ loader: translationLoader('games/*/*.md'), schema: portfolioTranslationSchema }),
  timelineTranslations: defineCollection({ loader: translationLoader('timelines/*/*.md'), schema: timelineTranslationSchema }),
  timelineEntryTranslations: defineCollection({ loader: translationLoader('timelines/*/*/*.md'), schema: timelineEntryTranslationSchema }),
};

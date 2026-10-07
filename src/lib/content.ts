import { getCollection, getEntry, render, type CollectionEntry, type CollectionKey } from 'astro:content';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { languages, type Language } from '../schemas';

export function settings<Collection extends 'site' | 'home' | 'about'>(collection: Collection): Promise<CollectionEntry<Collection>['data']>;
export async function settings(collection: 'site' | 'home' | 'about') {
  const entry = await getEntry(collection, collection);
  if (!entry) throw new Error(`src/data/${collection}.yaml : fichier requis absent`);
  return entry.data;
}

async function requiredTranslation<Collection extends CollectionKey>(collection: Collection, translationId: string) {
  const entry = await getEntry(collection, translationId);
  if (!entry) throw new Error(`Traduction requise absente : ${collection}/${translationId}`);
  return entry;
}

export const siteText = (reference: 'site', language: Language) => requiredTranslation('siteTranslations', `${reference}/${language}`);
export const homeText = (reference: 'home', language: Language) => requiredTranslation('homeTranslations', `${reference}/${language}`);
export const aboutText = (reference: 'about', language: Language) => requiredTranslation('aboutTranslations', `${reference}/${language}`);

export async function portfolioText(entry: PortfolioEntry, language: Language) {
  const translationId = `${entry.data.text}/${language}`;
  const translation = entry.collection === 'games'
    ? await requiredTranslation('gameTranslations', translationId)
    : await requiredTranslation('projectTranslations', translationId);
  return { data: translation.data, ...(await render(translation)) };
}

export async function timelineText(timeline: CollectionEntry<'timelines'>, language: Language) {
  return requiredTranslation('timelineTranslations', `${timeline.data.text}/${language}`);
}

export async function timelineEntryText(entry: CollectionEntry<'timelineEntries'>, language: Language) {
  const translation = await requiredTranslation('timelineEntryTranslations', `${entry.data.text}/${language}`);
  return { data: translation.data, body: translation.body, ...(await render(translation)) };
}

function assertUniqueOrders(entries: Array<{ filePath?: string; data: { order: number } }>) {
  const fileByOrder = new Map<number, string | undefined>();
  for (const entry of entries) {
    const order = entry.data.order;
    if (fileByOrder.has(order)) throw new Error(`${entry.filePath} : order ${order} déjà utilisé dans ${fileByOrder.get(order)}`);
    fileByOrder.set(order, entry.filePath);
  }
}

type TranslationEntry = { id: string; filePath?: string; body?: string; data: unknown };
type TranslationGroup = { entriesById: Map<string, TranslationEntry>; usedIds: Set<string> };
type DescriptionRequirement = 'required' | 'optional' | 'empty';

function createTranslationGroup(entries: TranslationEntry[]): TranslationGroup {
  return { entriesById: new Map(entries.map((entry) => [entry.id, entry])), usedIds: new Set() };
}

function validateTranslationPair(group: TranslationGroup, reference: string, owner: string, description: DescriptionRequirement) {
  const descriptionsPresent = languages.map((language) => {
    const translationId = `${reference}/${language}`;
    const translation = group.entriesById.get(translationId);
    if (!translation) throw new Error(`${owner} : traduction requise absente (${translationId})`);
    group.usedIds.add(translationId);
    const hasDescription = Boolean(translation.body?.replace(/<!--[\s\S]*?-->/g, '').trim());
    if (description === 'required' && !hasDescription) throw new Error(`${translation.filePath} : description vide`);
    if (description === 'empty' && hasDescription) throw new Error(`${translation.filePath} : description inattendue`);
    return hasDescription;
  });
  if (description === 'optional' && descriptionsPresent[0] !== descriptionsPresent[1]) {
    throw new Error(`${owner} : description présente dans une seule langue`);
  }
}

function assertNoUnusedTranslations(group: TranslationGroup) {
  for (const translation of group.entriesById.values()) {
    if (!group.usedIds.has(translation.id)) throw new Error(`${translation.filePath} : traduction sans métadonnées`);
  }
}

function validatePortfolioItems(items: PortfolioEntry[], collection: 'projects' | 'games', translations: TranslationGroup) {
  for (const item of items) {
    const reference = `${collection}/${item.id}`;
    if (item.data.text !== reference) throw new Error(`${item.filePath} : référence de texte attendue ${reference}`);
    validateTranslationPair(translations, reference, item.filePath!, 'required');

    for (const language of languages) {
      const translation = translations.entriesById.get(`${reference}/${language}`)!.data as CollectionEntry<'projectTranslations'>['data'];
      if (Boolean(item.data.media) !== Boolean(translation.media)) throw new Error(`${reference}/${language} : légende de média manquante ou inattendue`);
      if (item.data.media?.type === 'image' && !translation.media?.alt) throw new Error(`${reference}/${language} : texte alternatif manquant`);
      if (item.data.media?.type === 'video' && translation.media?.alt) throw new Error(`${reference}/${language} : texte alternatif inattendu`);

      const translatedLinks = translation.links ?? {};
      for (const link of item.data.links) {
        const translatedLink = translatedLinks[link.id];
        if (!translatedLink) throw new Error(`${reference}/${language} : libellé absent (${link.id})`);
        if (link.type === 'link' && !link.href && !translatedLink.href) throw new Error(`${reference}/${language} : URL absente (${link.id})`);
        if (link.type === 'badge' && translatedLink.href) throw new Error(`${reference}/${language} : URL inattendue (${link.id})`);
      }
      if (Object.keys(translatedLinks).length !== item.data.links.length) throw new Error(`${reference}/${language} : libellé sans lien`);
    }
  }
}

function validateTimelineEntries(
  timelines: CollectionEntry<'timelines'>[],
  entries: CollectionEntry<'timelineEntries'>[],
  timelineTranslations: TranslationGroup,
  entryTranslations: TranslationGroup,
) {
  const referencedEntryIds = new Set<string>();
  const entriesById = new Map(entries.map((entry) => [entry.id, entry]));

  for (const timeline of timelines) {
    const reference = `timelines/${timeline.id}`;
    if (timeline.data.text !== reference) throw new Error(`${timeline.filePath} : référence de texte attendue ${reference}`);
    validateTranslationPair(timelineTranslations, reference, timeline.filePath!, 'empty');

    for (const language of languages) {
      const translation = timelineTranslations.entriesById.get(`${reference}/${language}`)!.data as CollectionEntry<'timelineTranslations'>['data'];
      for (const organization of timeline.data.organizations) {
        if (!translation.organizations[organization.id]) throw new Error(`${reference}/${language} : organisation absente (${organization.id})`);
      }
      if (Object.keys(translation.organizations).length !== timeline.data.organizations.length) {
        throw new Error(`${reference}/${language} : organisation sans métadonnées`);
      }
    }

    for (const organization of timeline.data.organizations) {
      if (organization.logo && !/^https?:/.test(organization.logo)) assertPublicAssetExists(organization.logo, timeline.filePath!);
      for (const entryReference of organization.entries) {
        const entry = entriesById.get(entryReference.id);
        if (!entry) throw new Error(`${timeline.filePath} : expérience absente (${entryReference.id})`);
        if (referencedEntryIds.has(entry.id)) throw new Error(`${timeline.filePath} : expérience référencée plusieurs fois (${entry.id})`);
        referencedEntryIds.add(entry.id);

        const textReference = `timelines/${entry.id}`;
        if (entry.data.text !== textReference) throw new Error(`${entry.filePath} : référence de texte attendue ${textReference}`);
        const english = entryTranslations.entriesById.get(`${textReference}/en`)?.data as CollectionEntry<'timelineEntryTranslations'>['data'] | undefined;
        const french = entryTranslations.entriesById.get(`${textReference}/fr`)?.data as CollectionEntry<'timelineEntryTranslations'>['data'] | undefined;
        if (!english || !french) throw new Error(`${entry.filePath} : traduction requise absente`);
        if (Boolean(english.role) !== Boolean(french.role) || Boolean(english.duration) !== Boolean(french.duration)) {
          throw new Error(`${entry.filePath} : champs traduits incohérents`);
        }
        validateTranslationPair(entryTranslations, textReference, entry.filePath!, english.role ? 'optional' : 'required');
      }
    }
  }

  for (const entry of entries) {
    if (!referencedEntryIds.has(entry.id)) throw new Error(`${entry.filePath} : expérience sans organisation`);
  }
}

// Astro validates each file. These checks cover relationships between files.
export async function validateContent() {
  const [site, home, about, projects, games, timelines, timelineEntries, siteTranslations, homeTranslations, aboutTranslations, projectTranslations, gameTranslations, timelineTranslations, timelineEntryTranslations] = await Promise.all([
    settings('site'), settings('home'), settings('about'),
    getCollection('projects'), getCollection('games'), getCollection('timelines'), getCollection('timelineEntries'),
    getCollection('siteTranslations'), getCollection('homeTranslations'), getCollection('aboutTranslations'),
    getCollection('projectTranslations'), getCollection('gameTranslations'), getCollection('timelineTranslations'), getCollection('timelineEntryTranslations'),
  ]);

  for (const collection of [projects, games, timelines]) assertUniqueOrders(collection);
  const translations = {
    site: createTranslationGroup(siteTranslations),
    home: createTranslationGroup(homeTranslations),
    about: createTranslationGroup(aboutTranslations),
    projects: createTranslationGroup(projectTranslations),
    games: createTranslationGroup(gameTranslations),
    timelines: createTranslationGroup(timelineTranslations),
    timelineEntries: createTranslationGroup(timelineEntryTranslations),
  };

  if (site.text !== 'site' || home.text !== 'home' || about.text !== 'about') throw new Error('Référence de texte globale invalide');
  validateTranslationPair(translations.site, site.text, 'src/data/site.yaml', 'empty');
  validateTranslationPair(translations.home, home.text, 'src/data/home.yaml', 'required');
  validateTranslationPair(translations.about, about.text, 'src/data/about.yaml', 'empty');

  for (const language of languages) {
    const siteTranslation = siteTranslations.find((entry) => entry.id === `${site.text}/${language}`)!.data;
    const homeTranslation = homeTranslations.find((entry) => entry.id === `${home.text}/${language}`)!.data;
    for (const social of site.socials) {
      if (!siteTranslation.socials[social.id]) throw new Error(`site/${language} : libellé social absent (${social.id})`);
    }
    if (Object.keys(siteTranslation.socials).length !== site.socials.length) throw new Error(`site/${language} : libellé social sans lien`);
    assertPublicAssetExists(homeTranslation.resume.document, `home/${language}`);
  }

  validatePortfolioItems(projects, 'projects', translations.projects);
  validatePortfolioItems(games, 'games', translations.games);
  validateTimelineEntries(timelines, timelineEntries, translations.timelines, translations.timelineEntries);
  for (const group of Object.values(translations)) assertNoUnusedTranslations(group);
  for (const asset of [site.favicon, site.logo, ...site.socials.map((social) => social.icon)]) {
    assertPublicAssetExists(asset, 'src/data/site.yaml');
  }
  return site;
}

function assertPublicAssetExists(path: string, owner: string) {
  if (!existsSync(resolve('public', path))) throw new Error(`${owner} : ressource locale absente (public/${path})`);
}

export type PortfolioEntry = CollectionEntry<'games'> | CollectionEntry<'projects'>;

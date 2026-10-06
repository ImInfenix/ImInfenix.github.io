import { getCollection, getEntry, render, type CollectionEntry, type CollectionKey } from 'astro:content';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { languages, type Language } from '../schemas';

export function settings<C extends 'site' | 'home' | 'about'>(collection: C): Promise<CollectionEntry<C>['data']>;
export async function settings(collection: 'site' | 'home' | 'about') {
  const entry = await getEntry(collection, collection);
  if (!entry) throw new Error(`src/data/${collection}.yaml : fichier requis absent`);
  return entry.data;
}

async function requiredEntry<C extends CollectionKey>(collection: C, id: string) {
  const entry = await getEntry(collection, id);
  if (!entry) throw new Error(`Traduction requise absente : ${collection}/${id}`);
  return entry;
}

export const siteText = (reference: 'site', language: Language) => requiredEntry('siteTranslations', `${reference}/${language}`);
export const homeText = (reference: 'home', language: Language) => requiredEntry('homeTranslations', `${reference}/${language}`);
export const aboutText = (reference: 'about', language: Language) => requiredEntry('aboutTranslations', `${reference}/${language}`);

export async function portfolioText(entry: PortfolioEntry, language: Language) {
  const id = `${entry.data.text}/${language}`;
  const translation = entry.collection === 'games'
    ? await requiredEntry('gameTranslations', id)
    : await requiredEntry('projectTranslations', id);
  return { data: translation.data, ...(await render(translation)) };
}

export async function timelineText(timeline: CollectionEntry<'timelines'>, language: Language) {
  return requiredEntry('timelineTranslations', `${timeline.data.text}/${language}`);
}

export async function timelineEntryText(entry: CollectionEntry<'timelineEntries'>, language: Language) {
  const translation = await requiredEntry('timelineEntryTranslations', `${entry.data.text}/${language}`);
  return { data: translation.data, body: translation.body, ...(await render(translation)) };
}

function uniqueOrders(entries: Array<{ filePath?: string; data: { order: number } }>) {
  const orders = new Map<number, string | undefined>();
  for (const entry of entries) {
    const order = entry.data.order;
    if (orders.has(order)) throw new Error(`${entry.filePath} : order ${order} déjà utilisé dans ${orders.get(order)}`);
    orders.set(order, entry.filePath);
  }
}

type Translation = { id: string; filePath?: string; body?: string; data: unknown };
function translationIndex(entries: Translation[]) { return new Map(entries.map((entry) => [entry.id, entry])); }
function claim(index: Map<string, Translation>, used: Set<string>, reference: string, owner: string, body: 'required' | 'optional' | 'empty') {
  const pair = languages.map((language) => {
    const id = `${reference}/${language}`;
    const entry = index.get(id);
    if (!entry) throw new Error(`${owner} : traduction requise absente (${id})`);
    used.add(id);
    const filled = Boolean(entry.body?.replace(/<!--[\s\S]*?-->/g, '').trim());
    if (body === 'required' && !filled) throw new Error(`${entry.filePath} : description vide`);
    if (body === 'empty' && filled) throw new Error(`${entry.filePath} : description inattendue`);
    return filled;
  });
  if (body === 'optional' && pair[0] !== pair[1]) throw new Error(`${owner} : description présente dans une seule langue`);
}
function noUnused(index: Map<string, Translation>, used: Set<string>) {
  for (const entry of index.values()) if (!used.has(entry.id)) throw new Error(`${entry.filePath} : traduction sans métadonnées`);
}

// Astro validates individual files. Here we validate links between metadata and translations.
export async function validateContent() {
  const [site, home, about, projects, games, timelines, entries, siteTranslations, homeTranslations, aboutTranslations, projectTranslations, gameTranslations, timelineTranslations, timelineEntryTranslations] = await Promise.all([
    settings('site'), settings('home'), settings('about'),
    getCollection('projects'), getCollection('games'), getCollection('timelines'), getCollection('timelineEntries'),
    getCollection('siteTranslations'), getCollection('homeTranslations'), getCollection('aboutTranslations'),
    getCollection('projectTranslations'), getCollection('gameTranslations'), getCollection('timelineTranslations'), getCollection('timelineEntryTranslations'),
  ]);
  for (const collection of [projects, games, timelines]) uniqueOrders(collection);
  const groups = [siteTranslations, homeTranslations, aboutTranslations, projectTranslations, gameTranslations, timelineTranslations, timelineEntryTranslations].map(translationIndex);
  const used = groups.map(() => new Set<string>());
  const [sites, homes, abouts, projectTexts, gameTexts, timelineTexts, entryTexts] = groups;
  if (site.text !== 'site' || home.text !== 'home' || about.text !== 'about') throw new Error('Référence de texte globale invalide');
  claim(sites, used[0], site.text, 'src/data/site.yaml', 'empty');
  claim(homes, used[1], home.text, 'src/data/home.yaml', 'required');
  claim(abouts, used[2], about.text, 'src/data/about.yaml', 'empty');
  for (const language of languages) {
    const siteData = siteTranslations.find((entry) => entry.id === `${site.text}/${language}`)!.data;
    const homeData = homeTranslations.find((entry) => entry.id === `${home.text}/${language}`)!.data;
    for (const social of site.socials) if (!siteData.socials[social.id]) throw new Error(`site/${language} : libellé social absent (${social.id})`);
    if (Object.keys(siteData.socials).length !== site.socials.length) throw new Error(`site/${language} : libellé social sans lien`);
    requireAsset(homeData.resume.document, `home/${language}`);
  }
  for (const [items, index, taken, kind] of [[projects, projectTexts, used[3], 'projects'], [games, gameTexts, used[4], 'games']] as const) {
    for (const item of items) {
      const reference = `${kind}/${item.id}`;
      if (item.data.text !== reference) throw new Error(`${item.filePath} : référence de texte attendue ${reference}`);
      claim(index, taken, reference, item.filePath!, 'required');
      for (const language of languages) {
        const translation = index.get(`${reference}/${language}`)!.data as CollectionEntry<'projectTranslations'>['data'];
        if (Boolean(item.data.media) !== Boolean(translation.media)) throw new Error(`${reference}/${language} : légende de média manquante ou inattendue`);
        if (item.data.media?.type === 'image' && !translation.media?.alt) throw new Error(`${reference}/${language} : texte alternatif manquant`);
        if (item.data.media?.type === 'video' && translation.media?.alt) throw new Error(`${reference}/${language} : texte alternatif inattendu`);
        const labels = translation.links ?? {};
        for (const link of item.data.links) {
          const translated = labels[link.id];
          if (!translated) throw new Error(`${reference}/${language} : libellé absent (${link.id})`);
          if (link.type === 'link' && !link.href && !translated.href) throw new Error(`${reference}/${language} : URL absente (${link.id})`);
          if (link.type === 'badge' && translated.href) throw new Error(`${reference}/${language} : URL inattendue (${link.id})`);
        }
        if (Object.keys(labels).length !== item.data.links.length) throw new Error(`${reference}/${language} : libellé sans lien`);
      }
    }
  }
  const referenced = new Set<string>();
  const timelineEntries = new Map(entries.map((entry) => [entry.id, entry]));
  for (const timeline of timelines) {
    const reference = `timelines/${timeline.id}`;
    if (timeline.data.text !== reference) throw new Error(`${timeline.filePath} : référence de texte attendue ${reference}`);
    claim(timelineTexts, used[5], reference, timeline.filePath!, 'empty');
    for (const language of languages) {
      const translated = timelineTexts.get(`${reference}/${language}`)!.data as CollectionEntry<'timelineTranslations'>['data'];
      for (const organization of timeline.data.organizations) if (!translated.organizations[organization.id]) throw new Error(`${reference}/${language} : organisation absente (${organization.id})`);
      if (Object.keys(translated.organizations).length !== timeline.data.organizations.length) throw new Error(`${reference}/${language} : organisation sans métadonnées`);
    }
    for (const organization of timeline.data.organizations) {
      if (organization.logo && !/^https?:/.test(organization.logo)) requireAsset(organization.logo, timeline.filePath!);
      for (const link of organization.entries) {
        const entry = timelineEntries.get(link.id);
        if (!entry) throw new Error(`${timeline.filePath} : expérience absente (${link.id})`);
        if (referenced.has(entry.id)) throw new Error(`${timeline.filePath} : expérience référencée plusieurs fois (${entry.id})`);
        referenced.add(entry.id);
        const textReference = `timelines/${entry.id}`;
        if (entry.data.text !== textReference) throw new Error(`${entry.filePath} : référence de texte attendue ${textReference}`);
        const en = entryTexts.get(`${textReference}/en`)?.data as CollectionEntry<'timelineEntryTranslations'>['data'] | undefined;
        const fr = entryTexts.get(`${textReference}/fr`)?.data as CollectionEntry<'timelineEntryTranslations'>['data'] | undefined;
        if (!en || !fr) throw new Error(`${entry.filePath} : traduction requise absente`);
        if (Boolean(en.role) !== Boolean(fr.role) || Boolean(en.duration) !== Boolean(fr.duration)) throw new Error(`${entry.filePath} : champs traduits incohérents`);
        claim(entryTexts, used[6], textReference, entry.filePath!, en.role ? 'optional' : 'required');
      }
    }
  }
  for (const entry of entries) if (!referenced.has(entry.id)) throw new Error(`${entry.filePath} : expérience sans organisation`);
  groups.forEach((group, index) => noUnused(group, used[index]));
  for (const asset of [site.favicon, site.logo, ...site.socials.map((item) => item.icon)]) requireAsset(asset, 'src/data/site.yaml');
  return site;
}

function requireAsset(path: string, owner: string) {
  if (!existsSync(resolve('public', path))) throw new Error(`${owner} : ressource locale absente (public/${path})`);
}

export type PortfolioEntry = CollectionEntry<'games'> | CollectionEntry<'projects'>;

import { getCollection, getEntry, render, type CollectionEntry } from 'astro:content';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { languages, type Language } from '../schemas';

export function settings<C extends 'site' | 'home' | 'about'>(collection: C): Promise<CollectionEntry<C>['data']>;
export async function settings(collection: 'site' | 'home' | 'about') {
  const entry = await getEntry(collection, collection);
  if (!entry) throw new Error(`src/data/${collection}.yaml : fichier requis absent`);
  return entry.data;
}

export async function description(prefix: string, language: Language, optional = false) {
  const id = `${prefix}/${language}`;
  const entry = optional
    ? (await getCollection('descriptions', (entry) => entry.id === id))[0]
    : await getEntry('descriptions', id);
  if (!entry) {
    if (optional) return undefined;
    throw new Error(`src/content/${id}.md : traduction requise absente`);
  }
  if (!entry.body?.replace(/<!--[\s\S]*?-->/g, '').trim()) {
    throw new Error(`${entry.filePath} : description vide`);
  }
  return render(entry);
}

function uniqueOrders(entries: Array<{ filePath?: string; data: { order: number } }>) {
  const orders = new Map<number, string | undefined>();
  for (const entry of entries) {
    const order = entry.data.order;
    if (orders.has(order)) throw new Error(`${entry.filePath} : order ${order} déjà utilisé dans ${orders.get(order)}`);
    orders.set(order, entry.filePath);
  }
}

// Astro owns parsing and field validation. Only cross-entry constraints live here.
// Run during both page requests and static generation, without caching.
export async function validateContent() {
  const [site, home, projects, games, timelines, entries, descriptions] = await Promise.all([
    settings('site'), settings('home'), getCollection('projects'), getCollection('games'),
    getCollection('timelines'), getCollection('timelineEntries'), getCollection('descriptions'),
  ]);
  await settings('about');
  for (const collection of [projects, games, timelines]) uniqueOrders(collection);
  const available = new Map(descriptions.map((entry) => [entry.id, entry]));
  const required = new Set<string>();
  function requireDescription(prefix: string, owner: string, optional = false) {
    if (optional && languages.every((language) => !available.has(`${prefix}/${language}`))) return;
    for (const language of languages) {
      const id = `${prefix}/${language}`;
      required.add(id);
      const entry = available.get(id);
      if (!entry) throw new Error(`${owner} : traduction requise absente (src/content/${id}.md)`);
      if (!entry.body?.replace(/<!--[\s\S]*?-->/g, '').trim()) throw new Error(`${entry.filePath} : description vide`);
    }
  }
  requireDescription('home', 'src/data/home.yaml');
  for (const [name, items] of [['projects', projects], ['games', games]] as const) {
    for (const item of items) requireDescription(`${name}/${item.id}`, item.filePath!);
  }
  const referenced = new Set<string>();
  const timelineEntries = new Map(entries.map((entry) => [entry.id, entry]));
  for (const timeline of timelines) {
    for (const organization of timeline.data.organizations) {
      if (organization.logo && !/^https?:/.test(organization.logo)) requireAsset(organization.logo, timeline.filePath!);
      for (const reference of organization.entries) {
        const entry = timelineEntries.get(reference.id);
        if (!entry) throw new Error(`${timeline.filePath} : expérience absente (${reference.id})`);
        if (referenced.has(entry.id)) throw new Error(`${timeline.filePath} : expérience référencée plusieurs fois (${entry.id})`);
        referenced.add(entry.id);
        requireDescription(`timelines/${entry.id}`, entry.filePath!, Boolean(entry.data.role));
      }
    }
  }
  for (const entry of entries) if (!referenced.has(entry.id)) throw new Error(`${entry.filePath} : expérience sans organisation`);
  for (const entry of descriptions) if (!required.has(entry.id)) throw new Error(`${entry.filePath} : description sans métadonnées`);
  for (const asset of [site.favicon, site.logo, ...site.socials.map((item) => item.icon)]) requireAsset(asset, 'src/data/site.yaml');
  for (const language of languages) requireAsset(home.resume.document[language], 'src/data/home.yaml');
  return site;
}

function requireAsset(path: string, owner: string) {
  if (!existsSync(resolve('public', path))) {
    throw new Error(`${owner} : ressource locale absente (public/${path})`);
  }
}

export type PortfolioEntry = CollectionEntry<'games'> | CollectionEntry<'projects'>;

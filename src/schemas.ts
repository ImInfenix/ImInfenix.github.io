import { z } from 'zod';
import { reference, type SchemaContext } from 'astro:content';

export const languages = ['en', 'fr'] as const;
export type Language = (typeof languages)[number];
export const pageIds = ['index', 'games', 'projects', 'about'] as const;
export type Page = (typeof pageIds)[number];
export const text = z.string().trim().min(1, 'Champ requis vide');
export const translated = z.object({ en: text, fr: text }).strict();
export const sharedOrTranslated = z.union([text, translated]);
export type Localized = z.infer<typeof sharedOrTranslated>;
export const httpUrl = z.url().refine((value) => /^https?:\/\//.test(value), 'URL HTTP(S) requise');
const publicPath = text.refine((value) => !value.startsWith('/') && !value.includes('..') && !/[\\?#:]/.test(value), 'Chemin relatif à public/ requis');
const localizedUrl = z.union([httpUrl, z.object({ en: httpUrl, fr: httpUrl }).strict()]);

export const siteSchema = z.object({
  title: text,
  favicon: publicPath,
  logo: publicPath,
  navigation: z.array(z.object({ id: z.enum(pageIds), label: translated }).strict())
    .length(pageIds.length)
    .refine((items) => new Set(items.map((item) => item.id)).size === pageIds.length, 'Pages de navigation dupliquées'),
  socials: z.array(z.object({ href: httpUrl, icon: publicPath, label: text }).strict()).min(1),
  labels: z.object({ navigation: translated, languages: translated, socials: translated, skip: translated, technologies: translated }).strict(),
}).strict();

export const homeSchema = z.object({
  heading: translated,
  resume: z.object({ label: translated, document: z.object({ en: publicPath, fr: publicPath }).strict() }).strict(),
}).strict();

export const aboutSchema = z.object({
  contact: z.object({ prefix: translated, label: text, href: text.refine((value) => value.startsWith('mailto:'), 'Lien mailto requis') }).strict(),
}).strict();

export const portfolioSchema = ({ image }: SchemaContext) => z.object({
  order: z.number().int().nonnegative(),
  title: sharedOrTranslated,
  media: z.discriminatedUnion('type', [
    z.object({ type: z.literal('image'), src: z.union([image(), httpUrl]), alt: translated }).strict(),
    z.object({ type: z.literal('video'), src: httpUrl }).strict(),
  ]).optional(),
  subtitle: translated.optional(),
  links: z.array(z.discriminatedUnion('type', [
    z.object({ type: z.literal('link'), href: localizedUrl, label: translated }).strict(),
    z.object({ type: z.literal('badge'), src: httpUrl, alt: translated }).strict(),
  ])).default([]),
}).strict().refine((data) => !data.media || data.subtitle, { message: 'Un média exige une légende bilingue', path: ['subtitle'] });

export const timelineEntrySchema = z.object({
  period: sharedOrTranslated,
  role: sharedOrTranslated.optional(),
  duration: sharedOrTranslated.optional(),
}).strict();

export const timelineSchema = z.object({
  order: z.number().int().nonnegative(),
  title: translated,
  organizations: z.array(z.object({
    name: sharedOrTranslated,
    logo: z.union([httpUrl, publicPath]).optional(),
    entries: z.array(reference('timelineEntries')).min(1),
    technologies: z.array(text).min(1).optional(),
  }).strict()).min(1),
}).strict();

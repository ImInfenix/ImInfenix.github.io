import { z } from 'zod';
import { reference, type SchemaContext } from 'astro:content';

export const languages = ['en', 'fr'] as const;
export type Language = (typeof languages)[number];
export const pageIds = ['index', 'games', 'projects', 'about'] as const;
export type Page = (typeof pageIds)[number];
export const text = z.string().trim().min(1, 'Champ requis vide');
export const httpUrl = z.url().refine((value) => /^https?:\/\//.test(value), 'URL HTTP(S) requise');
const publicPath = text.refine((value) => !value.startsWith('/') && !value.includes('..') && !/[\\?#:]/.test(value), 'Chemin relatif à public/ requis');
const key = text.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Identifiant invalide');
const translationReference = text.regex(/^[a-z0-9]+(?:[/-][a-z0-9]+)*$/, 'Référence de traduction invalide');

export const siteSchema = z.object({
  text: z.literal('site'),
  title: text,
  favicon: publicPath,
  logo: publicPath,
  navigation: z.array(z.object({ id: z.enum(pageIds) }).strict())
    .length(pageIds.length)
    .refine((items) => new Set(items.map((item) => item.id)).size === pageIds.length, 'Pages de navigation dupliquées'),
  socials: z.array(z.object({ id: key, href: httpUrl, icon: publicPath }).strict()).min(1),
}).strict();

export const homeSchema = z.object({
  text: z.literal('home'),
}).strict();

export const aboutSchema = z.object({
  text: z.literal('about'),
  contact: z.object({ label: text, href: text.refine((value) => value.startsWith('mailto:'), 'Lien mailto requis') }).strict(),
}).strict();

export const portfolioSchema = ({ image }: SchemaContext) => z.object({
  order: z.number().int().nonnegative(),
  text: translationReference,
  media: z.discriminatedUnion('type', [
    z.object({ type: z.literal('image'), src: z.union([image(), httpUrl]) }).strict(),
    z.object({ type: z.literal('video'), src: httpUrl }).strict(),
  ]).optional(),
  links: z.array(z.discriminatedUnion('type', [
    z.object({ id: key, type: z.literal('link'), href: httpUrl.optional() }).strict(),
    z.object({ id: key, type: z.literal('badge'), src: httpUrl }).strict(),
  ])).default([]),
}).strict();

export const timelineEntrySchema = z.object({
  text: translationReference,
}).strict();

export const timelineSchema = z.object({
  order: z.number().int().nonnegative(),
  text: translationReference,
  organizations: z.array(z.object({
    id: key,
    logo: z.union([httpUrl, publicPath]).optional(),
    entries: z.array(reference('timelineEntries')).min(1),
    technologies: z.array(text).min(1).optional(),
  }).strict()).min(1),
}).strict();

export const siteTranslationSchema = z.object({
  navigation: z.object({ index: text, games: text, projects: text, about: text }).strict(),
  socials: z.record(key, text),
  labels: z.object({ navigation: text, languages: text, socials: text, skip: text, technologies: text }).strict(),
}).strict();

export const homeTranslationSchema = z.object({
  heading: text,
  resume: z.object({ label: text, document: publicPath }).strict(),
}).strict();

export const aboutTranslationSchema = z.object({
  contact: z.object({ prefix: text }).strict(),
}).strict();

export const portfolioTranslationSchema = z.object({
  title: text,
  media: z.object({ alt: text.optional(), caption: text }).strict().optional(),
  links: z.record(key, z.object({ text, href: httpUrl.optional() }).strict()).optional(),
}).strict();

export const timelineTranslationSchema = z.object({
  title: text,
  organizations: z.record(key, text),
}).strict();

export const timelineEntryTranslationSchema = z.object({
  period: text,
  role: text.optional(),
  duration: text.optional(),
}).strict();

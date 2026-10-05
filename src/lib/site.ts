import type { Language, Localized, Page } from '../schemas';

export function localize(value: Localized, language: Language): string {
  return typeof value === 'string' ? value : value[language];
}

export function assetUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export function pageUrl(page: Page, language: Language): string {
  return assetUrl(`${language === 'fr' ? 'fr/' : ''}${page}.html`);
}

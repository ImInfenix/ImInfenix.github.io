import type { Language, Page } from '../schemas';

export function assetUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export function pageUrl(page: Page, language: Language): string {
  return assetUrl(`${language === 'fr' ? 'fr/' : ''}${page}.html`);
}

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { safePath } from './workspace.mjs';

const [contentType, slug, yearArgument, ...additionalArguments] = process.argv.slice(2);
const collectionByType = { game: 'games', project: 'projects' };
const year = yearArgument === undefined ? new Date().getFullYear() : Number(yearArgument);
if (!Object.hasOwn(collectionByType, contentType) || !slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !Number.isInteger(year) || year < 1900 || year > 2100 || additionalArguments.length) {
  console.error('Usage : npm run content:new -- <game|project> <identifiant-en-minuscules> [année]');
  process.exit(1);
}

const collection = collectionByType[contentType];
const collectionDirectory = safePath(`src/content/${collection}`);
const contentDirectory = safePath(join(collectionDirectory, slug));
const translationDirectory = safePath(`src/translations/${collection}/${slug}`);
if (existsSync(contentDirectory) || existsSync(translationDirectory)) {
  console.error(`Le contenu ou ses traductions existent déjà : ${slug}`);
  process.exit(1);
}
const existingOrders = readdirSync(collectionDirectory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(collectionDirectory, entry.name, 'metadata.yaml')))
  .map((entry) => {
    const metadataPath = join(collectionDirectory, entry.name, 'metadata.yaml');
    const { order } = parse(readFileSync(metadataPath, 'utf8'));
    if (!Number.isSafeInteger(order) || order < 0) throw new Error(`${metadataPath} : order invalide`);
    return order;
  });
const nextOrder = Math.max(0, ...existingOrders) + 10;
if (!Number.isSafeInteger(nextOrder)) throw new Error('Aucun ordre entier disponible.');
const metadata = stringify({ year, order: nextOrder, text: `${collection}/${slug}`, links: [] }, { lineWidth: 0 });
const translations = {
  'en.md': `---\n${stringify({ title: slug }, { lineWidth: 0 })}---\nDescribe your project here.\n`,
  'fr.md': `---\n${stringify({ title: slug }, { lineWidth: 0 })}---\nDécrivez votre projet ici.\n`,
};

// An exclusive directory creation prevents overwriting an existing entry.
mkdirSync(safePath(contentDirectory));
mkdirSync(safePath(translationDirectory), { recursive: true });
writeFileSync(safePath(join(contentDirectory, 'metadata.yaml')), metadata, { flag: 'wx' });
for (const [filename, contents] of Object.entries(translations)) {
  writeFileSync(safePath(join(translationDirectory, filename)), contents, { flag: 'wx' });
}
console.log(`Créé : src/content/${collection}/${slug}/`);
console.log(`Traductions : src/translations/${collection}/${slug}/`);
console.log('Compléter les métadonnées et les traductions, puis lancer npm run build.');

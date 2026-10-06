import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { safePath } from './workspace.mjs';

const [kind, slug, ...extra] = process.argv.slice(2);
const collections = { game: 'games', project: 'projects' };
if (!Object.hasOwn(collections, kind) || !slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || extra.length) {
  console.error('Usage : npm run content:new -- <game|project> <identifiant-en-minuscules>');
  process.exit(1);
}

const base = safePath(`src/content/${collections[kind]}`);
const destination = safePath(join(base, slug));
const translations = safePath(`src/translations/${collections[kind]}/${slug}`);
if (existsSync(destination) || existsSync(translations)) {
  console.error(`Le contenu ou ses traductions existent déjà : ${slug}`);
  process.exit(1);
}
const orders = readdirSync(base, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(base, entry.name, 'metadata.yaml')))
  .map((entry) => {
    const path = join(base, entry.name, 'metadata.yaml');
    const { order } = parse(readFileSync(path, 'utf8'));
    if (!Number.isSafeInteger(order) || order < 0) throw new Error(`${path} : order invalide`);
    return order;
  });
const order = Math.max(0, ...orders) + 10;
if (!Number.isSafeInteger(order)) throw new Error('Aucun ordre entier disponible.');
const files = {
  'metadata.yaml': stringify({ order, text: `${collections[kind]}/${slug}`, links: [] }, { lineWidth: 0 }),
};
const localizedFiles = {
  'en.md': `---\n${stringify({ title: slug }, { lineWidth: 0 })}---\nDescribe your project here.\n`,
  'fr.md': `---\n${stringify({ title: slug }, { lineWidth: 0 })}---\nDécrivez votre projet ici.\n`,
};

// An exclusive directory creation prevents overwriting an existing entry.
mkdirSync(safePath(destination));
mkdirSync(safePath(translations), { recursive: true });
for (const [name, contents] of Object.entries(files)) {
  writeFileSync(safePath(join(destination, name)), contents, { flag: 'wx' });
}
for (const [name, contents] of Object.entries(localizedFiles)) {
  writeFileSync(safePath(join(translations, name)), contents, { flag: 'wx' });
}
console.log(`Créé : src/content/${collections[kind]}/${slug}/`);
console.log(`Traductions : src/translations/${collections[kind]}/${slug}/`);
console.log('Compléter les métadonnées et les traductions, puis lancer npm run build.');

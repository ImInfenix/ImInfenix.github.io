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
if (existsSync(destination)) {
  console.error(`Le contenu existe déjà : ${destination}`);
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
  'metadata.yaml': stringify({ order, title: { en: slug, fr: slug }, links: [] }, { lineWidth: 0 }),
  'en.md': 'Describe your project here.\n',
  'fr.md': 'Décrivez votre projet ici.\n',
};

// An exclusive directory creation prevents overwriting an existing entry.
mkdirSync(safePath(destination));
for (const [name, contents] of Object.entries(files)) {
  writeFileSync(safePath(join(destination, name)), contents, { flag: 'wx' });
}
console.log(`Créé : src/content/${collections[kind]}/${slug}/`);
console.log('Compléter metadata.yaml, en.md et fr.md, puis lancer npm run build.');

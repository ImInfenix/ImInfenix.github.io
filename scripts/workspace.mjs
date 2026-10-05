import { existsSync, lstatSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = realpathSync(fileURLToPath(new URL('../', import.meta.url)));
export function safePath(path) {
  const target = resolve(root, path);
  const within = (value) => { const rel = relative(root, value); return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`)); };
  if (!within(target)) throw new Error(`Écriture hors projet : ${target}`);
  let current = target;
  while (within(current)) {
    if (existsSync(current)) {
      if (lstatSync(current).isSymbolicLink() || !within(realpathSync(current))) throw new Error(`Lien hors périmètre : ${current}`);
    }
    if (current === root) break;
    current = dirname(current);
  }
  return target;
}
export function write(path, contents) {
  const target = safePath(path);
  mkdirSync(safePath(dirname(target)), { recursive: true });
  writeFileSync(safePath(target), contents);
}

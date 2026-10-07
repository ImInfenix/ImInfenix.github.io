import { existsSync, lstatSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = realpathSync(fileURLToPath(new URL('../', import.meta.url)));

function isWithinProject(path) {
  const relativePath = relative(projectRoot, path);
  return relativePath === '' || (
    !isAbsolute(relativePath) && relativePath !== '..' && !relativePath.startsWith(`..${sep}`)
  );
}

export function safePath(path) {
  const absolutePath = resolve(projectRoot, path);
  if (!isWithinProject(absolutePath)) throw new Error(`Écriture hors projet : ${absolutePath}`);

  let currentPath = absolutePath;
  while (isWithinProject(currentPath)) {
    if (existsSync(currentPath)) {
      if (lstatSync(currentPath).isSymbolicLink() || !isWithinProject(realpathSync(currentPath))) {
        throw new Error(`Lien hors périmètre : ${currentPath}`);
      }
    }
    if (currentPath === projectRoot) break;
    currentPath = dirname(currentPath);
  }
  return absolutePath;
}

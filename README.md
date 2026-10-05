# Infenix

Portfolio statique bilingue généré avec Astro : https://www.infenix.dev.

## Développement

Utiliser Node.js 24 et npm. Les dépendances sont verrouillées dans `package-lock.json`.

```sh
npm ci
npm run dev
```

Le serveur indique son adresse locale, généralement http://localhost:4321.
Les huit URL historiques restent disponibles : `index.html`, `games.html`, `projects.html` et `about.html`, à la racine en anglais et sous `/fr/` en français.

## Contenu

Chaque jeu ou projet possède son dossier avec `metadata.yaml`, `en.md` et `fr.md`.
Les fichiers Markdown ne nécessitent aucun frontmatter.

```sh
npm run content:new -- game mon-jeu
npm run content:new -- project mon-projet
```

La commande crée les trois fichiers sans écraser un contenu existant et attribue un ordre disponible.
Remplacer les textes proposés avant publication.

- [Modifier le contenu, les médias et le CV](docs/content.md)
- [Configurer la publication GitHub Pages](docs/deployment.md)

## Vérification et compilation

```sh
npm run check
npm run build
npm run preview
```

`check` vérifie TypeScript et les composants. `build` génère `dist/` et refuse les contenus invalides : champs requis, traductions manquantes, descriptions vides, ordres dupliqués, références orphelines et ressources locales manquantes. Les contrôles entre contenus s'exécutent aussi lors du rendu des pages en développement.

Il n'y a pas de suite de tests automatisés. Après une modification de présentation, vérifier les pages FR/EN en prévisualisation, sur mobile et au clavier.

Dans PowerShell, utiliser `npm.cmd` si `npm.ps1` est bloqué. Le cache npm et les fichiers temporaires des commandes Astro restent dans le projet et sont ignorés par Git.

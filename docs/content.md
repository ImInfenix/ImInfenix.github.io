# Modifier le contenu

## Jeux et projets

```text
src/content/games/mon-jeu/
  metadata.yaml
  en.md
  fr.md
```

Même organisation dans `src/content/projects/`. Le nom du dossier est l'identifiant stable ; ne pas le répéter dans les fichiers. Les traductions sont identifiées par leur nom de fichier. Les Markdown contiennent uniquement le texte à afficher, sans frontmatter.

Créer un contenu avec `npm run content:new -- game mon-jeu` ou `npm run content:new -- project mon-projet`, puis remplacer les textes proposés. La commande refuse tout dossier déjà existant.

```yaml
order: 10
title:
  en: My project (2026)
  fr: Mon projet (2026)
links:
  - type: link
    href: https://example.com/
    label:
      en: Project website
      fr: Site du projet
```

Les éléments sont triés par `order` croissant. Les valeurs sont uniques dans chaque collection ; les espacements de 10 permettent d'insérer un contenu entre deux autres. Un titre identique dans les deux langues peut être une simple chaîne. Les URL acceptent également une valeur commune ou un objet `en/fr`. Les libellés exigent toujours les deux langues. `links` peut être omis ou vide.

Écrire les paragraphes, listes, emphases et liens avec Markdown. Les liens ordinaires sont stylés automatiquement, sans classe CSS à ajouter. Les liens HTML historiques restent pris en charge. Un saut de ligne explicite peut utiliser deux espaces en fin de ligne ou `<br>`.

Pour supprimer un contenu, supprimer son dossier complet. Les descriptions sans métadonnées et les traductions manquantes sont refusées.

## Médias

Une image locale est placée dans `src/assets/` et référencée **relativement au fichier metadata.yaml** :

```yaml
media:
  type: image
  src: ../../../assets/projects/mon-projet.png
  alt:
    en: A procedurally generated map with rivers
    fr: Une carte générée avec des rivières
subtitle:
  en: Example of a generated world
  fr: Exemple de monde généré
```

Astro valide et optimise les images locales, puis produit plusieurs tailles WebP.
Une image distante utilise une URL HTTP(S) complète dans `src` ; elle reste servie par son hébergeur.

Le texte `alt` décrit ce que l'image apporte. La légende `subtitle` donne le contexte visible. Ces deux champs sont bilingues.

Pour une vidéo intégrée :

```yaml
media:
  type: video
  src: https://www.youtube-nocookie.com/embed/IDENTIFIANT
subtitle:
  en: Launch trailer
  fr: Bande-annonce de lancement
```

La légende sert aussi de titre accessible à la vidéo. Dimensions, ratio, plein écran et chargement différé sont gérés par `Media.astro`.

Un badge est une entrée de `links` :

```yaml
- type: badge
  src: https://example.com/build.svg
  alt:
    en: Build status
    fr: État de la compilation
```

Les anciens fichiers d'images dans `public/images/games/` et `public/images/projects/` restent accessibles pour préserver leurs URL historiques. Les images optimisées du portfolio proviennent de `src/assets/`. Pour un nouveau contenu, utiliser uniquement `src/assets/`.

## Expériences, formations et activités

```text
src/content/timelines/experience/
  metadata.yaml
  mon-poste/
    metadata.yaml
    en.md
    fr.md
```

Le fichier du groupe définit son titre, son ordre et ses organisations :

```yaml
order: 10
title:
  en: Professional experience
  fr: Expérience professionnelle
organizations:
  - name: Mon studio
    logo: https://example.com/logo.png
    entries:
      - experience/mon-poste
    technologies: [Unity, C#]
```

L'ordre des organisations et des références est l'ordre d'affichage. L'alternance gauche/droite est automatique et disparaît sur mobile. `logo` et `technologies` sont facultatifs. Un logo accepte une URL externe ou un chemin relatif à `public/`. `name` sert notamment de texte alternatif du logo.

Chaque poste, diplôme ou activité contient des métadonnées simples :

```yaml
period:
  en: Since January 2026
  fr: Depuis janvier 2026
role:
  en: Gameplay Engineer
  fr: Ingénieur Gameplay
```

`period` est requis. `role` et `duration` sont facultatifs. Ces champs acceptent une valeur commune ou bilingue. Les descriptions détaillées sont dans `en.md` et `fr.md` : aucune instruction HTML de mise en page n'est nécessaire.

Pour une entrée courte avec un `role`, les deux Markdown peuvent être omis. Dès qu'une description existe, les deux langues sont obligatoires et non vides. Sans `role`, les deux descriptions sont requises.

Plusieurs postes peuvent appartenir à la même organisation. Toute entrée doit être référencée exactement une fois par un groupe. Pour déplacer ou renommer une entrée, mettre à jour sa référence `groupe/identifiant`.

## Accueil, navigation et coordonnées

- `src/content/home/en.md` et `fr.md` : présentation.
- `src/data/home.yaml` : titre d'accueil, libellés et documents du CV.
- `src/data/about.yaml` : coordonnées de contact.
- `src/data/site.yaml` : navigation, profils sociaux et libellés d'interface.
- `public/documents/` : PDF du CV ; les chemins dans les données sont relatifs à `public/`.
- `astro.config.mjs` : domaine du site, à maintenir cohérent avec `public/CNAME`.

Les URL internes sont construites par `src/lib/site.ts`. Chaque page transmet explicitement sa langue et son identifiant au layout et aux composants.

## Présentation et validation

Les styles sont dans `src/styles/` et, pour les médias, dans `Media.astro`.
Les collections Astro lisent les fichiers et valident leurs schémas définis dans `src/schemas.ts`.
`src/lib/content.ts` contrôle les relations entre contenus lors du rendu : traductions, ordres, références et ressources publiques.

Exécuter `npm run check` puis `npm run build` avant publication. Utiliser `npm run preview` pour vérifier le résultat. Aucune suite de tests supplémentaire n'est nécessaire pour éditer le contenu.

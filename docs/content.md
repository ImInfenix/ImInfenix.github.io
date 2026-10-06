# Modifier le contenu

Les fichiers `metadata.yaml` décrivent la structure : ordre, médias, liens et références. Leur champ `text` désigne les traductions. Chaque fichier `fr.md` ou `en.md` contient **tous les textes d'une entrée** : les champs courts dans le frontmatter YAML, la description longue dans le corps Markdown. Aucun champ `en` ou `fr` ne figure dans les métadonnées.

## Ajouter un jeu ou un projet

Créer l'entrée avec `npm run content:new -- game mon-jeu` ou `npm run content:new -- project mon-projet`. La commande crée ces fichiers et refuse d'écraser une entrée ou une traduction existante :

```text
src/content/games/mon-jeu/metadata.yaml
src/translations/games/mon-jeu/en.md
src/translations/games/mon-jeu/fr.md
```

Même organisation sous `projects/`. Le nom du dossier est l'identifiant stable. `text` relie les métadonnées au dossier de traduction :

```yaml
order: 10
text: games/mon-jeu
media:
  type: image
  src: ../../../assets/games/mon-jeu.png
links:
  - id: site-officiel
    type: link
    href: https://example.com/
```

Exemple de `src/translations/games/mon-jeu/fr.md` :

```md
---
title: Mon jeu (2026)
media:
  alt: Capture du niveau principal
  caption: Le premier niveau
links:
  site-officiel:
    text: Site du jeu
---

Description du jeu en **Markdown**, avec des paragraphes, listes et liens.
```

Le fichier anglais a les mêmes clés et son propre texte. Les liens, badges et organisations possèdent des identifiants stables : leurs traductions restent associées lorsque leur ordre change. Un lien peut aussi avoir une URL différente selon la langue : omettre `href` dans `metadata.yaml` et l'ajouter dans l'entrée correspondante de chaque traduction.

Les éléments sont triés par `order` croissant, unique dans chaque collection. Espacer les valeurs de 10 permet d'insérer une entrée. Pour supprimer un contenu, supprimer ses métadonnées **et** son dossier de traduction.

## Médias et ressources

Une image locale se place dans `src/assets/` et son `src` est relatif au fichier `metadata.yaml`. Astro la valide et produit plusieurs tailles WebP. Une image distante utilise une URL HTTP(S). Pour une vidéo, utiliser `media: { type: video, src: URL }` dans les métadonnées et `media.caption` dans chaque traduction. L'image demande aussi `media.alt`. La légende sert de titre accessible à la vidéo.

Un badge utilise `type: badge`, un `id` et un `src` dans `links`; sa traduction fournit `links.<id>.text` pour son texte alternatif. Les anciens fichiers dans `public/images/games/` et `public/images/projects/` restent accessibles pour préserver leurs URL historiques. Les nouvelles images du portfolio vont dans `src/assets/`.

## Expériences, formations et activités

Chaque groupe possède ses métadonnées et une traduction par langue :

```text
src/content/timelines/experience/metadata.yaml
src/translations/timelines/experience/en.md
src/translations/timelines/experience/fr.md
src/content/timelines/experience/mon-poste/metadata.yaml
src/translations/timelines/experience/mon-poste/en.md
src/translations/timelines/experience/mon-poste/fr.md
```

Le groupe fixe son ordre, ses organisations et les références vers ses entrées :

```yaml
order: 10
text: timelines/experience
organizations:
  - id: mon-studio
    logo: https://example.com/logo.png
    entries:
      - experience/mon-poste
    technologies: [Unity, C#]
```

Sa traduction donne le titre du groupe et les noms des organisations :

```md
---
title: Expérience professionnelle
organizations:
  mon-studio: Mon studio
---
```

Les métadonnées d'une entrée contiennent seulement `text: timelines/experience/mon-poste`. Sa traduction définit `period` et, si besoin, `role` et `duration`; la description éventuelle va après le frontmatter. Sans `role`, les descriptions dans les deux langues sont requises. Avec un `role`, les deux descriptions peuvent être omises. L'ordre des organisations et des entrées est celui de leur liste dans les métadonnées. Toute entrée doit être référencée exactement une fois.

## Accueil, navigation et coordonnées

- `src/data/site.yaml`, `home.yaml` et `about.yaml` conservent la structure et leur référence `text`.
- `src/translations/site/{en,fr}.md` contient les libellés de navigation et d'interface.
- `src/translations/home/{en,fr}.md` contient le titre, le lien vers le CV et la présentation Markdown.
- `src/translations/about/{en,fr}.md` contient le texte de contact.
- Les PDF du CV vont dans `public/documents/`; leurs chemins figurent dans la traduction de l'accueil.

Les URL internes sont construites par `src/lib/site.ts`. Le domaine du site est défini dans `astro.config.mjs` et doit rester cohérent avec `public/CNAME`.

## Validation et aperçu

Les collections Astro lisent les fichiers et valident les champs selon `src/schemas.ts`. `src/lib/content.ts` contrôle les paires de langues, les références, les identifiants, les ordres et les ressources. Une traduction manquante, inutilisée ou incomplète fait échouer le build.

Exécuter `npm run check`, puis `npm run build` et `npm run preview` pour consulter le site. Aucun test supplémentaire n'est nécessaire pour éditer des données statiques.

# Publication sur GitHub Pages

Le workflow `.github/workflows/pages.yml` exécute `npm ci`, `npm run check` et `npm run build` sur les pull requests vers `main` et les push sur `main`. La compilation refuse les contenus invalides.

Seuls les push sur `main` publient le dossier `dist/` après réussite de ces commandes. Les pull requests ne publient rien. Node.js 24 est utilisé en CI.

## Configuration GitHub

Dans le dépôt GitHub :

1. Dans **Settings → Pages → Build and deployment**, sélectionner **GitHub Actions** comme source.
2. Conserver le domaine personnalisé `www.infenix.dev` et vérifier DNS et **Enforce HTTPS**.
3. Autoriser les déploiements de `main` dans l'environnement `github-pages`. Une protection manuelle éventuelle reste applicable.

Le domaine est également configuré dans `astro.config.mjs` et `public/CNAME`.
Les permissions supplémentaires `pages: write` et `id-token: write` sont réservées au job de déploiement.

Les réglages distants doivent être vérifiés dans GitHub ; ils ne sont pas déterminés par la compilation locale. Après publication, vérifier les huit pages, les changements de langue et les deux téléchargements de CV.

Documentation officielle : [workflows personnalisés pour GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

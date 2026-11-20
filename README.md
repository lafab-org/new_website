# La Fabrique

Site web de La Fabrique, un atelier partagé (maker space) à
Strasbourg. Site statique construit avec Eleventy.

- `npm install` : installe les dépendances.
- `npm start` : sert le site en local. Les séances viennent de
  TiBillet si `TIBILLET_URL` et `TIBILLET_API_KEY` sont définies ;
  sinon l'agenda est vide. Pour utiliser plutôt les données d'exemple
  des tests, depuis la racine du projet :
  `TIBILLET_FICHIER=tests/tibillet.mjs npm start`.
- `npm run build` : génère le site dans `_site/`.
- `npm test` : lance les tests.

## Édition en ligne

Les actualités se modifient aussi dans Pages CMS, sur
<https://app.pagescms.org>, selon `.pages.yml`. L'application GitHub
Pages CMS doit être installée sur le dépôt (par un administrateur de
l'organisation) ; les éditeurs sans accès au dépôt y sont invités par
courriel, dans les réglages du projet sur Pages CMS. Chaque
enregistrement est un commit sur `main`, qui lance le déploiement.

## Déploiement

Le site est publié sur GitHub Pages à l'adresse
<https://nouveau.lafab.org/>, par le workflow
`.github/workflows/deploiement.yml`. Il se reconstruit à chaque push
sur `main`, chaque nuit à 3 h UTC (pour l'agenda et les articles en
avant), et à la demande. Si les tests ou la construction échouent,
rien n'est publié : la version précédente reste en ligne, et GitHub
envoie un courriel d'échec.

Où trouver les réglages, sur la page du dépôt :

- **Onglet Actions** : l'historique des déploiements et leurs
  journaux ; « Déploiement » → « Run workflow » pour reconstruire à la
  main (par exemple après un changement dans TiBillet).
- **Settings → Pages** : source « GitHub Actions », domaine
  `nouveau.lafab.org`, « Enforce HTTPS ».
- **Settings → Secrets and variables → Actions** : le secret
  `TIBILLET_API_KEY` (onglet Secrets), la clé TiBillet propre à la CI ;
  la variable `TIBILLET_URL` (onglet Variables), l'adresse de TiBillet.
  La clé doit pouvoir lire les évènements et les réservations : sinon,
  la construction échoue sur une erreur 403.
- **Settings → Environments → github-pages** : seule `main` peut
  déployer.

Côté DNS, chez le registraire de `lafab.org` : un enregistrement
`CNAME` de `nouveau` vers `lafab-org.github.io`.

Après 60 jours sans activité sur le dépôt, GitHub suspend la
reconstruction nocturne et prévient par courriel. Pour la reprendre :
onglet Actions → « Déploiement » → « Enable workflow ».

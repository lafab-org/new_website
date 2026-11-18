# Technique

## Édition du contenu

- Le contenu se modifie dans le dépôt, directement ou par Pages CMS,
  dans sa version hébergée, `app.pagescms.org`, par son application
  GitHub installée sur le dépôt.
- `.pages.yml`, à la racine du dépôt, déclare ce que Pages CMS modifie :
  pour chaque sorte de contenu, ses fichiers, ses champs sous leurs noms
  du front matter, et son dossier de médias. Le corps d'une page se
  modifie en Markdown.
- Les éditeurs sans accès au dépôt y sont invités par courriel, comme
  collaborateurs de Pages CMS.
- Chaque modification est un commit sur `main`, au nom et au courriel de
  l'éditeur, qui lance le déploiement.

## Édition des actualités

- Un article se crée, se modifie et se supprime dans Pages CMS.
- À sa création, son fichier est nommé `<AAAA-MM-JJ>-<titre>.md`, par
  le jour de sa création et son titre ; l'éditeur peut changer ce nom à
  la création, plus ensuite.
- Ses photos vont dans `src/actualites/photos/`.

## Édition des réalisations

- Une réalisation se crée, se modifie et se supprime dans Pages CMS.
- Ses photos vont dans `src/realisations/photos/`.

## Édition des évènements

- Une page d'évènement se crée, se modifie et se supprime dans Pages
  CMS.
- Les images de son corps vont dans `src/evenements/photos/`.

## Édition des pages et des ateliers

- Les pages de la racine de `src/` et les ateliers se modifient dans
  Pages CMS, sans création ni suppression.
- Les images des pages de la racine vont dans `src/photos/`, celles des
  ateliers dans `src/ateliers/photos/`.

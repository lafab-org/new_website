# Édition en ligne

D'autres personnes que le propriétaire du dépôt modifient le contenu du
site avec Pages CMS, dans sa version hébergée, sur invitation par
courriel. Chaque sorte de contenu y est ouverte à son tour ; avant,
les articles, les ateliers et les réalisations deviennent des fichiers
simples, leurs photos dans un dossier commun à chaque sorte.

## Outline

1. Rangement done
2. Pages CMS et actualités done
3. Réalisations done
4. Évènements done
5. Accueil en deux parties : `code-only`, le corps de `index.md` n'est
   plus coupé par le commentaire `<!-- fonctionnement -->` que lit le
   gabarit, mais d'une façon que Pages CMS conserve.
6. Pages et ateliers : /technical/edition-des-pages-et-des-ateliers.

## Lessons

- 6 : le corps est un champ `type: code` avec
  `options.format: markdown`, jamais `rich-text` : l'éditeur visuel
  change les retours à la ligne en sauts forcés et écrit un paragraphe
  par ligne ; un champ `code` sans `options` fait échouer Pages CMS.
- 6 : le `fichier` d'une photo est un chemin depuis `src/`
  commençant par `/` ; le dossier de médias de Pages CMS doit l'écrire
  tel quel (`input: src/<sorte>/photos`, `output: /<sorte>/photos`).
- 6 : une collection Pages CMS ne liste que les `*.md` directement
  dans le dossier, jamais les fichiers de données d'Eleventy qui y sont
  (`realisations.json`, `ateliers.json`).
- 6 : un gabarit qui montre des photos prend le `fichier` tel quel,
  sans construire le chemin depuis le dossier de la page.
- 6 : déclarer dans `.pages.yml` tous les champs du front matter de
  la sorte : Pages CMS supprime à l'enregistrement les champs non
  déclarés.
- 6 : pas de champ `date` dans un objet facultatif : Pages CMS
  échoue à l'enregistrement quand l'objet est absent ; un `string` avec
  un motif `AAAA-MM-JJ` le remplace.
- 6 : dès qu'un second dossier de médias existe, `media` devient une
  liste nommée et chaque champ `image` désigne le sien
  par `options.media`.
- 6 : `subfolders: false` sur chaque collection qui a un dossier
  `photos/` ; noms de collections et de médias en ASCII.
- 6 : Pages CMS n'affiche pas la description d'une collection,
  seulement celle d'un champ ; il refuse une photo de plus de 3 Mo
  environ (HTTP 413) ; la description de chaque champ image demande
  2000 px au plus en largeur et en hauteur.
- 6 : chaque champ titre a `options.maxlength: 70` : Pages CMS replie à 80 colonnes une chaîne longue, que `frontMatter()` des tests ne lit que sur sa première ligne.
- 6 : Pages CMS écrit un champ `date` sans guillemets, qu'Eleventy lit comme une Date.
- 6 : un champ de catégories est un `select` multiple qui reprend les valeurs de `src/_data/categories.json`, accents compris.
- 6 : un champ `code` n'a pas de sélecteur de médias : la description du corps dit d'envoyer d'abord la photo dans Médias, sous le libellé de son dossier, puis comment l'écrire en Markdown avec son texte alternatif.

## For the human

- Retour aux éditeurs : quand un enregistrement dans Pages CMS fait échouer le déploiement, le signaler à l'éditeur ou le rendre impossible.
- Courriels des éditeurs : chaque commit Pages CMS publie le courriel de l'éditeur dans l'historique public ; envisager les adresses noreply de GitHub.
- Photos orphelines : supprimer du dépôt les photos qu'aucune page n'utilise plus (supprimer une réalisation dans Pages CMS laisse ses photos).

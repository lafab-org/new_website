# Édition en ligne

D'autres personnes que le propriétaire du dépôt modifient le contenu du
site avec Pages CMS, dans sa version hébergée, sur invitation par
courriel. Chaque sorte de contenu y est ouverte à son tour ; avant,
les articles, les ateliers et les réalisations deviennent des fichiers
simples, leurs photos dans un dossier commun à chaque sorte.

## Outline

1. Rangement done
2. Pages CMS et actualités done
3. Réalisations : /technical/edition-des-realisations.
4. Évènements : /technical/edition-des-evenements.
5. Accueil en deux parties : `code-only`, le corps de `index.md` n'est
   plus coupé par le commentaire `<!-- fonctionnement -->` que lit le
   gabarit, mais d'une façon que Pages CMS conserve.
6. Pages et ateliers : /technical/edition-des-pages-et-des-ateliers.

## Lessons

- 5, 6 : l'éditeur visuel de Pages CMS peut perdre les commentaires
  HTML, que garde son mode Source ; rien ne dépend d'un commentaire dans
  un corps modifiable.
- 3, 4, 6 : le `fichier` d'une photo est un chemin depuis `src/`
  commençant par `/` ; le dossier de médias de Pages CMS doit l'écrire
  tel quel (`input: src/<sorte>/photos`, `output: /<sorte>/photos`).
- 3, 6 : une collection Pages CMS ne liste que les `*.md` directement
  dans le dossier, jamais les fichiers de données d'Eleventy qui y sont
  (`realisations.json`, `ateliers.json`).
- 4, 6 : un gabarit qui montre des photos prend le `fichier` tel quel,
  sans construire le chemin depuis le dossier de la page.
- 3, 4, 6 : déclarer dans `.pages.yml` tous les champs du front matter de
  la sorte : Pages CMS supprime à l'enregistrement les champs non
  déclarés.
- 3, 4, 6 : `default: ""` sur chaque champ date, sinon il prend la date
  du jour et crée l'objet facultatif qui le contient.
- 3, 6 : dès qu'un second dossier de médias existe, `media` devient une
  liste nommée et chaque champ `image` ou `rich-text` désigne le sien
  par `options.media`.
- 3, 4, 6 : `subfolders: false` sur chaque collection qui a un dossier
  `photos/` ; noms de collections et de médias en ASCII.
- 4, 6 : une image insérée depuis la médiathèque dans un corps rich-text
  a un texte alternatif vide ; la description du champ en demande un.

## For the human

- Retour aux éditeurs : quand un enregistrement dans Pages CMS fait échouer le déploiement, le signaler à l'éditeur ou le rendre impossible.
- Courriels des éditeurs : chaque commit Pages CMS publie le courriel de l'éditeur dans l'historique public ; envisager les adresses noreply de GitHub.

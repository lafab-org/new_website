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

- 2 : vérifier d'abord, sur le vrai service, que Pages CMS garde tels
  quels les noms de champs accentués (`catégories`, `résumé`, `début`).
- 2 : installer l'application GitHub Pages CMS sur
  `lafab-org/new_website` demande un administrateur de l'organisation.
- 5, 6 : l'éditeur visuel de Pages CMS peut perdre les commentaires
  HTML, que garde son mode Source ; rien ne dépend d'un commentaire dans
  un corps modifiable.
- 2, 3, 4, 6 : le `fichier` d'une photo est un chemin depuis `src/`
  commençant par `/` ; le dossier de médias de Pages CMS doit l'écrire
  tel quel (`input: src/<sorte>/photos`, `output: /<sorte>/photos`).
- 2, 3, 6 : une collection Pages CMS ne liste que les `*.md` directement
  dans le dossier, jamais les fichiers de données d'Eleventy qui y sont
  (`actualites.11tydata.js`, `realisations.json`, `ateliers.json`).
- 2, 3 : vérifier ce que fait Pages CMS quand on téléverse une photo d'un
  nom déjà présent dans le dossier de médias (écrasement possible).
- 4, 6 : un gabarit qui montre des photos prend le `fichier` tel quel,
  sans construire le chemin depuis le dossier de la page.

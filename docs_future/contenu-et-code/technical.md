# Technique

## Politique de tests et de qualité

× - Les tests sont un contrôle de forme du site construit. Ils vident
×   `_site/`, le construisent une fois par `npm run build`, puis lisent
×   `_site/` : ni serveur, ni navigateur, et sans lire les gabarits. Les
×   pages sont énumérées sur `src/`, hors les fichiers des réalisations
×   et ceux des articles non publiés le jour où les tests construisent
×   le site, chacune lue dans son fichier de `_site/`.
× - Le contrôle de forme vérifie, sur chaque page construite : la langue,
×   un titre non vide, le titre du navigateur, un seul `<h1>` portant le
×   titre, et que chaque lien interne mène à une page du site, qui porte
×   l'identifiant visé par son fragment s'il en a un ; un fragment seul
×   mène à un identifiant de sa page ; et que chaque image a un texte
×   alternatif et que son adresse mène à un fichier de `_site/`. Les liens
×   morts sont rapportés tous ensemble, chacun avec sa page. Les liens externes ne sont pas
×   vérifiés. Sur chaque source
×   d'évènement, il vérifie que les informations pratiques sont
×   renseignées et que sa catégorie est une catégorie du site ; sur
×   chaque source de page et de réalisation, que ses catégories en sont ;
×   sur chaque source d'article, que son nom de fichier commence par
×   une date `AAAA-MM-JJ` valide suivie de `-`, et que sa mise en avant,
×   s'il en a une, est bien formée. Sur la page de l'agenda, il vérifie qu'elle montre le nom
×   de chaque séance du module d'exemple, et qu'elle a un lien vers chaque
×   article en avant sur elle, le jour où les tests construisent le site ;
×   sur la page des actualités, qu'elle a un lien vers chaque article
×   publié, et que la page de chaque article non publié n'est pas dans
×   `_site/`.
× - Une affirmation de la spécification porte une étiquette seulement si
×   le contrôle de forme peut la vérifier ; les autres se terminent par
×   `(not testable)`. Elles se vérifient à la relecture, comme le contenu
×   des pages selon `contents.md` et l'apparence par `design.md`.
- Les tests valident le code sur un contenu d'exemple, dans
  `tests/contenu/`, rangé comme le contenu de `src/`, jamais sur le
  contenu de `src/`. Ils construisent le site une fois, à partir du
  code du dépôt et de ce contenu, dans un autre dossier que `_site/`,
  puis lisent ses fichiers : ni serveur, ni navigateur, et sans lire
  les gabarits.
- Le contenu d'exemple respecte les invariants de `model.md`, n'a
  aucune donnée personnelle, et réunit les cas que demandent les
  affirmations étiquetées.
- Une affirmation de `ui.md` ou d'`operations.md` porte une étiquette
  si les tests peuvent l'observer dans les fichiers construits à
  partir du contenu d'exemple : présence, ordre, texte, liens et
  attributs des éléments. Un invariant de `model.md` porte une
  étiquette si `npm run verifier` peut le vérifier. Les autres
  affirmations se terminent par `(not testable)`. L'apparence selon
  `design.md` et le contenu des pages selon `contents.md` se vérifient
  à la relecture.
- Les tests ne testent pas leurs propres fonctions d'aide. …

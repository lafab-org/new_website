# Contenus

Les objectifs éditoriaux des pages. Le texte lui-même est la source
Markdown de la page dans `src/`, relue à la revue finale.

Chaque genre de page de `ui.md` a une section, et une page a la sienne
si elle a des objectifs ou des contraintes propres. Une section donne
les objectifs de communication, puis les contraintes éditoriales qui
s'imposent au texte, s'il y en a. Les textes entre backticks (`comme
ceci`) figurent tels quels dans la page.

Contraintes communes :
- Le seul moyen de contact donné est `contact@lafab.org`, en lien
  `mailto:`.

## Page d'accueil

Objectif : souhaiter la bienvenue et mener le visiteur vers la page de
l'association, puis vers les pages d'atelier.

Contraintes :
- Titre : `La Fabrique`.
- Un lien vers la page de l'association, dans le corps de la page, avant
  ceux des ateliers.
- Un lien vers la page de l'agenda.
- Un lien vers la page des réalisations.
- Un lien vers la page des actualités.
- Un lien vers chaque page d'atelier.
- Les pages d'atelier sont listées sous `Les ateliers`, dans l'ordre
  des `ateliers` du site.

## Page de l'agenda

Objectifs :
- le curieux et l'usager voient ce qui a lieu à La Fabrique, et quand ;
- l'usager sait que la réservation et le paiement se font sur TiBillet,
  par le lien de chaque séance sur réservation.

Contraintes :
- Titre : `Agenda`.
- Un lien vers la page des évènements, avant les séances.

## Page des évènements

Objectif : le curieux et l'usager voient tous les évènements de La
Fabrique, par domaine, et vont vers leur page.

Contraintes :
- Titre : `Évènements`.
- Les évènements sont groupés, un groupe par catégorie qui a des
  évènements, dans l'ordre des `catégories` du site : le nom de la
  catégorie en sous-titre, puis un lien vers chacun de ses évènements,
  triés par titre.
- Un lien vers la page des séances par évènement.

## Page des séances par évènement

Objectif : l'usager voit, pour chaque évènement, toutes ses séances,
et va réserver.

Contraintes :
- Titre : `Séances par évènement`.

## Page des réalisations

Objectif : le curieux voit ce que les membres fabriquent à La Fabrique,
et a envie de venir faire les siens.

Contraintes :
- Titre : `Réalisations`.
- La description d'une photo dit ce qu'elle montre, en une phrase
  courte.

## Page des actualités

Objectif : le curieux voit que La Fabrique est un lieu vivant, et ce
qui s'y passe.

Contraintes :
- Titre : `Actualités`.

## Page d'article

Objectif : le curieux et l'usager apprennent une nouvelle de La
Fabrique, et ont envie d'y participer.

Contraintes :
- Le résumé, s'il y en a un, dit en une ou deux phrases de quoi parle
  l'article.
- La description de la couverture dit ce qu'elle montre, en une phrase
  courte.

## Page de l'association

Objectifs :
- le curieux comprend ce qu'est l'association et où se trouve le lieu ;
- il sait qu'il peut venir visiter pendant les portes ouvertes ;
- l'usager sait comment adhérer ;
- le bénévole voit comment aider ;
- le curieux voit les évènements de l'association.

Contraintes :
- L'adresse est celle de La Fabrique, `lieu` du site.
- Après son corps, la section `Les évènements` de ses évènements,
  comme celle de la page d'atelier.
- Un lien vers la page de l'évènement portes ouvertes.

## Page d'atelier

Objectifs, pour chaque page d'atelier :
- le curieux comprend ce qu'est l'atelier et veut venir le visiter ;
- l'usager voit le matériel, sait quelles initiations sont requises
  avant d'utiliser une machine, et sait qu'elles se réservent sur
  l'agenda ;
- le bénévole voit comment aider ;
- l'usager et le curieux voient les évènements de la page.

Contraintes :
- Un lien vers la page de l'association.
- Un lien vers la page de l'agenda.
- Après son corps, une section `Les évènements` liste chacun des
  évènements de la page, triés par titre : un lien vers sa page, avec
  son accroche s'il en a une ; sans évènement, la page n'a pas cette
  section.

## Page d'évènement

Objectifs, pour chaque page d'évènement :
- le curieux comprend le principe de l'évènement et a envie de venir ;
- l'usager sait quand venir, comment participer et quoi apporter ou
  prévoir ;
- le bénévole voit comment aider.

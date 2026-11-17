# Agenda

Les séances des évènements, lues sur TiBillet à la construction du
site, sur une page d'agenda puis sur les pages d'évènement, d'atelier
et de l'association. La réservation et le paiement se font sur
TiBillet.

## Outline

1. `seances-agenda` done
2. `seances-evenement` : /model/evenement, /ui/prochaines-seances,
   /ui/page-devenement.
3. `seances-atelier` : /model/page, /ui/page-datelier, /ui/page-de-lassociation,
   /contents/page-datelier.

## Lessons

- `seances-agenda` : les tags actuels de TiBillet (`matériaux souples`,
  `numérique, électronique`, `Repair Café`) ne suivent pas encore la
  convention ; l'agenda reste vide sur la vraie API tant qu'ils ne sont
  pas corrigés.
- `seances-agenda` : la réponse des réservations porte le nom et le
  courriel des inscrits ; `tests/tibillet.json` s'écrit à la main,
  jamais copié d'une réponse réelle.

# Contenu et code

Le dépôt se partage entre le contenu, que les éditeurs modifient, et le
code. Le contenu réel est vérifié par sa propre commande, qui bloque la
publication et rend compte dans GitHub Actions ; les tests valident le
code sur un contenu d'exemple, et peuvent alors vérifier ce que les
pages montrent.

## Outline

1. Vérification du contenu done
2. Contenu d'exemple done
3. Pages communes : `tests-only`, étiqueter ce que les tests peuvent
   observer de /ui/page, /ui/en-tete et /ui/page-daccueil.
4. Ateliers et association : `tests-only`, étiqueter ce que les tests
   peuvent observer de /ui/page-datelier et /ui/page-de-lassociation.
5. Agenda et évènements : `tests-only`, étiqueter ce que les tests
   peuvent observer de /ui/page-devenement, /ui/seance,
   /ui/page-de-lagenda, /ui/page-des-evenements,
   /ui/page-des-seances-par-evenement, /ui/prochaines-seances et
   /operations/construire-le-site.
6. Actualités et réalisations : `tests-only`, étiqueter ce que les
   tests peuvent observer de /ui/page-des-realisations,
   /ui/page-des-actualites, /ui/page-darticle et /ui/articles-en-avant.
7. Invariants du contenu : `code-only`, étiqueter les invariants de
   `model.md` que `npm run verifier` peut vérifier, et les lui faire
   vérifier.

## Lessons

- 2 : les tests qui citent un invariant de /model passent dans `npm run verifier` ; ceux qui restent ne lisent plus `src/`.
- 3–6 : le contenu d'exemple ajoute un cas seulement quand une affirmation étiquetée le demande.
- 2 : `scripts/verifier.mjs` est la référence des contrôles d'invariants ; la lecture du front matter de `tests/site.test.mjs` laisse passer une valeur vide.
- 7 : `/model/bloc/section`, `/model/site/blocs`, `/model/site/corps` et `/model/site/tirage` sont étiquetés mais `(not testable)` : le vérificateur ne les contrôle pas encore ; la construction échoue déjà sur les trois premiers.

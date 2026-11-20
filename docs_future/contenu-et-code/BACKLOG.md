# Contenu et code

Le dépôt se partage entre le contenu, que les éditeurs modifient, et le
code. Le contenu réel est vérifié par sa propre commande, qui bloque la
publication et rend compte dans GitHub Actions ; les tests valident le
code sur un contenu d'exemple, et peuvent alors vérifier ce que les
pages montrent.

## Outline

1. Vérification du contenu done
2. Contenu d'exemple done
3. Pages communes done
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

- 4–6 : le contenu d'exemple ajoute un cas seulement quand une affirmation étiquetée le demande.
- 4–6 : un cas qui dépend du jour se fixe par des dates lointaines (2020, 2999), jamais par des dates proches.
- 4–6 : les tests reconnaissent une image par son texte alternatif, non par son adresse, que la spécification laisse libre.
- 4–6 : les tests lisent une page dans l'ordre de lecture, avant et après son <h1>, jamais par le nom d'un élément (<header>, <main>, classes) que la spécification ne fixe pas.
- 4–6 : un cas vide d'un bloc ou d'une section (sans séance, sans réalisation, sans article) reste (not testable) : les tests construisent une seule fois, avec un contenu qui a ces éléments.
- 5 : décider le regroupement par jour de /ui/page-de-lagenda avec celui du bloc `semaine` de /ui/page-daccueil et de /ui/prochaines-seances.
- 4–7 : la couverture des invariants de /model se vérifie par `check.py tests tests scripts/verifier.mjs` ; sans argument, le script ne lit pas le vérificateur.
- 7 : `/model/bloc/section`, `/model/site/blocs`, `/model/site/corps` et `/model/site/tirage` sont étiquetés mais `(not testable)` : le vérificateur ne les contrôle pas encore ; la construction échoue déjà sur les trois premiers.

## For the human

- Contrôle de couverture : dire dans `CLAUDE.md` de lancer `check.py tests tests scripts/verifier.mjs`, et signaler à Dev43 que `check.py tests` sans argument ignore un vérificateur hors de `tests/`.

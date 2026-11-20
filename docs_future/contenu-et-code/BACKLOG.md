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
4. Ateliers et association done
5. Agenda et évènements done
6. Actualités et réalisations done
7. Invariants du contenu : `code-only`, étiqueter les invariants de
   `model.md` que `npm run verifier` peut vérifier, et les lui faire
   vérifier.

## Lessons

- 7 : la couverture des invariants de /model se vérifie par `check.py tests tests scripts/verifier.mjs` ; sans argument, le script ne lit pas le vérificateur.
- 7 : `/model/bloc/section`, `/model/site/blocs`, `/model/site/corps` et `/model/site/tirage` sont étiquetés mais `(not testable)` : le vérificateur ne les contrôle pas encore ; la construction échoue déjà sur les trois premiers.
- 7 : `tests/contenu/realisations/` a désormais trois réalisations, dont une à une seule photo ; le tirage les prend toutes (au plus trois) — une quatrième rendrait le bloc `realisations` aléatoire.

## For the human

- Contrôle de couverture : dire dans `CLAUDE.md` de lancer `check.py tests tests scripts/verifier.mjs`, et signaler à Dev43 que `check.py tests` sans argument ignore un vérificateur hors de `tests/`.
- Données d'exemple TiBillet : `at()` de `tests/tibillet.mjs` prend le décalage horaire une heure avant l'heure locale ; un jour de changement d'heure, une séance d'exemple peut être décalée et faire échouer `npm test`, donc le déploiement.

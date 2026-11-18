---
title: "Évènements"
templateEngineOverride: njk,md
layout: base.njk
---

Tout ce que propose La Fabrique au fil de l'année : ateliers
accompagnés, initiations aux machines, clubs, temps forts de
l'association. Chaque évènement a sa page, qui dit quand venir, comment
participer et ce qu'il faut prévoir. Les prochaines dates de chacun
sont réunies sur la page des [séances par évènement](/seances).
{% for groupe in collections.evenementsParCategorie %}
## {{ groupe.nom }}

{% for p in groupe.pages -%}
- [{{ p.data.title }}]({{ p.url }})
{% endfor -%}
{% endfor %}

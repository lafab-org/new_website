---
title: "La Fabrique"
templateEngineOverride: njk,md
---

Bienvenue à La Fabrique, atelier partagé à Strasbourg, que fait vivre
[l'association](/association). Ses prochaines séances sont dans
l'[agenda](/agenda). Les [réalisations](/realisations) de ses membres montrent ce
qu'on peut y fabriquer.

## Les ateliers

{% for p in collections.pagesAtelier -%}
- [{{ p.data.title }}]({{ p.url }})
{% endfor %}
## Les évènements
{% for groupe in collections.evenementsParCategorie %}
### {{ groupe.nom }}

{% for p in groupe.pages -%}
- [{{ p.data.title }}]({{ p.url }})
{% endfor -%}
{% endfor %}

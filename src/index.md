---
title: "La Fabrique"
templateEngineOverride: njk,md
---

Bienvenue à La Fabrique, atelier partagé à Strasbourg.

## Les ateliers

{% for p in collections.pagesAtelier -%}
- [{{ p.data.title }}]({{ p.url }})
{% endfor %}
## Les évènements
{% for groupe in collections.evenementsParAtelier %}
### {{ groupe.titre }}

{% for p in groupe.pages -%}
- [{{ p.data.title }}]({{ p.url }})
{% endfor -%}
{% endfor %}

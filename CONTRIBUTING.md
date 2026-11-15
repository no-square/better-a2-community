# Contributing routes

The route library accepts native route packages exported by Better A2 or ESP. Each published package contains one route, which keeps browsing and importing simple.

## Route package requirements

- Export the route from Better A2 as JSON or from ESP as `.a2routes`. Keep the native route data intact.
- Use the matching world and faction directory under `routes/`.
- Add a catalog entry in `site/data/catalog.json` with the website-relative package path (`data/routes/<world>/<faction>/<slug>.<extension>`), platform (`Better A2` or `ESP`), route name, world, faction, resource summary, author credit, verification status, and `added_at` as an ISO 8601 UTC timestamp (for example, `2026-11-15T12:30:00Z`).
- Include a short note describing the route's intended direction or notable hazards in the catalog description.
- Never include account credentials, character profiles, network captures, or unrelated files.

## Review and publication

Routes are checked by the maintainer before appearing on the website. BA2 RRM detects the package format, previews its points on the map, and publishes the native package for the selected platform. The review checks that the world and faction are correct and the route points are visible in the expected area. Only the maintainer changes a route's status to `verified`.

Submit a native package through the website form. The maintainer reviews and publishes it; consider the route published once it appears in the catalog.

# Contributing routes

The route library accepts data exported by Better A2. Each published JSON package contains one route, which keeps browsing and importing simple.

## Route package requirements

- Export the route from Better A2 as JSON. Keep the `format`, `version`, route fields, and point fields intact.
- Use the matching world and faction directory under `routes/`.
- Add a catalog entry in `site/data/catalog.json` with the website-relative package path (`data/routes/<world>/<faction>/<slug>.json`), route name, world, faction, resource summary, author credit, and verification status.
- Include a short note describing the route's intended direction or notable hazards in the catalog description.
- Never include account credentials, character profiles, network captures, or unrelated files.

## Review and publication

Routes are checked by the maintainer before appearing on the website. The review checks that the JSON imports into BA2, the world and faction are correct, the route points are visible in the expected area, and any automation claims are accurately labeled. Only the maintainer changes a route's status to `verified`.

The website currently has no upload form. A no-GitHub-account submission channel will be connected before opening public route submissions; until then, do not treat a route as published until it appears in the catalog.

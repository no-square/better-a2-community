# Better A2 Community Hub

Public home for the Better A2 project and its community route library. The desktop application and its update releases remain in [`no-square/bettera2`](https://github.com/no-square/bettera2); this repository is for the website, route catalog, and contribution guidance.

## Repository layout

- `routes/` — BA2-exported route packages, organized by world and faction.
- `site/` — static website published with GitHub Pages: Home, Announcements, BA2, ESP, and Route Library.
- `CONTRIBUTING.md` — route package rules and review process.
- `.github/workflows/pages.yml` — deploys the site from `main`.

Route files must remain valid Better A2 route package JSON (`format: better-a2-routes`, `version: 1`). Do not hand-edit route point data unless it is validated by importing it into BA2. Public submissions should not include logs, captures, profiles, or other personal data.

## Preview locally

Serve the `site/` directory with a local static web server (for example, `python -m http.server 8000 --directory site`) and open `http://localhost:8000/`. Route catalog data is loaded from `site/data/catalog.json`; route packages are copied into `site/data/routes/` during Pages deployment.

In catalog entries, `package` is a URL relative to the website root, such as `data/routes/World_L_A/Elyos/example.json`. In the source tree, the matching package lives at `routes/World_L_A/Elyos/example.json`.

## Publish with GitHub Pages

1. Create the public repository `no-square/better-a2-community` and push this folder to its `main` branch.
2. In **Settings → Pages**, set the build and deployment source to **GitHub Actions**.
3. Push a change to `main`. The workflow publishes the `site/` directory and route data.

Expected website address: `https://no-square.github.io/better-a2-community/`.

The Pages site is informational and does not accept file uploads. A no-account submission form needs a small backend/form provider and will be added as a separate step; for now, route files are curated into this repository by the maintainer.

# Announcements automation

The Announcements page is built from two sources during the GitHub Pages deployment:

- Public GitHub Releases in `no-square/bettera2` and `no-square/a2eg`.
- Route entries in `site/data/catalog.json`, grouped by their `added_at` UTC date and platform.

The Pages workflow runs on site or route changes, on manual dispatch, and every 12 hours (`00:17` and `12:17` UTC). It creates `site/data/announcements.json` in the deployment workspace and publishes it with the site. It does not make an automated commit to `main`.

## Publishing a software announcement

Create and publish a GitHub Release in the appropriate product repository. Put the user-facing change summary in the Release notes / Description field. The website reads the tag, publish date, notes, and release link; it classifies the entry as **BETA**, **STABLE**, or **HOTFIX** from the GitHub pre-release flag and the tag (`beta`, `HF`, or `hotfix`). Current tag examples include `v0.0.3-beta.7`, `v3.0`, and `v2.9.5_HF13`.

The initial `release_since` value in `site/data/announcements-config.json` prevents previously announced releases from being reposted. Move it earlier only if older releases should also appear. The configured time is UTC.

## Route announcements

When a reviewed route is added to the catalog, its `added_at` value determines the UTC day and its `platform` determines whether it is counted under Better A2 or ESP. The site shows one daily summary per date with at least one catalogued route, for the most recent 30 days. Keep `added_at` on every catalog entry; entries without a valid date are omitted from the daily totals. Set `routes_since` in the config if the page should ignore older route additions.

The Announcements page keeps its existing editorial cards. Generated release and route cards appear before them. If GitHub's public release API is temporarily unavailable, the workflow still deploys route summaries and the existing editorial cards.

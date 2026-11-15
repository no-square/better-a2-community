# Route package storage

Store one native route package per file:

```text
routes/<world>/<faction>/<slug>.json       # Better A2
routes/<world>/<faction>/<slug>.a2routes   # ESP
```

Supported world keys are `World_L_A`, `World_D_A`, and `Abyss_Reshanta_A`. Use `Asmodian`, `Elyos`, or `Shared` for the faction directory. Set `platform` to `Better A2` or `ESP` and `added_at` to the catalog-entry creation time as an ISO 8601 UTC timestamp in `site/data/catalog.json`. Keep listing metadata out of the native route package.

# Route package storage

Store one BA2-exported route package per JSON file:

```text
routes/<world>/<faction>/<slug>.json
```

Examples of world directory keys are `World_L_A`, `World_D_A`, and `Abyss_Reshanta_A`. Use `Asmodian`, `Elyos`, or `Shared` for the faction directory. Keep display names and descriptions in `site/data/catalog.json`; do not add metadata keys to the BA2 package because the importer validates its schema strictly.

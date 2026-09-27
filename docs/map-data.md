# Department map data

The bundled paths in `data/department-map.json` come from
[France GeoJSON](https://github.com/gregoiredavid/france-geojson), using its
`departements-avec-outre-mer.geojson` file retrieved on 2026-09-27.
The upstream source is IGN Admin Express COG 2018, published under the
[Etalab Open Licence](https://www.etalab.gouv.fr/licence-ouverte-open-licence/).
Attribution is also displayed alongside the map.

The data is simplified and projected for a small interactive illustration,
not navigation. Mainland France and Corsica share one projection; the five
overseas departments are independently fitted to labelled inset boxes.
The map represents department codes on observed plates, not observation locations.

To regenerate, download the upstream GeoJSON to a temporary path, then run:

```bash
python3 scripts/generate-department-map.py /tmp/plated-departments.geojson
```

Generation uses only the Python standard library. No geography API or network
request is needed by the application at runtime. All 101 catalog departments
must have exactly one path, as checked by the unit tests.

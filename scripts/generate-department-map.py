"""Generate the bundled SVG paths: python3 scripts/generate-department-map.py input.geojson.

Input: gregoiredavid/france-geojson/departements-avec-outre-mer.geojson
IGN Admin Express 2018, Open Licence. See docs/map-data.md.
"""
import json
import math
import sys
from pathlib import Path


def simplify(points, tolerance=0.35):
    if len(points) <= 2:
        return points
    ax, ay = points[0]
    bx, by = points[-1]
    dx, dy = bx - ax, by - ay
    denominator = dx * dx + dy * dy
    distances = []
    for x, y in points[1:-1]:
        t = max(0, min(1, ((x - ax) * dx + (y - ay) * dy) / denominator)) if denominator else 0
        distances.append(math.hypot(x - ax - t * dx, y - ay - t * dy))
    furthest = max(distances, default=0)
    if furthest <= tolerance:
        return [points[0], points[-1]]
    split = distances.index(furthest) + 1
    return simplify(points[:split + 1], tolerance)[:-1] + simplify(points[split:], tolerance)


features = json.loads(Path(sys.argv[1]).read_text())['features']
output = []
for feature in features:
    code = feature['properties']['code']
    geometry = feature['geometry']
    polygons = [geometry['coordinates']] if geometry['type'] == 'Polygon' else geometry['coordinates']
    points = [point for polygon in polygons for ring in polygon for point in ring]
    # Equirectangular projection with longitude corrected for latitude.
    cosine = math.cos(math.radians(sum(p[1] for p in points) / len(points))) if len(code) == 3 else math.cos(math.radians(46.5))
    projected = [[[ (p[0] * cosine, -p[1]) for p in ring] for ring in polygon] for polygon in polygons]
    if len(code) == 3:
        all_points = [p for poly in projected for ring in poly for p in ring]
        min_x, max_x = min(p[0] for p in all_points), max(p[0] for p in all_points)
        min_y, max_y = min(p[1] for p in all_points), max(p[1] for p in all_points)
        scale = 75 / max(max_x - min_x, max_y - min_y)
        transform = lambda p: (12 + (p[0] - min_x) * scale, 12 + (p[1] - min_y) * scale)
    else:
        transform = lambda p: (12 + (p[0] + 5.3 * cosine) * 36, 12 + (p[1] + 51.2) * 36)
    paths = []
    for polygon in projected:
        for ring in polygon:
            transformed = simplify([transform(p) for p in ring])
            if len(transformed) >= 3:
                paths.append('M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in transformed) + 'Z')
    output.append({'code': code, 'path': ''.join(paths)})
output.sort(key=lambda entry: entry['code'])
Path('data/department-map.json').write_text(json.dumps(output, separators=(',', ':')) + '\n')
print(f'Generated {len(output)} department paths')

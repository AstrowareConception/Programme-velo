#!/usr/bin/env python3
"""Add discovery landmarks from cached historic GPX files, without changing terrain."""
import hashlib
import json
import math
import xml.etree.ElementTree as ET
from pathlib import Path

sources = {
    'lac-der-balade': ('der', 'Giffaumont · départ', 'Giffaumont · retour', [
        ('Chantecoq · secteur de la digue', (48.569444, 4.700556)), ('Nuisement · secteur nord du lac', (48.6032566, 4.74577366)), ('Champaubert · secteur de la presqu’île', (48.5512488, 4.79250859))]),
    'annecy-rive-ouest': ('annecy', 'Bredannaz', 'Annecy · arrivée sur la voie verte', [
        ('Duingt', (45.827, 6.204)), ('Saint-Jorioz · voie verte', (45.833, 6.168)), ('Sevrier · voie verte', (45.862133, 6.143079))]),
    'chambord-petit-tour': ('chambord', 'Chambord · départ dans le domaine', 'Chambord · retour dans le domaine', []),
    're-chemins-campagne': ('re', 'Saint-Martin-de-Ré · départ', 'La Couarde-sur-Mer · arrivée', []),
    'marais-poitevin-coulon-damvix': ('coulon', 'Coulon', 'Damvix', [('Irleau · secteur du marais', (46.30784, -0.64963))]),
    'canal-midi-carcassonne': ('midi', 'Carcassonne · port du canal', 'Marseillette · canal', [('Trèbes · port du canal', (43.210, 2.442))]),
    'loire-tours-villandry': ('loire', 'Tours', 'Villandry · arrivée sur l’itinéraire', [('Berges du Cher', (47.374165, 0.649285))])
}

def distance(a, b):
    a, b, c, d = map(math.radians, (*a, *b))
    return 12742 * math.asin(min(1, math.sqrt(math.sin((c-a)/2)**2 + math.cos(a)*math.cos(c)*math.sin((d-b)/2)**2)))

catalogue = json.loads(Path('lib/scenic-profiles.json').read_text())
result = {}
for route_id, (key, start, finish, anchors) in sources.items():
    raw = Path(f'.cache/scenic-profiles/{key}.gpx').read_bytes()
    if hashlib.sha256(raw).hexdigest() != catalogue[route_id]['provenance']['gpxSha256']:
        raise ValueError(f'{route_id}: historic GPX changed; do not silently update landmarks')
    points = []
    for node in ET.fromstring(raw).iter():
        if node.tag.split('}')[-1] not in ('trkpt', 'rtept'):
            continue
        p = [float(node.attrib['lat']), float(node.attrib['lon'])]
        if not points or distance(points[-1], p) > 0.000001:
            points.append(p)
    cumulative = [0]
    for a, b in zip(points, points[1:]):
        cumulative.append(cumulative[-1]+distance(a, b))
    if abs(cumulative[-1] - catalogue[route_id]['distanceKm']) > 0.000001:
        raise ValueError(f'{route_id}: distance mismatch')
    positions = [(0, start), (len(points)-1, finish)]
    for label, coordinate in anchors:
        i = min(range(len(points)), key=lambda j: distance(points[j], coordinate))
        if distance(points[i], coordinate) > 1:
            raise ValueError(f'{route_id}: landmark {label} too far from historic trace')
        positions.append((i, label))
    positions.sort()
    result[route_id] = [{'label': label, 'landmark': 'Repère de découverte sur la trace officielle ; emplacement indicatif, sans détour de visite.', 'km': round(cumulative[i], 6)} for i, label in positions]
    print(route_id, [(place['label'], round(place['km'], 1)) for place in result[route_id]])
Path('lib/legacy-route-places.json').write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':'))+'\n')

#!/usr/bin/env python3
"""Build indoor discovery terrain from the documented official GPX files.

Uses Python's standard library only. Does not change the historic scenic profiles.
Landmarks are projected onto the source geometry, never onto a straight city link.
"""
import bisect
import argparse
import hashlib
import json
import math
import statistics
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import io
import zipfile
from datetime import datetime, timezone
from pathlib import Path

CACHE = Path('.cache/scenic-profiles')
CACHE.mkdir(parents=True, exist_ok=True)


def distance(a, b):
    lat1, lon1, lat2, lon2 = map(math.radians, (*a[:2], *b[:2]))
    h = math.sin((lat2-lat1)/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin((lon2-lon1)/2)**2
    return 12742 * math.asin(min(1, math.sqrt(h)))


def interpolate(points, cumulative, km):
    i = min(len(points)-1, max(1, bisect.bisect_left(cumulative, km)))
    fraction = (km-cumulative[i-1]) / max(1e-9, cumulative[i]-cumulative[i-1])
    return [a+(b-a)*fraction if a is not None and b is not None else None for a, b in zip(points[i-1], points[i])]


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--sources', default='scripts/exploration-sources.json')
parser.add_argument('--output', default='lib/exploration-profiles.json')
args = parser.parse_args()

result = {}
for route_id, source in json.loads(Path(args.sources).read_text()).items():
    path = CACHE / (source['key']+'.gpx')
    if not path.exists():
        request = urllib.request.Request(source['gpxUrl'], headers={'User-Agent': 'Mozilla/5.0 (VeloQuest geographic profile builder)'})
        downloaded = urllib.request.urlopen(request, timeout=30).read()
        if source.get('gpxMember'):
            downloaded = zipfile.ZipFile(io.BytesIO(downloaded)).read(source['gpxMember'])
        path.write_bytes(downloaded)
    raw = path.read_bytes()
    if source.get('gpxSha256') and hashlib.sha256(raw).hexdigest() != source['gpxSha256']:
        raise ValueError(f'{route_id}: published GPX changed; review before rebuilding')
    geometry = ET.fromstring(raw)
    if source.get('trackName'):
        tracks = [node for node in geometry.iter() if node.tag.split('}')[-1] == 'trk'
                  and any(child.tag.split('}')[-1] == 'name' and child.text == source['trackName'] for child in node)]
        if len(tracks) != 1 or not source.get('trackOnly'):
            raise ValueError(f'{route_id}: expected one named track; do not join alternative itineraries')
        geometry = tracks[0]
    points = []
    for node in geometry.iter():
        if node.tag.split('}')[-1] not in (('trkpt',) if source.get('trackOnly') else ('trkpt', 'rtept')):
            continue
        altitude = next((float(child.text) for child in node if child.tag.split('}')[-1] == 'ele'), None)
        if (altitude is None and source.get('altitudeSource') != 'IGN RGE ALTI') or (altitude is not None and not math.isfinite(altitude)):
            raise ValueError(f'{route_id}: missing official elevation; do not invent terrain')
        point = [float(node.attrib['lat']), float(node.attrib['lon']), altitude]
        if not points or distance(points[-1], point) > 0.000001:
            points.append(point)
    if len(points) < 2:
        raise ValueError(f'{route_id}: insufficient geometry')
    if 'pointRange' in source:
        start, finish = source['pointRange']
        if not source.get('gpxSha256') or not 0 <= start < finish <= len(points):
            raise ValueError(f'{route_id}: point selection requires a pinned source and valid bounds')
        points = points[start:finish]
    if source.get('reverse'):
        points.reverse()
    if 'clip' in source:
        start, finish = [min(range(len(points)), key=lambda i: distance(points[i], anchor)) for anchor in source['clip']]
        if source.get('clipFinishAtEnd'):
            finish = len(points)-1
        if start >= finish or any(distance(points[i], anchor) > 0.05 for i, anchor in zip((start, finish), source['clip'])):
            raise ValueError(f'{route_id}: clipped section no longer matches its endpoints/direction')
        points = points[start:finish+1]
    cumulative = [0]
    for a, b in zip(points, points[1:]):
        cumulative.append(cumulative[-1] + distance(a, b))
    length = cumulative[-1]
    if source.get('trackOnly') and any(distance(a, b) > 1 for a, b in zip(points, points[1:])):
        raise ValueError(f'{route_id}: discontinuous geometry; do not connect separate tracks')
    places, landmark_indices = [], []
    for anchor in source['places']:
        if anchor.get('endpoint') == 'start':
            i = 0
        elif anchor.get('endpoint') == 'finish':
            i = len(points)-1
        else:
            i = min(range(len(points)), key=lambda j: distance(points[j], anchor['coordinate']))
            if distance(points[i], anchor['coordinate']) > 0.05:
                raise ValueError(f"{route_id}: landmark {anchor['label']} no longer matches")
        if landmark_indices and i <= landmark_indices[-1]:
            raise ValueError(f"{route_id}: invalid landmark order at {anchor['label']}")
        landmark_indices.append(i)
        places.append({'label': anchor['label'], 'landmark': anchor['landmark'], 'km': round(cumulative[i], 6)})
    stations = [i*0.25 for i in range(math.ceil(length/0.25))] + [length]
    sampled = [interpolate(points, cumulative, km) for km in stations]
    if source.get('altitudeSource') == 'IGN RGE ALTI':
        for offset in range(0, len(sampled), 50):
            batch = sampled[offset:offset+50]
            params = urllib.parse.urlencode({'lat': '|'.join(f'{p[0]:.7f}' for p in batch),
                'lon': '|'.join(f'{p[1]:.7f}' for p in batch), 'resource': 'ign_rge_alti_wld',
                'delimiter': '|', 'indent': 'false', 'measures': 'false', 'zonly': 'false'})
            cached = CACHE / f'{route_id}-ign-{offset}.json'
            if not cached.exists():
                cached.write_bytes(urllib.request.urlopen('https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json?'+params, timeout=30).read())
            elevations = json.loads(cached.read_bytes())['elevations']
            if len(elevations) != len(batch):
                raise ValueError(f'{route_id}: incomplete IGN elevations')
            for point, elevation in zip(batch, elevations):
                z = elevation['z']
                if not math.isfinite(z) or z <= -999:
                    raise ValueError(f'{route_id}: missing IGN terrain elevation')
                point[2] = z
    median = [statistics.median(p[2] for p in sampled[max(0, i-1):i+2]) for i in range(len(sampled))]
    smooth = [statistics.mean(median[max(0, i-1):i+2]) for i in range(len(sampled))]
    smooth[0], smooth[-1] = sampled[0][2], sampled[-1][2]
    indices = sorted(set(range(0, len(sampled), 2)) | {len(sampled)-1})
    if len(indices) > 2 and length-stations[indices[-2]] < 0.125:
        indices.pop(-2)
    profile = []
    for i in indices:
        km, elevation = round(stations[i], 6), round(smooth[i], 2)
        grade = 0 if not profile else (elevation-profile[-1]['elevation'])/((km-profile[-1]['km'])*10)
        profile.append({'km': km, 'elevation': elevation, 'grade': round(grade, 3)})
    stride = max(1, math.ceil((len(points)-1)/(259-len(places))))
    geometry_indices = sorted(set(range(0, len(points), stride)) | {len(points)-1} | set(landmark_indices))
    gain = sum(max(0, b['elevation']-a['elevation']) for a, b in zip(profile, profile[1:]))
    provenance = {'gpxUrl': source['gpxUrl'], 'gpxSha256': hashlib.sha256(raw).hexdigest(),
                  'altitudeSource': source.get('altitudeSource', 'GPX officiel'), 'checkedOn': datetime.now(timezone.utc).date().isoformat(), 'profileStepM': 500}
    if source.get('gpxMember'):
        provenance['gpxMember'] = source['gpxMember']
    if source.get('trackName'):
        provenance['trackName'] = source['trackName']
    if 'section' in source:
        provenance['section'] = source['section']
    result[route_id] = {
        'distanceKm': round(length, 6), 'elevationGainM': round(gain),
        'startElevationM': round(profile[0]['elevation']), 'finishElevationM': round(profile[-1]['elevation']),
        'avgGrade': round((profile[-1]['elevation']-profile[0]['elevation'])/(length*10), 3),
        'maxGrade': max(p['grade'] for p in profile), 'profile': profile,
        'coordinates': [[round(points[i][0], 7), round(points[i][1], 7)] for i in geometry_indices],
        'coordinateKm': [round(cumulative[i], 6) for i in geometry_indices],
        'places': places, 'provenance': provenance,
    }
    print(route_id, round(length, 2), f'{round(gain)} m D+', f"max {result[route_id]['maxGrade']}%", flush=True)

Path(args.output).write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':'))+'\n')

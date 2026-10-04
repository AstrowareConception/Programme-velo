#!/usr/bin/env python3
"""Rebuild the factual route geometry and smoothed terrain used by scenic rides.

Official public GPX files supply geometry. GPX elevations are used when complete;
otherwise IGN RGE ALTI supplies terrain elevation. No elevation is invented.
Run from the repository root: python3 scripts/build-scenic-profiles.py.
"""
import bisect
import hashlib
import json
import math
import statistics
from datetime import datetime, timezone
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

SOURCES = {
    "lac-der-balade": ("der", "https://medias.tourism-system.com/traces/5121077/GPX/le_tour_du_lac_du_der_a_velo-1.gpx"),
    "annecy-rive-ouest": ("annecy", "https://geotrek.auvergnerhonealpes-tourisme.com/api/fr/treks/3963/tour-des-bauges-a-velo-lac-dannecy-de-doussard-a-annecy.gpx"),
    "chambord-petit-tour": ("chambord", "https://medias.tourism-system.com/traces/3114004/GPX/chambord_a_velo_-_petit_parcours-1.gpx"),
    "re-chemins-campagne": ("re", "https://static.apidae-tourisme.com/filestore/objets-touristiques/plans/40/78/16207400/balade-velo-72444-cheminencampagne.gpx"),
    "marais-poitevin-coulon-damvix": ("coulon", "https://www.francevelotourisme.com/etape/gpx/173"),
    "canal-midi-carcassonne": ("midi", "https://www.francevelotourisme.com/etape/gpx/254"),
    "loire-tours-villandry": ("loire", "https://www.francevelotourisme.com/etape/gpx/106"),
}
CACHE = Path(".cache/scenic-profiles")
CACHE.mkdir(parents=True, exist_ok=True)


def download(url, path):
    if not path.exists():
        request = urllib.request.Request(url, headers={"User-Agent": "VeloQuest geographic profile builder"})
        path.write_bytes(urllib.request.urlopen(request, timeout=30).read())
    return path.read_bytes()


def distance(a, b):
    lat1, lon1, lat2, lon2 = map(math.radians, (*a[:2], *b[:2]))
    h = math.sin((lat2-lat1)/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin((lon2-lon1)/2)**2
    return 12742 * math.asin(min(1, math.sqrt(h)))


def interpolate(points, cumulative, km):
    i = min(len(points)-1, max(1, bisect.bisect_left(cumulative, km)))
    fraction = (km-cumulative[i-1]) / max(1e-9, cumulative[i]-cumulative[i-1])
    return [a+(b-a)*fraction if a is not None and b is not None else None for a, b in zip(points[i-1], points[i])]


result = {}
for route_id, (key, url) in SOURCES.items():
    raw = download(url, CACHE / (key+".gpx"))
    root = ET.fromstring(raw)
    points = []
    for node in root.iter():
        if node.tag.split("}")[-1] not in ("trkpt", "rtept"):
            continue
        altitude = next((float(child.text) for child in node if child.tag.split("}")[-1] == "ele"), None)
        point = [float(node.attrib["lat"]), float(node.attrib["lon"]), altitude]
        if not points or distance(points[-1], point) > 0.000001:
            points.append(point)
    if len(points) < 2:
        raise ValueError(f"{route_id}: insufficient geometry")
    cumulative = [0]
    for a, b in zip(points, points[1:]):
        cumulative.append(cumulative[-1] + distance(a, b))
    length = cumulative[-1]
    stations = [i*0.25 for i in range(math.ceil(length/0.25))] + [length]
    sampled = [interpolate(points, cumulative, km) for km in stations]
    uses_ign = any(point[2] is None for point in points)
    if uses_ign:
        for offset in range(0, len(sampled), 50):
            batch = sampled[offset:offset+50]
            params = urllib.parse.urlencode({
                "lat": "|".join(f"{p[0]:.7f}" for p in batch),
                "lon": "|".join(f"{p[1]:.7f}" for p in batch),
                "resource": "ign_rge_alti_wld", "delimiter": "|",
                "indent": "false", "measures": "false", "zonly": "false",
            })
            cache_path = CACHE / f"{key}-ign-{offset}.json"
            answer = json.loads(download("https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json?"+params, cache_path))
            elevations = answer["elevations"]
            if len(elevations) != len(batch):
                raise ValueError(f"{route_id}: incomplete IGN elevations")
            for point, elevation in zip(batch, elevations):
                z = elevation["z"]
                if not math.isfinite(z) or z <= -999:
                    raise ValueError(f"{route_id}: missing terrain elevation")
                point[2] = z
    # Median then a distance-based local mean suppress GPS/DEM spikes, without
    # inventing climbs. Preserve the source's endpoints, then retain every 500 m.
    median = [statistics.median(p[2] for p in sampled[max(0, i-1):i+2]) for i in range(len(sampled))]
    smooth = [statistics.mean(median[max(0, i-1):i+2]) for i in range(len(sampled))]
    smooth[0], smooth[-1] = sampled[0][2], sampled[-1][2]
    indices = sorted(set(range(0, len(sampled), 2)) | {len(sampled)-1})
    profile = []
    for i in indices:
        km, elevation = round(stations[i], 6), round(smooth[i], 2)
        grade = 0 if not profile else (elevation-profile[-1]["elevation"])/((km-profile[-1]["km"])*10)
        profile.append({"km": km, "elevation": elevation, "grade": round(grade, 3)})
    # Keep bends for the map, independently from the training profile's stations.
    stride = max(1, math.ceil((len(points)-1)/259))
    coords = [points[i][:2] for i in sorted(set(range(0, len(points), stride)) | {len(points)-1})]
    gain = sum(max(0, b["elevation"]-a["elevation"]) for a, b in zip(profile, profile[1:]))
    result[route_id] = {
        "distanceKm": round(length, 6), "elevationGainM": round(gain),
        "startElevationM": round(profile[0]["elevation"]), "finishElevationM": round(profile[-1]["elevation"]),
        "avgGrade": round((profile[-1]["elevation"]-profile[0]["elevation"])/(length*10), 3),
        "maxGrade": max(p["grade"] for p in profile), "coordinates": coords, "profile": profile,
        "provenance": {"gpxUrl": url, "gpxSha256": hashlib.sha256(raw).hexdigest(),
                       "altitudeSource": "IGN RGE ALTI" if uses_ign else "GPX officiel",
                       "checkedOn": datetime.now(timezone.utc).date().isoformat(), "profileStepM": 500},
    }
    print(route_id, round(length, 2), f"{round(gain)} m D+", f"max {result[route_id]['maxGrade']}%", result[route_id]["provenance"]["altitudeSource"], flush=True)

Path("lib/scenic-profiles.json").write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":"))+"\n")

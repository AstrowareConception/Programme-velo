import type { ClimbChallenge } from "./routes";

type RawPoint = { lat: number; lon: number; elevation: number };

function haversineKm(a: RawPoint, b: RawPoint) {
  const r = 6371;
  const toRad = (v: number) => v * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

function downsample<T>(items: T[], max: number) {
  if (items.length <= max) return items;
  const step = (items.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => items[Math.round(i * step)]);
}

function safeNumber(value: string | null, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export async function parseGpxFile(file: File): Promise<ClimbChallenge> {
  const xml = await file.text();
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("Le fichier GPX n’est pas valide.");

  const nodes = Array.from(doc.querySelectorAll("trkpt, rtept"));
  if (nodes.length < 2) throw new Error("Le GPX ne contient pas suffisamment de points.");

  const points: RawPoint[] = nodes.map((node) => ({
    lat: safeNumber(node.getAttribute("lat")),
    lon: safeNumber(node.getAttribute("lon")),
    elevation: safeNumber(node.querySelector("ele")?.textContent ?? null)
  }));

  const cumulative: number[] = [0];
  let elevationGainM = 0;
  for (let i = 1; i < points.length; i++) {
    cumulative[i] = cumulative[i - 1] + haversineKm(points[i - 1], points[i]);
    const gain = points[i].elevation - points[i - 1].elevation;
    if (gain > 0) elevationGainM += gain;
  }

  const distanceKm = cumulative[cumulative.length - 1];
  if (distanceKm < 0.1) throw new Error("Le GPX est trop court pour créer un parcours.");

  // Pente lissée sur une fenêtre d'environ 250 m pour éviter les pics GPS.
  const profiled = points.map((point, index) => {
    let previous = Math.max(0, index - 1);
    while (previous > 0 && cumulative[index] - cumulative[previous] < 0.25) previous--;
    const horizontalM = Math.max(20, (cumulative[index] - cumulative[previous]) * 1000);
    const rawGrade = ((point.elevation - points[previous].elevation) / horizontalM) * 100;
    return {
      km: cumulative[index],
      elevation: point.elevation,
      grade: Math.max(-18, Math.min(18, rawGrade))
    };
  });

  const name =
    doc.querySelector("metadata > name")?.textContent?.trim() ||
    doc.querySelector("trk > name")?.textContent?.trim() ||
    doc.querySelector("rte > name")?.textContent?.trim() ||
    file.name.replace(/\.gpx$/i, "");

  const startElevationM = points[0].elevation;
  const finishElevationM = points[points.length - 1].elevation;
  const netGrade = ((finishElevationM - startElevationM) / (distanceKm * 1000)) * 100;
  const maxGrade = Math.max(...profiled.map((p) => p.grade));
  const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return {
    id: `gpx-${Date.now()}-${slug || "parcours"}`,
    name,
    subtitle: "Parcours GPX importé",
    region: "Parcours personnel",
    distanceKm,
    elevationGainM: Math.round(elevationGainM),
    avgGrade: Number.isFinite(netGrade) ? netGrade : 0,
    maxGrade: Number.isFinite(maxGrade) ? maxGrade : 0,
    startElevationM: Math.round(startElevationM),
    finishElevationM: Math.round(finishElevationM),
    xp: Math.max(180, Math.min(650, Math.round(distanceKm * 12 + elevationGainM / 8))),
    points: Math.max(3, Math.min(8, Math.round(2 + distanceKm / 8 + elevationGainM / 700))),
    coordinates: downsample(points.map((p) => [p.lat, p.lon] as [number, number]), 260),
    profile: downsample(profiled, 120),
    note: "Profil généré depuis un fichier GPX. Les pentes sont lissées sur environ 250 m afin de limiter les anomalies d’altitude GPS."
  };
}

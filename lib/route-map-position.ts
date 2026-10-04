import type { ClimbChallenge } from "./routes";

function distanceKm(a: [number, number], b: [number, number]) {
  const radians = Math.PI / 180;
  const latA = a[0] * radians, latB = b[0] * radians;
  const h = Math.sin((latB - latA) / 2) ** 2 + Math.cos(latA) * Math.cos(latB) * Math.sin((b[1] - a[1]) * radians / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(Math.min(1, h)));
}

export function routePositionAt(route: ClimbChallenge, progress: number): [number, number] {
  const points = route.coordinates;
  if (points.length < 2) return points[0] ?? [0, 0];
  // Source distances keep a simplified map aligned with the original GPX.
  // Older routes fall back to cumulative geometry distance, never point count.
  const cumulative = route.coordinateKm?.length === points.length ? route.coordinateKm : [0];
  if (cumulative.length === 1) {
    for (let i = 1; i < points.length; i++) cumulative.push(cumulative[i - 1] + distanceKm(points[i - 1], points[i]));
  }
  const fraction = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const target = fraction * cumulative[cumulative.length - 1];
  let index = 1;
  while (index < points.length - 1 && cumulative[index] < target) index++;
  const span = cumulative[index] - cumulative[index - 1];
  const part = span > 0 ? (target - cumulative[index - 1]) / span : 0;
  const a = points[index - 1], b = points[index];
  return [a[0] + (b[0] - a[0]) * part, a[1] + (b[1] - a[1]) * part];
}

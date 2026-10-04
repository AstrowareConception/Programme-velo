import type { ClimbChallenge } from "./routes";

export function routePlaceProgress(route: ClimbChallenge, currentKm: number) {
  const places = route.places ?? [];
  const km = Math.min(route.distanceKm, Math.max(0, Number.isFinite(currentKm) ? currentKm : 0));
  const index = places.reduce((last, place, i) => place.km <= km ? i : last, -1);
  return { km, index, current: places[index], next: places[index + 1] };
}

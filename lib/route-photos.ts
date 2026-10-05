import assets from "./landscape-photos.json";
import type { ClimbChallenge } from "./routes";

type PhotoId = keyof typeof assets;
export type RoutePhotoStop = { id: PhotoId; place: string; km: number; photo: typeof assets[PhotoId] };
type Binding = { id: PhotoId; place: string };
const cagnes: Binding = { id: "cagnes", place: "Cagnes-sur-Mer" };
const antibes: Binding = { id: "antibes", place: "Antibes" };
const golfe: Binding = { id: "golfe-juan", place: "Golfe-Juan" };
const cannes: Binding = { id: "cannes", place: "Cannes · Croisette" };
const menton: Binding = { id: "menton", place: "Menton · vieux port" };

// Explicit route/place bindings: never infer photographs from an imported GPX's name.
export const photoRouteBindings: Record<string, Binding[]> = {
  "cagnes-cannes-littoral": [cagnes, antibes, golfe, cannes],
  "golfe-juan-cannes-balade": [golfe, cannes],
  "antibes-golfe-juan-short": [antibes, golfe],
  "napoleon-golfe-grasse": [golfe, { id: "cannes", place: "Cannes" }],
  "napoleon-golfe-cannes-short": [golfe, { id: "cannes", place: "Cannes" }],
  "nice-menton-grande-corniche": [menton],
  "eze-menton-basse-corniche": [menton],
  "menton-garavan-promenade": [menton]
};

export function routePhotos(route: ClimbChallenge): RoutePhotoStop[] {
  const bindings = Object.hasOwn(photoRouteBindings, route.id) ? photoRouteBindings[route.id] : [];
  return bindings.flatMap(binding => {
    const place = route.places?.find(p => p.label === binding.place);
    return place && Number.isFinite(place.km) && place.km >= 0 && place.km <= route.distanceKm
      ? [{ ...binding, km: place.km, photo: assets[binding.id] }] : [];
  }).sort((a, b) => a.km - b.km);
}

export function routePhotoIndex(stops: RoutePhotoStop[], currentKm = 0) {
  const km = Math.max(0, Number.isFinite(currentKm) ? currentKm : 0);
  return Math.max(0, stops.findLastIndex(stop => stop.km <= km));
}

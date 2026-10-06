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
  "ventoux-bedoin": [{ id: "ventoux", place: "Mont Ventoux · sommet" }],
  "galibier-valloire": [{ id: "galibier", place: "Col du Galibier" }],
  "esterel-agay-trayas": [{ id: "esterel-cap-roux", place: "Anthéor" }],
  "esterel-agay-antheor-short": [{ id: "esterel-cap-roux", place: "Anthéor" }],
  "alsace-marlenheim-obernai": [{ id: "obernai", place: "Obernai" }],
  "alsace-obernai-dambach": [{ id: "obernai", place: "Obernai" }],
  "alsace-obernai-bernardswiller-short": [{ id: "obernai", place: "Obernai" }],
  "alsace-turckheim-rouffach": [{ id: "eguisheim", place: "Eguisheim" }],
  "alsace-turckheim-eguisheim-short": [{ id: "eguisheim", place: "Eguisheim" }],
  "cagnes-cannes-littoral": [cagnes, antibes, golfe, cannes],
  "golfe-juan-cannes-balade": [golfe, cannes],
  "antibes-golfe-juan-short": [antibes, golfe],
  "napoleon-golfe-grasse": [golfe, { id: "cannes", place: "Cannes" }],
  "napoleon-golfe-cannes-short": [golfe, { id: "cannes", place: "Cannes" }],
  "nice-menton-grande-corniche": [menton],
  "eze-menton-basse-corniche": [menton],
  "menton-garavan-promenade": [menton]
};

export const landscapeDownloadBytes = Object.values(assets).reduce((sum, photo) => sum + photo.bytes, 0);

// Preserve the precision documented by the photographer instead of inventing a day.
export function routePhotoDate(date: string) {
  const monthOnly = /^\d{4}-\d{2}$/.test(date);
  return new Intl.DateTimeFormat("fr-FR", monthOnly
    ? { month: "long", year: "numeric", timeZone: "UTC" }
    : { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${date}${monthOnly ? "-01" : ""}T12:00:00Z`));
}

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

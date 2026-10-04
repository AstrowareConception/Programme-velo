import type { ClimbChallenge } from "@/lib/routes";
import { routePlaceProgress } from "@/lib/route-places";

const kilometers = (km: number) => km.toLocaleString("fr-FR", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

export function RoutePlaces({ route, currentKm }: { route: ClimbChallenge; currentKm?: number }) {
  if (!route.places?.length) return null;
  const progress = currentKm === undefined ? undefined : routePlaceProgress(route, currentKm);
  return (
    <section className="routePlaces" aria-label="Villes traversées">
      {progress && <div className="routePlaceNow">
        <small>REPÈRE ACTUEL · {kilometers(progress.km)} km virtuels</small>
        <strong aria-live="polite">{progress.current?.label ?? "Départ"}</strong>
        <p>{progress.current?.landmark}</p>
        <span>{progress.next ? `À suivre : ${progress.next.label} · dans ${kilometers(progress.next.km - progress.km)} km` : `Arrivée · ${route.places.at(-1)?.label}`}</span>
      </div>}
      <details>
        <summary>Les villes traversées · {route.places.length} repères</summary>
        <ol>
          {route.places.map((place, index) => <li key={place.label} className={progress && index <= progress.index ? "reached" : undefined} aria-current={progress?.index === index ? "step" : undefined}>
            <span>{kilometers(place.km)} km</span>
            <div><strong>{place.label}</strong><small>{place.landmark}</small></div>
          </li>)}
        </ol>
        <small>{route.placesNote ?? "Repères approximatifs sur la trace, sans frontières communales. Progression virtuelle ou distance reçue du vélo."}</small>
      </details>
    </section>
  );
}

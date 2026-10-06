import { expect,it } from 'vitest';
import { canalRoutes } from '../lib/canal-routes';
import profiles from '../lib/canal-profiles.json';
import sources from '../scripts/canal-sources.json';
import { allCompletedRouteIds } from '../lib/voyage-progress';
import type { CompletedSession } from '../lib/types';
it('uses continuous pinned official canal geometry with coherent terrain and independent short rides',()=>{
 expect(canalRoutes).toHaveLength(4);
 for(const route of canalRoutes) {
  const data=profiles[route.id as keyof typeof profiles];const source=sources[route.id as keyof typeof sources];
  expect(data.provenance.gpxSha256).toBe(source.gpxSha256);expect(data.coordinateKm.at(-1)).toBe(route.distanceKm);expect(route.profile[0].km).toBe(0);expect(route.profile.at(-1)?.km).toBe(route.distanceKm);
  expect(route.coordinates.length).toBeGreaterThan(30);expect(route.elevationGainM).toBeGreaterThan(0);expect(route.profile.every((p,i)=>i===0 || p.km>route.profile[i-1].km)).toBe(true);
 }
 expect(canalRoutes[0].coordinates.at(-1)).toEqual(canalRoutes[1].coordinates[0]);
 const short=canalRoutes[2];const done={id:'short',routeId:short.id,metrics:{completedRoute:true}} as CompletedSession;
 expect(allCompletedRouteIds([done]).has(short.parentRouteId!)).toBe(false);
});

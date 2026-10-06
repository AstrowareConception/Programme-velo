import type { CompletedSession } from '@/lib/types';
import { comfortableCadence } from '@/lib/adaptive-program';
export function CadenceCalibration({sessions,offset,onChange}:{sessions:CompletedSession[];offset:number;onChange:(offset:number)=>void}) {
  const observed=comfortableCadence(sessions);
  return <section className="cadenceCalibration"><h3>Mes repères de cadence</h3><p>{observed?`Sur ${observed.count} séances faciles et bien vécues, ta cadence moyenne habituelle est proche de ${observed.rpm} tr/min.`:'Après trois séances faciles complètes, mesurées par le vélo et ressenties à 4/10 maximum, un repère personnel pourra être proposé.'}</p>
    <label>Décalage de cadence · {offset>0?'+':''}{offset} tr/min<input type="range" min="-25" max="10" step="5" value={offset} onChange={e=>onChange(Number(e.target.value))}/></label><p className="finePrint">Appliqué aux prochaines consignes et à leur notation. Les anciennes notes restent liées à leurs réglages. Le rythme observé inclut les moments faciles : c’est un repère à ajuster, pas un test physiologique.</p>
    {observed && <button className="secondary" onClick={()=>onChange(observed.offset)}>Essayer le repère proposé ({observed.offset>0?'+':''}{observed.offset})</button>}
  </section>;
}

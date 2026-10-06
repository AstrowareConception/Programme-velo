"use client";
import { canalFullRouteIds } from '@/lib/canal-routes';
import { useState } from 'react';
import type { AppState } from '@/lib/types';
import type { ClimbChallenge } from '@/lib/routes';
import { allCompletedRouteIds } from '@/lib/voyage-progress';
import { voyageProgress } from '@/lib/voyage';
import type { PersonalJourney } from '@/lib/adaptive-program';
export function PersonalJourneys({state,routes,onSave,onDelete,onContinue}:{state:AppState;routes:ClimbChallenge[];onSave:(journey:PersonalJourney)=>void;onDelete:(id:string)=>void;onContinue:(route:ClimbChallenge)=>void}) {
  const [name,setName]=useState('Mon prochain voyage');
  const [selected,setSelected]=useState<string[]>([]);
  const [search,setSearch]=useState('');
  const [notice,setNotice]=useState('');
  const complete=allCompletedRouteIds(state.sessions);
  const choices=routes.filter(r=>r.name.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr')));
  function move(index:number,delta:number) {const next=[...selected];[next[index],next[index+delta]]=[next[index+delta],next[index]];setSelected(next);}
  return <section className="card personalJourneys" aria-label="Mes carnets de voyage"><p className="eyebrow">EXPLORATION PERSONNELLE</p><h2>Mes carnets de voyage</h2><p>Relie les parcours du catalogue et tes GPX dans l’ordre de ton choix. Chaque étape se parcourt en plusieurs séances.</p>
    <button className="secondary" disabled={(state.journeys?.length??0)>=20} onClick={()=>{onSave({id:crypto.randomUUID(),name:"Canal · Pontivy à Peillac",routeIds:[...canalFullRouteIds]});setNotice("Le carnet du canal est prêt en deux étapes.");}}>Créer le carnet du canal</button>
    <details><summary>Composer un carnet</summary><form className="form" onSubmit={e=>{e.preventDefault();if(!selected.length)return;onSave({id:crypto.randomUUID(),name:name.trim()||'Mon voyage',routeIds:selected});setSelected([]);setNotice('Carnet enregistré. Tu peux ouvrir sa prochaine étape.');}}>
      <label>Nom du carnet<input value={name} maxLength={80} required onChange={e=>setName(e.target.value)}/></label><label>Rechercher une étape<input type="search" value={search} onChange={e=>setSearch(e.target.value)}/></label>
      <label>Ajouter une étape<select value="" disabled={selected.length>=20} onChange={e=>{if(e.target.value)setSelected([...selected,e.target.value]);}}><option value="">Choisir parmi {choices.length} parcours</option>{choices.filter(r=>!selected.includes(r.id)).map(r=><option key={r.id} value={r.id}>{r.name} · {r.distanceKm} km</option>)}</select></label>
      <ol className="journeySteps">{selected.map((id,i)=><li key={id}><span>{routes.find(r=>r.id===id)?.name??id}</span><div><button type="button" className="secondary miniButton" aria-label={`Monter l’étape ${i+1}`} disabled={i===0} onClick={()=>move(i,-1)}>↑</button><button type="button" className="secondary miniButton" aria-label={`Descendre l’étape ${i+1}`} disabled={i===selected.length-1} onClick={()=>move(i,1)}>↓</button><button type="button" className="secondary miniButton" aria-label={`Retirer l’étape ${i+1}`} onClick={()=>setSelected(selected.filter(v=>v!==id))}>×</button></div></li>)}</ol>
      <button className="primary" disabled={!selected.length || (state.journeys?.length??0)>=20}>Enregistrer le carnet</button><small>20 étapes par carnet, jusqu’à 20 carnets. Les étapes déjà achevées restent acquises ; créer un carnet ne distribue aucun XP supplémentaire.</small>
    </form></details>{notice && <p role="status">{notice}</p>}
    <div className="journeyCards">{state.journeys?.map(j=>{
      const done=j.routeIds.filter(id=>complete.has(id)).length;
      const nextId=j.routeIds.find(id=>!complete.has(id));
      const next=routes.find(r=>r.id===nextId);
      const sessions=state.sessions.filter(s=>s.routeId && j.routeIds.includes(s.routeId));
      const distance=j.routeIds.reduce((sum,id)=>{const r=routes.find(r=>r.id===id);return sum+(r?(complete.has(id)?r.distanceKm:voyageProgress(r,state.sessions).coveredKm):0);},0);
      return <article key={j.id} className="journeyCard"><h3>{j.name}</h3><p><strong>{done} / {j.routeIds.length} étapes achevées</strong> · {Math.round(sessions.reduce((a,s)=>a+s.duration,0))} min enregistrées</p><progress value={done} max={j.routeIds.length} aria-label={`Progression ${j.name}`}/><p>{distance.toFixed(1)} km de parcours couverts · progression virtuelle, distincte du compteur du vélo.</p>
        <ol>{j.routeIds.map(id=><li key={id}>{complete.has(id)?'✓ ':''}{routes.find(r=>r.id===id)?.name??'Parcours indisponible · réimporte son GPX'}</li>)}</ol>
        {next?<button className="primary" onClick={()=>onContinue(next)}>Ouvrir la prochaine étape</button>:nextId?<p>Restaure le GPX manquant pour poursuivre ce carnet.</p>:<p className="journeyComplete">✦ Carnet achevé ! Tes étapes restent dans le journal.</p>}
        <details><summary>Gérer ce carnet</summary><button className="secondary" onClick={()=>onDelete(j.id)}>Supprimer le carnet, garder les séances</button></details>
      </article>;
    })}</div>
  </section>;
}

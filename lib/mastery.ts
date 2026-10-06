import type { CompletedSession } from './types';
import { cadenceSummary } from './effort';
export function masteryProgress(sessions:CompletedSession[],now=new Date()) {
  const valid=sessions.filter(s=>s.metrics?.cadenceRecordEligible && s.metrics.completedWorkout && !s.routeId && Date.parse(s.date)<=now.getTime() && !cadenceSummary(s.metrics.cadenceScore).provisional);
  const precise=new Set(valid.filter(s=>(cadenceSummary(s.metrics?.cadenceScore).percent??0)>=90).map(s=>s.templateId));
  const bestCombo=valid.reduce((best,s)=>Math.max(best,s.metrics?.cadenceScore?.bestComboSeconds??0),0);
  const managed=valid.filter(s=>s.templateId==='manage-20' || s.templateId==='manage-30').some(s=>{
    const segments=s.metrics?.cadenceScore?.segments;
    const a=segments?.[1],b=segments?.[2];
    return a && b && a.eligibleSeconds>0 && b.eligibleSeconds>0 && a.measuredSeconds/a.eligibleSeconds>=.8 && b.measuredSeconds/b.eligibleSeconds>=.8 && a.onTargetSeconds/a.measuredSeconds>=.8 && b.onTargetSeconds/b.measuredSeconds>=a.onTargetSeconds/a.measuredSeconds;
  });
  return {precise:precise.size,bestCombo,managed};
}

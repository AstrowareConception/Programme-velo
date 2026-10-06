import { test, expect, type Page } from '@playwright/test';
async function seed(page:Page) {
 await page.addInitScript(()=>{
  if(localStorage.getItem('veloquest:v1')) return;
  const now=new Date();const date=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  localStorage.setItem('veloquest:v1',JSON.stringify({profile:{name:'Programme QA',startDate:date},sessions:[{id:'preserved',templateId:'recovery-30',date:now.toISOString(),duration:30,points:2,xp:35,intensity:'easy',kind:'recovery',bonus:false,rpe:4,metrics:{source:'manual',completedWorkout:true}}],measurements:[],guidance:{version:1,status:'dismissed',step:3,experience:'regular',goal:'habit',sessionMinutes:25,weeklySessions:3},preferences:{soundCues:false,voiceCues:false}}));
 });await page.goto('/');
}
test('personal week can be previewed, adopted, shortened and reloaded without changing history',async({page},info)=>{
 await seed(page);const panel=page.getByRole('region',{name:'Ma semaine adaptée'});
 await panel.getByLabel('Mon créneau maximum').selectOption('30');
 await panel.getByRole('button',{name:'Proposer ma semaine'}).click();
 await expect(panel.locator('.plannedRides li')).toHaveCount(4);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('veloquest:v1')!).programPlans??[])).toEqual([]);
 await panel.getByRole('button',{name:'Confirmer cette semaine'}).click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('veloquest:v1')!).programPlans?.length)).toBe(1);
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('veloquest:v1')!).programPlans[0].target.minutes);
 const row=panel.locator('.plannedRides > li').first();await row.getByText('Déplacer ou raccourcir',{exact:true}).click();await row.getByLabel('Séance de remplacement').selectOption('return-10');
 await panel.getByRole('button',{name:'Confirmer cette semaine'}).click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('veloquest:v1')!).programPlans[0].target.minutes)).toBeLessThan(before);
 await page.reload();await expect(panel).toContainText('Reprendre doucement');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('veloquest:v1')!));expect(saved.sessions[0].id).toBe('preserved');expect(saved.sessions[0].points).toBe(2);expect(saved.weeklyGoals[0]).toEqual(saved.programPlans[0].target);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await panel.screenshot({path:info.outputPath('personal-week.png')});
 await panel.getByRole('button',{name:'Ouvrir la séance'}).first().click();await expect(page.locator('.sessionModal')).toContainText('Reprendre doucement');
});
test('habits and detailed review persist, staying separate from cycling totals',async({page},info)=>{
 await seed(page);await page.getByRole('button',{name:/Suivi/}).click();const panel=page.getByRole('region',{name:'Bilan et habitudes'});
 await expect(panel).toContainText('30 / 120 min');await panel.getByText('Mes habitudes du jour',{exact:true}).click();await panel.getByLabel('Marche aujourd’hui (min)').fill('25');await panel.getByLabel('Renforcement aujourd’hui (min)').fill('10');await panel.getByLabel('J’ai respecté mon besoin de récupération').check();await panel.getByRole('button',{name:'Enregistrer mes habitudes'}).click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('veloquest:v1')!).habits?.[0]?.walk)).toBe(25);
 await page.reload();await page.getByRole('button',{name:/Suivi/}).click();await expect(panel).toContainText('marche : 25 min');await expect(panel).toContainText('30 / 120 min');await panel.screenshot({path:info.outputPath('weekly-review.png')});
 await page.locator('.sessionHistoryRow').first().click();await expect(page.locator('.sessionDebrief')).toContainText('Le regard du coach');
});
test('personal itinerary preserves ordered routes and opens the next portion',async({page},info)=>{
 await seed(page);await page.getByRole('button',{name:/▲ Parcours/}).click();const panel=page.getByRole('region',{name:'Mes carnets de voyage'});
 await panel.getByText('Composer un carnet',{exact:true}).click();await panel.getByLabel('Nom du carnet').fill('Mon voyage test');
 const chooser=panel.getByLabel('Ajouter une étape');const ids=await chooser.locator('option').evaluateAll(nodes=>nodes.slice(1,3).map(n=>(n as HTMLOptionElement).value));
 await chooser.selectOption(ids[0]);await chooser.selectOption(ids[1]);await panel.getByRole('button',{name:'Monter l’étape 2'}).click();await panel.getByRole('button',{name:'Enregistrer le carnet'}).click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('veloquest:v1')!).journeys?.length)).toBe(1);await page.reload();await page.getByRole('button',{name:/▲ Parcours/}).click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('veloquest:v1')!).journeys[0].routeIds)).toEqual([ids[1],ids[0]]);
 await panel.screenshot({path:info.outputPath('personal-journey.png')});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await panel.getByRole('button',{name:'Ouvrir la prochaine étape'}).click();await expect(page.getByRole('dialog',{name:'Préparer mon voyage'})).toBeVisible();
});

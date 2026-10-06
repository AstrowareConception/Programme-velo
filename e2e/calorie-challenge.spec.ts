import { expect, test, type Page } from "@playwright/test";
async function setup(page: Page) {
 await page.addInitScript(() => { if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify({profile:{name:"Calorie QA",startDate:"2026-10-01"}, sessions:[], measurements:[],preferences:{voiceCues:false,soundCues:false,haptics:false}})); });
 await page.goto("/"); await page.getByRole("button", {name:/Séances/}).click(); await page.getByRole("button", {name:"Défis calories",exact:true}).click();
 await expect(page.locator(".workoutCard")).toHaveCount(2);
 await page.getByRole("heading", {name:"Défi calories · 5 min",exact:true}).locator("xpath=ancestor::article").getByRole("button", {name:"Voir / démarrer"}).click();
 await page.clock.install(); await page.getByRole("button", {name:"Démarrer la séance"}).click();
}
for (const complete of [true, false]) test(`declared calories remain separate and only complete intervals earn records: ${complete}`, async ({page}) => {
 await setup(page);
 await page.clock.fastForward(complete ? 300000 : 60000);
 if (!complete) await page.getByRole("button", {name:"Terminer et enregistrer",exact:true}).click();
 await page.getByLabel("Calories affichées").fill("42");
 const result=page.getByRole("status", {name:"Résultat du défi calories"});
 await expect(result).toContainText(complete ? "Premier record calories" : "Hors record");
 await page.getByLabel("J’ai vérifié le bilan et les champs facultatifs.").check(); await page.getByRole("button", {name:/Valider la quête/}).click();
 await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!).sessions.length)).toBe(1);
 await page.reload();
 const entry=await page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!).sessions.at(-1));
 expect(entry.metrics.calorieChallenge).toMatchObject({source:"manual",kcal:42,eligible:complete});
 expect(entry.duration).toBe(complete ? 5 : 1);
 await page.getByRole("button", {name:/Séances/}).click();
 const card=page.getByRole("heading", {name:"Défi calories · 5 min",exact:true}).locator("xpath=ancestor::article");
 await expect(card).toContainText(complete ? "Record déclaré : 42 kcal" : "Record déclaré : à établir");
});

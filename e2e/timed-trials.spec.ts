import { expect, test, type Page } from "@playwright/test";
import { mockFtms } from "./ftms-mock";
async function setup(page: Page, measured = false, name = "La minute express") {
 await page.addInitScript(() => {
  if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify({ profile:{name:"Chrono QA",startDate:"2026-10-01"}, sessions:[], measurements:[], preferences:{voiceCues:false,soundCues:false,haptics:false} }));
 });
 if (measured) await mockFtms(page);
 await page.goto("/");
 if (measured) { await page.getByRole("button",{name:"Vélo Bluetooth"}).click(); await expect(page.getByText("Simulateur FTMS 1–32").first()).toBeVisible(); }
 await page.getByRole("button",{name:/Séances/}).click();
 await page.getByRole("button",{name:`Préparer · ${name}`,exact:true}).click();
 const clockStart = await page.evaluate(() => Date.now());
 await page.clock.install({ time: clockStart });
 await page.clock.pauseAt(clockStart + 1000);
 await page.getByRole("button",{name:"Lancer le compte à rebours"}).click();
}
async function save(page: Page) {
 await page.getByLabel("J’ai vérifié le résultat du défi.").check();
 await page.getByRole("button",{name:"Enregistrer le défi",exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem("veloquest:v1")!).sessions.length)).toBe(1);
}
async function packet(page: Page, metres: number) { await page.evaluate(m => (window as any).__emitDistance(m), metres); }
test("manual countdown, fixed duration, persistence and separate record", async ({page}, info) => {
 await setup(page);
 await expect(page.getByRole("status").filter({hasText:"Prends ton élan"})).toContainText("5");
 await page.clock.runFor(4000); await expect(page.locator(".trialClock strong")).toHaveText("1");
 await page.clock.runFor(1000); await expect(page.locator(".trialClock strong")).toHaveText("Partez !");
 await page.clock.fastForward(60000);
 await page.getByLabel("Distance parcourue depuis le départ (km)").fill("0.5");
 await expect(page.getByRole("status").filter({hasText:"Premier record"})).toBeVisible();
 await page.screenshot({path:info.outputPath("timed-trial-review.png")});
 await save(page); await page.reload(); await page.getByRole("button",{name:/Séances/}).click();
 const card = page.getByRole("heading",{name:"La minute express",exact:true}).locator("xpath=ancestor::article");
 await expect(card).toContainText("Record déclaré : 0.500 km");
 const session = await page.evaluate(()=>JSON.parse(localStorage.getItem("veloquest:v1")!).sessions[0]);
 expect(session.metrics.timedTrial).toMatchObject({source:"manual",elapsedSeconds:60,distanceM:500,eligible:true});
 expect(session.intensity).toBe("hard"); expect(session.duration).toBe(1);
});
test("flying kilometre starts after countdown and interpolates measured finish", async ({page}, info) => {
 await setup(page, true, "Le kilomètre lancé");
 await packet(page, 500); await page.clock.runFor(4000); await packet(page, 900);
 await expect(page.locator(".trialDistance")).toContainText("0.000 km");
 await page.clock.runFor(1000); await packet(page, 1000);
 await page.clock.runFor(1000); await packet(page, 1300);
 await page.clock.runFor(1000); await packet(page, 1800);
 await page.screenshot({path:info.outputPath("flying-kilometre-live.png")});
 await page.clock.runFor(1000); await packet(page, 2200);
 await expect(page.getByLabel("Résultat du défi chrono")).toContainText("2.5 s");
 await save(page); await page.reload(); await page.getByRole("button",{name:/Suivi/}).click();
 const session = await page.evaluate(()=>JSON.parse(localStorage.getItem("veloquest:v1")!).sessions[0]);
 expect(session.metrics.timedTrial).toMatchObject({source:"ftms",distanceM:1000,eligible:true,elapsedSeconds:2.5});
 expect(await page.evaluate(()=>(window as any).__ftmsWrites)).toEqual([]);
});
test("manual distance event has a continuous clock and explicit arrival", async ({page}) => {
 await setup(page, false, "Le kilomètre lancé"); await page.clock.runFor(5000); await page.clock.fastForward(90000);
 await page.getByRole("button",{name:"Distance atteinte",exact:true}).click(); await save(page);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("veloquest:v1")!).sessions[0].metrics.timedTrial)).toMatchObject({distanceM:1000,elapsedSeconds:90,source:"manual",eligible:true});
});
test("reloading an attempt restores a non-record review without inventing distance", async ({page}) => {
 await setup(page); await page.clock.runFor(5000); await page.clock.fastForward(10000); await page.reload();
 await page.getByRole("button",{name:/Séances/}).click();
 await expect(page.getByRole("dialog",{name:"La minute express"})).toContainText("interrompue");
 await page.getByLabel("Distance parcourue depuis le départ (km)").fill("0.1"); await save(page);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("veloquest:v1")!).sessions[0].metrics.timedTrial.eligible)).toBe(false);
});
test("storage refusal preserves the trial review and retry writes just once", async ({page}) => {
 await setup(page); await page.clock.runFor(5000); await page.clock.fastForward(60000);
 await page.getByLabel("Distance parcourue depuis le départ (km)").fill("0.4");
 await page.evaluate(()=>{ const real=Storage.prototype.setItem; (window as any).__restoreStorage=()=>{Storage.prototype.setItem=real;}; Storage.prototype.setItem=function(k,v){if(k==="veloquest:v1") throw new DOMException("full","QuotaExceededError"); return real.call(this,k,v);}; });
 await page.getByLabel("J’ai vérifié le résultat du défi.").check(); await page.getByRole("button",{name:"Enregistrer le défi",exact:true}).click();
 await expect(page.getByRole("alert").filter({hasText:"Enregistrement refusé"})).toBeVisible();
 await expect(page.getByLabel("Distance parcourue depuis le départ (km)")).toHaveValue("0.4");
 await page.evaluate(()=>(window as any).__restoreStorage()); await save(page);
 expect(await page.evaluate(()=>localStorage.getItem("veloquest:timed-trial:v1"))).toBeNull();
});
test("lost or reset telemetry cannot earn a measured record", async ({page}) => {
 await setup(page,true,"Le kilomètre lancé"); await page.clock.runFor(5000); await packet(page,1500);
 await page.clock.runFor(1000); await packet(page,10);
 await expect(page.getByLabel("Résultat du défi chrono")).toContainText("remis à zéro");
 await save(page);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("veloquest:v1")!).sessions[0].metrics.timedTrial.eligible)).toBe(false);
});
test("measured fixed time freezes its distance before late packets", async ({page}) => {
 await setup(page,true);
 await page.clock.runFor(5000); await packet(page,1000);
 for (let elapsed=3;elapsed<=57;elapsed+=3) { await page.clock.runFor(3000); await packet(page,1000+elapsed*5); }
 await page.clock.runFor(2000); await packet(page,1295);
 await page.clock.runFor(1000); await packet(page,9000);
 await expect(page.getByLabel("Résultat du défi chrono")).toContainText("0.295 km");
 await save(page);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("veloquest:v1")!).sessions[0].metrics.timedTrial)).toMatchObject({source:"ftms",distanceM:295,elapsedSeconds:60,eligible:true});
});

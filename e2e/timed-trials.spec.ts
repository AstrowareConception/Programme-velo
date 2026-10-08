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
 if (info.project.name === "desktop-chromium") await page.setViewportSize({width:960,height:600});
 await setup(page, true, "Le kilomètre lancé");
 await packet(page, 500); await page.clock.runFor(4000); await packet(page, 900);
 await expect(page.locator(".trialDistance")).toContainText("0.000 km");
 await page.clock.runFor(1000); await packet(page, 1000);
 await page.clock.runFor(1000); await packet(page, 1300);
 await page.clock.runFor(1000); await packet(page, 1800);
 await expect(page.locator(".trialDistance")).toBeVisible();
 const stop = page.getByRole("button",{name:"Arrêter l’épreuve",exact:true});
 const box = await stop.boundingBox();
 expect(box!.y).toBeGreaterThanOrEqual(0); expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
 expect(await stop.evaluate(el => { const r=el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)); })).toBe(true);
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
 await expect(page.getByRole("region",{name:"Mesures du vélo en direct"})).toHaveCount(0);
 await page.getByRole("button",{name:"Distance atteinte",exact:true}).click();
 await expect(page.getByLabel("Résultat du défi chrono")).toContainText("Vitesse moyenne calculée : 40,0 km/h");
 await save(page);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("veloquest:v1")!).sessions[0].metrics.timedTrial)).toMatchObject({distanceM:1000,elapsedSeconds:90,source:"manual",eligible:true});
});
test("live speed updates during countdown and racing without reviving missing metrics", async ({page}, info) => {
 if (info.project.name === "desktop-chromium") await page.setViewportSize({width:960,height:600});
 await setup(page, true, "Le kilomètre lancé");
 const live = page.getByRole("region", {name:"Mesures du vélo en direct"});
 const speed = live.locator(".trialSpeed dd");
 // A packet between 100 ms clock ticks must display immediately, without blinking.
 await page.clock.runFor(50);
 await page.evaluate(() => (window as any).__emitMetrics({speedKmh:30.4,cadenceRpm:75,powerW:180,heartRate:135}));
 await expect(speed).toHaveText("30,4 km/h");
 await expect(live).toContainText("75 tr/min");
 await expect(live).toContainText("180 W");
 await expect(live).toContainText("135 bpm");
 await expect(page.locator(".trialClock strong")).toHaveText("5");
 await page.clock.runFor(5000); await packet(page,1000);
 await page.evaluate(() => (window as any).__emitMetrics({speedKmh:32.6,cadenceRpm:80}));
 await expect(speed).toHaveText("32,6 km/h");
 await expect(live).toContainText("80 tr/min");
 await expect(live).toHaveAttribute("aria-live","off");
 await expect(live).toBeInViewport({ratio:1});
 await expect(page.getByRole("button",{name:"Arrêter l’épreuve",exact:true})).toBeInViewport({ratio:1});
 expect(await page.getByRole("button",{name:"Arrêter l’épreuve",exact:true}).evaluate(el => { const r=el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)); })).toBe(true);
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath("trial-live-metrics.png")});
 // Continue receiving distance, but no speed/cadence/power: those fields must expire.
 await page.clock.runFor(3000);
 await page.evaluate(() => (window as any).__emitMetrics({distanceM:1050,heartRate:140}));
 await page.clock.runFor(2100);
 await page.evaluate(() => (window as any).__emitMetrics({distanceM:1100}));
 await expect(speed).toHaveText("— km/h");
 await expect(live).toContainText("— tr/min");
 await expect(live).toContainText("— W");
 await expect(live).toContainText("140 bpm");
 // A stopped rider really reports zero; it is distinct from an absent reading.
 await page.evaluate(() => (window as any).__emitMetrics({speedKmh:0,cadenceRpm:0,powerW:0,heartRate:0}));
 await expect(speed).toHaveText("0,0 km/h");
 await expect(live).toContainText("0 tr/min");
 await expect(live).toContainText("— bpm");
 await page.setViewportSize({width:320,height:568});
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 await page.getByRole("button",{name:"Arrêter l’épreuve",exact:true}).click();
 await expect(live).toHaveCount(0);
 await expect(page.getByLabel("Résultat du défi chrono")).toContainText("Vitesse moyenne calculée : 70,6 km/h");
 await save(page); await page.reload(); await page.getByRole("button",{name:/Suivi/}).click();
 await page.locator(".sessionHistoryRow").filter({hasText:"Le kilomètre lancé"}).click();
 await expect(page.getByLabel("Résultat du défi chrono")).toContainText("Vitesse moyenne calculée : 70,6 km/h");
 const result=await page.evaluate(()=>JSON.parse(localStorage.getItem("veloquest:v1")!).sessions[0].metrics.timedTrial);
 expect(result).toMatchObject({source:"ftms",distanceM:100,completed:false,eligible:false});
 expect(await page.evaluate(()=>(window as any).__ftmsWrites)).toEqual([]);
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

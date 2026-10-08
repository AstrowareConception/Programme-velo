import { test, expect, type Page } from "@playwright/test";
import { emptyState } from "../lib/data";
const password = "LongTestPassword123!";
async function createAccount(email: string) {
  const signup = await fetch("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, returnSecureToken: true }) }).then(r => r.json());
  await fetch("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-api-key", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer owner" }, body: JSON.stringify({ localId: signup.localId, emailVerified: true }) });
  return signup.localId;
}
function session(id: string) { return { id, templateId: "short-loosen-10", date: "2026-10-08T16:00:00Z", duration: 10, points: .5, xp: 15, kind: "recovery", intensity: "easy", bonus: false }; }
async function seed(page: Page, sessions: unknown[] = []) {
  const state = { ...emptyState(), guidance: undefined, profile: { name: "Cloud QA", startDate: "2026-10-08" }, sessions, preferences: { soundCues: false, voiceCues: false, haptics: false, cadenceOffset: -25 } };
  await page.addInitScript(state => { if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify(state)); }, state);
}
async function panel(page: Page) { await page.getByRole("button", { name: /••• Plus/ }).click(); return page.getByRole("region", { name: "Sauvegarde et synchronisation" }); }
async function login(page: Page, email: string) {
  await page.goto("/"); const cloud = await panel(page);
  await cloud.getByLabel("Je souhaite utiliser la sauvegarde cloud pour mes données personnelles.").check();
  await cloud.getByRole("button", { name: "Configurer mon compte cloud" }).click();
  await cloud.getByLabel("Adresse e-mail", { exact: true }).fill(email); await cloud.getByLabel("Mot de passe", { exact: true }).fill(password);
  await cloud.getByRole("button", { name: "Me connecter", exact: true }).click();
  await expect(cloud.getByRole("button", { name: "Associer cet appareil — vérifier les données" })).toBeVisible(); return cloud;
}
async function associate(page: Page) {
  const cloud = await panel(page); await cloud.getByRole("button", { name: "Associer cet appareil — vérifier les données" }).click();
  await cloud.getByLabel("J’ai vérifié le compte, les données et mes choix.").check();
  await cloud.getByRole("button", { name: "Confirmer la synchronisation", exact: true }).click();
  await expect(cloud.getByRole("status")).toContainText("Copie confirmée en ligne");
}
async function saved(page: Page) { return page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!).sessions.map((s: { id: string }) => s.id).sort()); }
test("two devices preserve independent offline additions, reload, deletion and restore", async ({ browser }, info) => {
  const email = `devices-${info.project.name}-${Date.now()}@example.test`; await createAccount(email);
  const tablet = await browser.newContext({ viewport: { width: 1024, height: 768 }, serviceWorkers: "block" }), phone = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" }); const a = await tablet.newPage(), b = await phone.newPage();
  await seed(a, [session("original")]); await seed(b);
  await login(a, email); await associate(a); await login(b, email); await associate(b); await expect.poll(() => saved(b)).toEqual(["original"]);
  await tablet.setOffline(true); await phone.setOffline(true);
  for (const [page, id] of [[a, "tablet"], [b, "phone"]] as const) {
    await page.evaluate(s => { const state = JSON.parse(localStorage.getItem("veloquest:v1")!); state.sessions.push(s); localStorage.setItem("veloquest:v1", JSON.stringify(state)); }, session(id));
  }
  // Each offline modification is durable; reload reconnects to the same cloud identity.
  await tablet.setOffline(false); await a.reload(); await panel(a); await expect(a.locator(".cloudPanel [role=status]")).toContainText("Copie confirmée en ligne");
  await phone.setOffline(false); await b.reload(); await panel(b);
  await expect.poll(() => saved(b)).toEqual(["original", "phone", "tablet"]);
  await expect.poll(() => saved(a), { timeout: 45000 }).toEqual(["original", "phone", "tablet"]);
  await expect(a.locator(".cloudPanel [role=status]")).toContainText("Copie confirmée en ligne");
  expect(await b.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!).preferences.cadenceOffset)).toBe(-25);
  // Real journal deletion, followed by restoring a retained version.
  await a.getByRole("button", { name: /Suivi/ }).click();
  await a.evaluate(() => { const state = JSON.parse(localStorage.getItem("veloquest:v1")!); state.sessions = state.sessions.filter((s: { id: string }) => s.id !== "original"); localStorage.setItem("veloquest:v1", JSON.stringify(state)); });
  await a.reload(); await panel(a); await expect.poll(() => saved(b), { timeout: 45000 }).toEqual(["phone", "tablet"]);
  const cloud = await panel(a); await cloud.getByRole("button", { name: "Voir les versions sauvegardées" }).click();
  const version = cloud.locator("li").filter({ hasText: "3 séance(s)" }).first(); await version.getByRole("button", { name: "Examiner cette version" }).click();
  await cloud.getByLabel("J’ai vérifié le compte, les données et mes choix.").check(); await cloud.getByRole("button", { name: "Confirmer la restauration" }).click();
  await expect.poll(() => saved(a)).toEqual(["original", "phone", "tablet"]); await expect.poll(() => saved(b), { timeout: 45000 }).toEqual(["original", "phone", "tablet"]);
  await cloud.screenshot({ path: info.outputPath("cloud-synchronized.png") }); await tablet.close(); await phone.close();
});
test("first association does not overwrite conflicts without explicit choices", async ({ browser }, info) => {
  const email = `conflict-${info.project.name}-${Date.now()}@example.test`; await createAccount(email);
  const one = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" }), two = await browser.newContext({ viewport: { width: 1024, height: 768 }, serviceWorkers: "block" }); const a = await one.newPage(), b = await two.newPage(); await seed(a, [session("same")]); await seed(b, [{ ...session("same"), points: 1 }]);
  await login(a, email); await associate(a); const cloud = await login(b, email); await cloud.getByRole("button", { name: "Associer cet appareil — vérifier les données" }).click();
  await expect(cloud.getByRole("button", { name: "Confirmer la synchronisation" })).toBeDisabled();
  await cloud.getByRole("radio", { name: /Garder cet appareil/ }).check(); await cloud.getByLabel("J’ai vérifié le compte, les données et mes choix.").check();
  await cloud.getByRole("button", { name: "Confirmer la synchronisation" }).click(); await expect(cloud.getByRole("status")).toContainText("Copie confirmée en ligne");
  expect(await b.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!).sessions[0].points)).toBe(1); await one.close(); await two.close();
});
test("email verification gates cloud access and signout preserves local history", async ({ page }, info) => {
  const email = `signup-${info.project.name}-${Date.now()}@example.test`; await seed(page, [session("local-only")]); await page.goto("/"); const cloud = await panel(page);
  await cloud.getByLabel("Je souhaite utiliser la sauvegarde cloud pour mes données personnelles.").check(); await cloud.getByRole("button", { name: "Configurer mon compte cloud" }).click();
  await cloud.getByRole("button", { name: "Créer un compte", exact: true }).click(); await cloud.getByLabel("Adresse e-mail", { exact: true }).fill(email); await cloud.getByLabel("Mot de passe", { exact: true }).fill(password); await cloud.getByRole("button", { name: "Créer mon compte", exact: true }).click();
  await expect(cloud.getByRole("button", { name: "J’ai vérifié mon adresse" })).toBeVisible(); await expect(cloud.getByRole("button", { name: /Associer cet appareil/ })).toHaveCount(0);
  const lookup = await fetch("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:lookup?key=demo-api-key", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer owner" }, body: JSON.stringify({ email: [email] }) }).then(r => r.json());
  await fetch("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-api-key", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer owner" }, body: JSON.stringify({ localId: lookup.users[0].localId, emailVerified: true }) });
  await cloud.getByRole("button", { name: "J’ai vérifié mon adresse" }).click(); await associate(page);
  await cloud.getByRole("button", { name: "Déconnecter le compte cloud" }).click(); await expect(cloud.getByRole("button", { name: "Me connecter", exact: true })).toBeVisible();
  expect(await saved(page)).toEqual(["local-only"]);
});
test("incoming changes wait for the active workout to be saved", async ({ browser }, info) => {
  const email = `reader-${info.project.name}-${Date.now()}@example.test`; await createAccount(email);
  const one = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" }), two = await browser.newContext({ viewport: { width: 1024, height: 768 }, serviceWorkers: "block" }); const a = await one.newPage(), b = await two.newPage(); await seed(a, [session("original")]); await seed(b);
  await login(a, email); await associate(a); await login(b, email); await associate(b);
  await a.getByRole("button", { name: /⚡ Séances/ }).click(); await a.getByRole("heading", { name: "Délier les jambes", exact: true }).locator("xpath=ancestor::article").getByRole("button", { name: "Voir / démarrer" }).click(); await a.getByRole("button", { name: "Démarrer la séance" }).click();
  await b.evaluate(s => { const state = JSON.parse(localStorage.getItem("veloquest:v1")!); state.sessions.push(s); localStorage.setItem("veloquest:v1", JSON.stringify(state)); }, session("phone-addition"));
  await b.reload(); await panel(b); await expect(b.locator(".cloudPanel [role=status]")).toContainText("Copie confirmée en ligne");
  expect(await saved(a)).toEqual(["original"]); await expect(a.getByRole("button", { name: "Terminer et enregistrer", exact: true })).toBeVisible();
  await a.getByRole("button", { name: "Terminer et enregistrer", exact: true }).click(); await a.getByLabel("J’ai vérifié le bilan et les champs facultatifs.").check(); await a.getByRole("button", { name: /Valider la quête/ }).click();
  await expect.poll(async () => (await saved(a)).length, { timeout: 45000 }).toBe(3); await expect.poll(async () => (await saved(b)).length, { timeout: 45000 }).toBe(3);
  await one.close(); await two.close();
});

test("a renewed cycle synchronizes, and competing offline departures require one explicit choice", async ({ browser }, info) => {
  const email = `cycles-${info.project.name}-${Date.now()}@example.test`; await createAccount(email);
  const one = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" }), two = await browser.newContext({ viewport: { width: 1024, height: 768 }, serviceWorkers: "block" });
  const a = await one.newPage(), b = await two.newPage(); await seed(a, [session("preserved")]); await seed(b);
  await login(a, email); await associate(a); await login(b, email); await associate(b);
  async function depart(page: Page, goal: string) {
    await page.getByRole("button", { name: /⌂ Quête/ }).click();
    const cycle = page.locator('.programCycles'); await cycle.getByRole('button', { name: 'Préparer un nouveau cycle' }).click();
    await cycle.getByLabel('Objectif du prochain cycle').selectOption(goal);
    await cycle.getByLabel('J’ai vérifié le bilan et le départ du nouveau cycle aujourd’hui.').check();
    await cycle.getByRole('button', { name: 'Confirmer le départ du cycle' }).click();
    await expect(cycle.getByRole('status')).toContainText('Nouveau cycle enregistré');
  }
  const timeline = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('veloquest:v1')!).programTimeline);
  await depart(a, 'endurance'); await expect.poll(async () => (await timeline(b))?.active.goal, { timeout: 45000 }).toBe('endurance');
  expect(await timeline(a)).toEqual(await timeline(b)); await b.reload(); await expect(b.locator('.programCycles')).toContainText('Mon cycle 2');
  await one.setOffline(true); await two.setOffline(true); await depart(a, 'maintain'); await depart(b, 'progress');
  const local = await timeline(b); expect(local.active.goal).toBe('progress');
  await one.setOffline(false); await a.reload(); await panel(a); await expect(a.locator('.cloudPanel [role=status]')).toContainText('Copie confirmée en ligne');
  await two.setOffline(false); await b.reload(); const cloud = await panel(b);
  await expect(cloud).toContainText('Cycle, objectifs et planning : choisir le programme à conserver');
  await expect(cloud.getByRole('button', { name: 'Confirmer la synchronisation', exact: true })).toBeDisabled();
  expect(await timeline(b)).toEqual(local);
  await cloud.getByRole('radio', { name: /Garder le cloud/ }).check();
  await cloud.getByLabel('J’ai vérifié le compte, les données et mes choix.').check(); await cloud.getByRole('button', { name: 'Confirmer la synchronisation', exact: true }).click();
  await expect.poll(async () => (await timeline(b)).active.goal).toBe('maintain'); expect(await timeline(a)).toEqual(await timeline(b));
  expect(await saved(b)).toEqual(['preserved']); await b.reload(); await expect(b.locator('.programCycles')).toContainText('Mon cycle 3');
  await one.close(); await two.close();
});

import { expect, test, type Page } from "@playwright/test";

const state = {
  profile: { name: "BT QA", startDate: "2026-10-01" },
  sessions: [],
  measurements: [],
  favoriteRouteIds: [],
  preferences: {
    soundCues: false,
    voiceCues: false,
    haptics: false,
    keepScreenAwake: false,
    keepTelemetryTrace: true,
    cadenceOffset: 0,
    resistanceOffset: 0
  }
};

async function seed(page: Page) {
  await page.addInitScript((value) => {
    if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify(value));
  }, state);
}

async function mockFtms(page: Page, mode: "standard" | "sport02" = "standard", heartRateService = false, qualified = false) {
  await page.addInitScript(({ mode, heartRateService, qualified }) => {
    const FTMS_SERVICE = 0x1826;
    const FEATURE = 0x2acc;
    const BIKE_DATA = 0x2ad2;
    const RANGE = 0x2ad6;
    const CONTROL = 0x2ad9;

    (window as any).__ftmsWrites = [];

    const listeners = new Map<number, Set<(event: any) => void>>();

    const emit = (uuid: number, view: DataView) => {
      const characteristic = characteristics.get(uuid);
      if (!characteristic) return;
      characteristic.value = view;
      for (const callback of listeners.get(uuid) ?? []) callback({ target: characteristic });
    };

    const characteristics = new Map<number, any>();

    function characteristic(uuid: number, read?: () => DataView) {
      const item: any = {
        uuid,
        properties: uuid === CONTROL ? { write: mode === "standard", indicate: mode === "standard", writeWithoutResponse: mode === "sport02" } : { read: Boolean(read), notify: uuid === BIKE_DATA },
        value: undefined,
        async startNotifications() { return item; },
        addEventListener(name: string, callback: (event: any) => void) {
          if (name !== "characteristicvaluechanged") return;
          if (!listeners.has(uuid)) listeners.set(uuid, new Set());
          listeners.get(uuid)!.add(callback);

          if (uuid === BIKE_DATA) {
            setTimeout(() => {
              const flags = (1 << 2) | (1 << 4) | (1 << 5) | (1 << 6) | (1 << 9);
              const buffer = new ArrayBuffer(14);
              const view = new DataView(buffer);
              let offset = 0;
              view.setUint16(offset, flags, true); offset += 2;
              view.setUint16(offset, 2534, true); offset += 2;
              view.setUint16(offset, 176, true); offset += 2;
              view.setUint8(offset++, 0xb0); view.setUint8(offset++, 0x04); view.setUint8(offset++, 0x00);
              view.setInt16(offset, 18, true); offset += 2;
              view.setInt16(offset, 205, true); offset += 2;
              view.setUint8(offset, heartRateService ? 0 : 142);
              (window as any).__emitBike = (rpm?: number, bpm?: number) => {
                if (rpm !== undefined) view.setUint16(4, rpm * 2, true);
                if (bpm !== undefined) view.setUint8(13, bpm);
                emit(BIKE_DATA, view);
              };
              emit(BIKE_DATA, view);
            }, 40);
          }
        },
        removeEventListener(name: string, callback: (event: any) => void) {
          if (name === "characteristicvaluechanged") listeners.get(uuid)?.delete(callback);
        },
        async readValue() {
          if (!read) throw new Error("not readable");
          return read();
        },
        async writeValueWithResponse(bytes: Uint8Array) {
          (window as any).__ftmsWrites.push(Array.from(bytes));
          if (uuid === CONTROL) {
            const opcode = bytes[0];
            setTimeout(() => {
              const response = new Uint8Array([0x80, opcode, 0x01]);
              emit(CONTROL, new DataView(response.buffer));
            }, 20);
          }
        },
        async writeValue(bytes: Uint8Array) {
          return item.writeValueWithResponse(bytes);
        }
      };
      characteristics.set(uuid, item);
      return item;
    }

    characteristic(BIKE_DATA);
    (window as any).__emitEnergy = (kcal: number) => {
      const view = new DataView(new ArrayBuffer(9)); view.setUint16(0, 1 << 8, true); view.setUint16(2, 2000, true); view.setUint16(4, kcal, true); emit(BIKE_DATA, view);
    };
    if (mode === "standard") characteristic(FEATURE, () => {
      const view = new DataView(new ArrayBuffer(8));
      view.setUint32(4, 1 << 2, true);
      return view;
    });
    characteristic(RANGE, () => {
      const view = new DataView(new ArrayBuffer(6));
      if (mode === "sport02") return view;
      view.setInt16(0, 10, true);
      view.setInt16(2, 320, true);
      view.setUint16(4, 10, true);
      return view;
    });
    characteristic(CONTROL);

    const service = {
      async getCharacteristic(uuid: string) {
        if (typeof uuid !== "string" || !uuid.endsWith("-0000-1000-8000-00805f9b34fb")) throw new Error("Canonical UUID required");
        const value = characteristics.get(parseInt(uuid.slice(0, 8), 16));
        if (!value) throw new DOMException("characteristic unavailable", "NotFoundError");
        return value;
      }
    };

    const heartListeners = new Set<() => void>();
    const heartChar = {
      value: new DataView(new Uint8Array([0, 93]).buffer),
      async startNotifications() { return heartChar; },
      async stopNotifications() {},
      addEventListener(_: string, fn: () => void) { heartListeners.add(fn); },
      removeEventListener(_: string, fn: () => void) { heartListeners.delete(fn); }
    };
    (window as any).__emitHeart = (flags: number, bpm: number) => {
      heartChar.value = new DataView(new Uint8Array([flags, bpm]).buffer);
      for (const fn of heartListeners) fn();
    };
    const server = {
      async getPrimaryService(uuid: string) {
        if (heartRateService && uuid === "0000180d-0000-1000-8000-00805f9b34fb") return {
          async getCharacteristic(id: string) {
            if (id !== "00002a37-0000-1000-8000-00805f9b34fb") throw new Error("wrong characteristic");
            return heartChar;
          }
        };
        if (uuid !== "00001826-0000-1000-8000-00805f9b34fb") throw new Error("service unavailable");
        return service;
      }
    };

    const device: any = {
      name: qualified ? "Toputure TBE5" : mode === "sport02" ? "Simulateur FTMS incomplet" : "Simulateur FTMS 1–32",
      addEventListener() {},
      removeEventListener() {},
      gatt: {
        async connect() { return server; },
        disconnect() {}
      }
    };

    Object.defineProperty(navigator, "bluetooth", {
      configurable: true,
      value: {
        async getAvailability() { return true; },
        async requestDevice(options: { optionalServices: string[] }) {
          if (options.optionalServices[0] !== "00001826-0000-1000-8000-00805f9b34fb") throw 2;
          return device;
        }
      }
    });
  }, { mode, heartRateService, qualified });
}

test("Sport02-like telemetry remains usable while incomplete control is explained and disabled", async ({ page }) => {
  await seed(page);
  await mockFtms(page, "sport02");
  await page.goto("/");
  await page.getByRole("button", { name: /Plus/ }).click();
  await page.getByRole("button", { name: "Connecter pour la télémétrie FTMS" }).click();
  const lab = page.getByRole("region", { name: "Laboratoire FTMS" });
  await expect(lab.getByText(/Dernier paquet reçu à/)).toBeVisible();
  await expect(lab.getByText("présent, inutilisable", { exact: true })).toBeVisible();
  await expect(lab.getByText("invalide", { exact: true })).toBeVisible();
  await expect(lab.getByText(/FTMS Feature \(2ACC\) non trouvée/)).toBeVisible();
  await expect(lab.getByRole("button", { name: "Demander le contrôle FTMS" })).toHaveCount(0);
  await expect(lab.getByRole("button", { name: "Envoyer ce niveau au vélo" })).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).__ftmsWrites)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await lab.screenshot({ path: `test-results/ftms-incomplete-control-${test.info().project.name}.png` });
  await lab.getByRole("button", { name: "Déconnecter le vélo après le test" }).click();
  await expect(lab.getByRole("button", { name: "Connecter pour la télémétrie FTMS" })).toBeEnabled();
});

test("FTMS connection exposes simulated telemetry and capabilities", async ({ page }) => {
  await seed(page);
  await mockFtms(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Vélo Bluetooth" }).click();
  await expect(page.getByText("Simulateur FTMS 1–32").first()).toBeVisible();
  await expect(page.getByText("88").first()).toBeVisible();
  await expect(page.getByText("205").first()).toBeVisible();
  await expect(page.getByText("142").first()).toBeVisible();

  await page.getByRole("button", { name: /Plus/ }).click();
  await expect(page.getByRole("button", { name: "Inspecter un appareil BLE" })).toBeDisabled();
  await expect(page.getByText("Control Point")).toBeVisible();
  await expect(page.getByText("Résistance cible")).toBeVisible();
  await expect(page.getByText("1–32", { exact: true })).toBeVisible();
});

test("FTMS control acknowledgement and auto resistance send simulated control-point commands", async ({ page }) => {
  await seed(page);
  await mockFtms(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Vélo Bluetooth" }).click();
  await page.getByRole("button", { name: /Plus/ }).click();

  await page.getByRole("button", { name: "Demander le contrôle FTMS" }).click();
  await expect(page.getByText("Contrôle accordé")).toBeVisible();
  await expect(page.getByLabel("Auto-résistance pour cette connexion")).toHaveCount(0);
  await page.locator("label.toggleRow").filter({ hasText: "Correspondance physique 1–32 vérifiée pour cette connexion" }).click();
  await page.locator("label.toggleRow").filter({ hasText: "Auto-résistance pour cette connexion" }).click();
  await expect(page.getByLabel("Auto-résistance pour cette connexion")).toBeChecked();

  await page.getByRole("button", { name: /Séances/ }).click();
  const card = page.getByRole("heading", { name: "Décrassage" }).locator("xpath=ancestor::article");
  await card.getByRole("button", { name: "Voir / démarrer" }).click();
  await page.clock.install();
  await page.getByRole("button", { name: "Démarrer la séance" }).click();

  await expect(page.getByText("AUTO LEVEL ACTIF")).toBeVisible();

  await expect.poll(async () => {
    return page.evaluate(() => (window as any).__ftmsWrites);
  }).toContainEqual(expect.arrayContaining([0x04]));

  const writes = await page.evaluate(() => (window as any).__ftmsWrites as number[][]);
  expect(writes.some((bytes) => bytes[0] === 0x00)).toBe(true);
  expect(writes.some((bytes) => bytes[0] === 0x04)).toBe(true);
  await expect.poll(() => page.evaluate(() => (window as any).__ftmsWrites)).toContainEqual([4, 50, 0]);
  await page.clock.runFor(1000);
  for (const level of [6, 7, 6, 5]) {
    await page.clock.fastForward(60_000);
    await expect(page.locator(".sessionEssentials .resistance strong")).toHaveText(String(level));
    await page.clock.runFor(1100);
    await expect.poll(() => page.evaluate(() => (window as any).__ftmsWrites.at(-1))).toEqual([4, level * 10, 0]);
  }
});

test("first hardware test sends only explicit minimum and neighbouring commands, then resets on reconnect", async ({ page }) => {
  await seed(page);
  await mockFtms(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Plus/ }).click();
  const diagnostic = page.getByRole("region", { name: "Diagnostic matériel BLE" });
  await diagnostic.getByText("Premier test du vélo · 10 à 15 minutes").click();
  await expect(diagnostic.getByText(/Pédale doucement une minute/)).toBeVisible();
  await page.getByRole("button", { name: "Connecter pour la télémétrie FTMS" }).click();
  const lab = page.getByRole("region", { name: "Laboratoire FTMS" });
  await expect(lab.getByText(/Dernier paquet reçu à/)).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as any).__ftmsWrites)).toEqual([]);
  await lab.getByRole("button", { name: "Demander le contrôle FTMS" }).click();
  await expect(lab.getByText("Contrôle accordé")).toBeVisible();
  const level = lab.getByRole("slider");
  await expect(level).toHaveValue("1");
  await lab.getByRole("button", { name: "Envoyer ce niveau au vélo" }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__ftmsWrites)).toEqual([[0], [4, 10, 0]]);
  await expect(page.getByText("Commande 1 acquittée ; effet physique à vérifier.")).toBeVisible();
  await lab.getByRole("button", { name: "Choisir un pas au-dessus" }).click();
  await expect(level).toHaveValue("2");
  expect(await page.evaluate(() => (window as any).__ftmsWrites)).toEqual([[0], [4, 10, 0]]);
  await lab.getByRole("button", { name: "Envoyer ce niveau au vélo" }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__ftmsWrites)).toEqual([[0], [4, 10, 0], [4, 20, 0]]);
  await lab.getByRole("button", { name: "Choisir le minimum" }).click();
  await lab.getByRole("button", { name: "Envoyer ce niveau au vélo" }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__ftmsWrites)).toEqual([[0], [4, 10, 0], [4, 20, 0], [4, 10, 0]]);
  await lab.locator("label.toggleRow").filter({ hasText: "Correspondance physique 1–32" }).click();
  await lab.locator("label.toggleRow").filter({ hasText: "Auto-résistance pour cette connexion" }).click();
  await lab.getByRole("button", { name: "Déconnecter le vélo après le test" }).click();
  await expect(diagnostic.getByRole("button", { name: "Inspecter un appareil BLE" })).toBeEnabled();
  await page.getByRole("button", { name: "Connecter pour la télémétrie FTMS" }).click();
  await expect(lab.getByText("Contrôle non demandé")).toBeVisible();
  await lab.getByRole("button", { name: "Demander le contrôle FTMS" }).click();
  await expect(lab.getByText("Contrôle accordé")).toBeVisible();
  await expect(lab.getByLabel("Correspondance physique 1–32 vérifiée pour cette connexion")).not.toBeChecked();
  await expect(lab.getByLabel("Auto-résistance pour cette connexion")).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!).sessions)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await lab.screenshot({ path: `test-results/hardware-lab-${test.info().project.name}.png` });
});


test("separate heart rate supplies BPM, contact loss clears them, and resistance uses whole levels", async ({ page }) => {
  await seed(page);
  await mockFtms(page, "standard", true);
  await page.goto("/");
  await page.getByRole("button", { name: "Vélo Bluetooth" }).click();
  const bpm = page.locator(".consoleMetric").filter({ has: page.getByText("BPM", { exact: true }) }).first().locator("strong");
  await expect(page.locator(".consoleMetric").filter({ has: page.getByText("LEVEL", { exact: true }) }).first().locator("strong")).toHaveText("18.0");
  await expect(bpm).toHaveText("—");
  await page.evaluate(() => (window as any).__emitHeart(0, 93));
  await expect(bpm).toHaveText("93");
  await page.evaluate(() => (window as any).__emitBike());
  await expect(bpm).toHaveText("93");
  await page.evaluate(() => (window as any).__emitHeart(0, 95));
  await expect(bpm).toHaveText("95");
  await page.evaluate(() => (window as any).__emitHeart(4, 95));
  await expect(bpm).toHaveText("—");
});


test("coach score, combos and BPM above 100 survive deliberate saving and reload", async ({ page }, info) => {
  await seed(page); await mockFtms(page); await page.goto("/");
  await page.getByRole("button", { name: "Vélo Bluetooth" }).click();
  await expect(page.getByText("142").first()).toBeVisible();
  await page.getByRole("button", { name: /Séances/ }).click();
  await page.getByRole("heading", { name: "Décrassage" }).locator("xpath=ancestor::article").getByRole("button", { name: "Voir / démarrer" }).click();
  await page.clock.install();
  await page.evaluate(() => (window as any).__emitBike(80, 148));
  await page.getByRole("button", { name: "Démarrer la séance" }).click();
  await page.evaluate(() => { (window as any).__rpm = 80; (window as any).__emitBike(80, 148); setInterval(() => (window as any).__emitBike((window as any).__rpm, 148), 500); });
  await page.clock.runFor(31_000);
  await expect(page.locator(".liveCadenceScore")).toContainText("×4");
  await expect(page.locator(".actualResistance")).toContainText("18");
  await expect(page.getByRole("img", { name: /Profil d’effort/ })).toBeVisible();
  expect(await page.locator(".sessionModal").evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath("mobile-effort-reader.png") });
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.clock.runFor(10_000);
  await page.getByRole("button", { name: "Reprendre", exact: true }).click();
  await page.evaluate(() => { (window as any).__rpm = 100; (window as any).__emitBike(100, 148); });
  await page.clock.runFor(5000);
  await expect(page.locator(".liveCadenceScore")).toContainText("combo 0 s ×1");
  await page.getByRole("button", { name: "Terminer et enregistrer" }).click();
  await page.getByLabel("RPE ressenti /10").fill("5");
  await page.getByLabel("RPE ressenti /10").press("Enter");
  await expect(page.getByRole("heading", { name: "Enregistre ta performance" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Valider la quête/ })).toBeDisabled();
  await page.getByLabel("J’ai vérifié le bilan et les champs facultatifs.").check();
  await page.getByRole("button", { name: /Valider la quête/ }).click();
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!).sessions.at(-1));
  await expect.poll(async () => (await saved())?.metrics?.avgHeartRate).toBe(148);
  const session = await saved();
  expect(session.metrics.maxHeartRate).toBe(148);
  expect(session.metrics.cadenceScore.bestComboSeconds).toBeGreaterThanOrEqual(30);
  expect(session.metrics.cadenceScore.comboSeconds).toBe(0);
  expect(session.metrics.cadenceScore.segments[0].eligibleSeconds).toBeLessThan(40);
  expect(session.metrics.cadenceRecordEligible).toBe(false);
  await page.reload();
  await expect.poll(async () => (await saved())?.metrics?.cadenceScore).toEqual(session.metrics.cadenceScore);
});


test("qualified Toputure acquires control automatically and sends levels only after start", async ({ page }) => {
  await seed(page); await mockFtms(page, "standard", false, true); await page.goto("/");
  await page.getByRole("button", { name: "Vélo Bluetooth" }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__ftmsWrites)).toEqual([[0]]);
  await page.getByRole("button", { name: /Séances/ }).click();
  await page.getByRole("heading", { name: "Décrassage", exact: true }).locator("xpath=ancestor::article").getByRole("button", { name: "Voir / démarrer" }).click();
  await expect(page.getByText(/résistance automatique activée/)).toBeVisible();
  await page.getByRole("button", { name: "Démarrer la séance" }).click();
  await expect(page.getByText("AUTO LEVEL ACTIF")).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as any).__ftmsWrites)).toContainEqual([4, 50, 0]);
});


test("calorie challenge measures only the fixed interval and preserves its device record", async ({ page }) => {
  await seed(page); await mockFtms(page, "standard", false, true); await page.goto("/");
  await page.getByRole("button", { name: "Vélo Bluetooth" }).click();
  await page.getByRole("button", { name: /Séances/ }).click();
  await page.getByRole("heading", { name: "Défi calories · 5 min", exact: true }).locator("xpath=ancestor::article").getByRole("button", { name: "Voir / démarrer" }).click();
  await page.clock.install({ time: new Date("2026-10-06T18:00:00Z") }); await page.clock.pauseAt(new Date("2026-10-06T18:00:01Z")); await page.evaluate(() => (window as any).__emitEnergy(200));
  await page.getByRole("button", { name: "Démarrer la séance" }).click();
  await expect(page.getByRole("button", { name: "Chrono actif", exact: true })).toBeDisabled();
  await expect(page.locator(".liveCadenceScore")).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).__ftmsWrites)).toEqual([[0]]);
  await page.evaluate(() => { let kcal = 200; (window as any).__energyTimer = setInterval(() => (window as any).__emitEnergy(++kcal), 5000); });
  await page.clock.runFor(300000);
  await page.evaluate(() => { clearInterval((window as any).__energyTimer); });
  await expect(page.getByRole("heading", { name: "Enregistre ta performance" })).toBeVisible();
  const result = page.getByRole("status", { name: "Résultat du défi calories" });
  await expect(result).toContainText("Premier record calories");
  await expect(result).toContainText("60 kcal");
  await page.clock.runFor(1000); await page.evaluate(() => (window as any).__emitEnergy(999));
  await expect(page.getByLabel("Calories affichées")).toHaveValue("60");
  await page.getByLabel("J’ai vérifié le bilan et les champs facultatifs.").check();
  await page.getByRole("button", { name: /Valider la quête/ }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!).sessions.length)).toBe(1);
  await page.reload();
  const entry = await page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!).sessions.at(-1));
  expect(entry.metrics.calorieChallenge).toMatchObject({ source: "ftms", kcal: 60, eligible: true, durationSeconds: 300, deviceName: "Toputure TBE5" });
  expect(entry.metrics.cadenceScore).toBeUndefined();
});

test("tablet dashboard keeps received telemetry and session controls inside the viewport", async ({ page }, info) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await seed(page); await mockFtms(page, "standard", false, true); await page.goto("/");
  await page.getByRole("button", { name: "Vélo Bluetooth" }).click();
  await page.getByRole("button", { name: /Séances/ }).click();
  await page.getByRole("heading", { name: "Décrassage", exact: true }).locator("xpath=ancestor::article").getByRole("button", { name: "Voir / démarrer" }).click();
  await page.getByRole("button", { name: "Démarrer la séance" }).click();
  await expect(page.locator(".liveStrip")).toContainText("142");
  await expect(page.locator(".actualResistance strong")).toHaveText("18");
  for (const viewport of [{ width: 1024, height: 768 }, { width: 960, height: 600 }]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => page.locator(".activeSessionModal").evaluate(el => el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await expect(page.locator(".liveStrip")).toBeInViewport({ ratio: 1 });
    await expect(page.locator(".readerControls")).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: info.outputPath(`tablet-ftms-${viewport.width}.png`) });
  }
  await page.getByRole("button", { name: "Alléger −1" }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reprendre", exact: true })).toBeVisible();
});

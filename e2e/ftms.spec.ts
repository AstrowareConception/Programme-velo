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
    resistanceOffset: 0
  }
};

async function seed(page: Page) {
  await page.addInitScript((value) => {
    localStorage.setItem("veloquest:v1", JSON.stringify(value));
  }, state);
}

async function mockFtms(page: Page, mode: "standard" | "sport02" = "standard") {
  await page.addInitScript((mode) => {
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
              view.setInt16(offset, 180, true); offset += 2;
              view.setInt16(offset, 205, true); offset += 2;
              view.setUint8(offset, 142);
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
      async getCharacteristic(uuid: number) {
        const value = characteristics.get(uuid);
        if (!value) throw new DOMException("characteristic unavailable", "NotFoundError");
        return value;
      }
    };

    const server = {
      async getPrimaryService(uuid: number) {
        if (uuid !== FTMS_SERVICE) throw new Error("service unavailable");
        return service;
      }
    };

    const device: any = {
      name: mode === "sport02" ? "Simulateur FTMS incomplet" : "Simulateur FTMS 1–32",
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
        async requestDevice() { return device; }
      }
    });
  }, mode);
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
  await page.getByRole("button", { name: "Démarrer la séance" }).click();

  await expect(page.getByText("AUTO LEVEL ACTIF")).toBeVisible();

  await expect.poll(async () => {
    return page.evaluate(() => (window as any).__ftmsWrites);
  }).toContainEqual(expect.arrayContaining([0x04]));

  const writes = await page.evaluate(() => (window as any).__ftmsWrites as number[][]);
  expect(writes.some((bytes) => bytes[0] === 0x00)).toBe(true);
  expect(writes.some((bytes) => bytes[0] === 0x04)).toBe(true);
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

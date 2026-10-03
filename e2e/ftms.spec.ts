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

async function mockFtms(page: Page) {
  await page.addInitScript(() => {
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
    characteristic(FEATURE, () => {
      const view = new DataView(new ArrayBuffer(8));
      view.setUint32(4, 1 << 2, true);
      return view;
    });
    characteristic(RANGE, () => {
      const view = new DataView(new ArrayBuffer(6));
      view.setInt16(0, 10, true);
      view.setInt16(2, 320, true);
      view.setUint16(4, 10, true);
      return view;
    });
    characteristic(CONTROL);

    const service = {
      async getCharacteristic(uuid: number) {
        const value = characteristics.get(uuid);
        if (!value) throw new Error("characteristic unavailable");
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
      name: "Fake TEB5",
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
  });
}

test("FTMS connection exposes live TEB5 telemetry and capabilities", async ({ page }) => {
  await seed(page);
  await mockFtms(page);
  await page.goto("/");

  await page.getByRole("button", { name: /TEB5/ }).click();
  await expect(page.getByText("Fake TEB5").first()).toBeVisible();
  await expect(page.getByText("88").first()).toBeVisible();
  await expect(page.getByText("205").first()).toBeVisible();
  await expect(page.getByText("142").first()).toBeVisible();

  await page.getByRole("button", { name: /Plus/ }).click();
  await expect(page.getByText("Control Point")).toBeVisible();
  await expect(page.getByText("Résistance cible")).toBeVisible();
  await expect(page.getByText("1–32", { exact: true })).toBeVisible();
});

test("FTMS control acknowledgement and auto resistance send real control-point commands", async ({ page }) => {
  await seed(page);
  await mockFtms(page);
  await page.goto("/");

  await page.getByRole("button", { name: /TEB5/ }).click();
  await page.getByRole("button", { name: /Plus/ }).click();

  await page.getByRole("button", { name: "Demander le contrôle FTMS" }).click();
  await expect(page.getByText("Contrôle accordé")).toBeVisible();
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

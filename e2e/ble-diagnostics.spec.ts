import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function setup(page: Page, mode: "ftms" | "absent" | "cancelled" | "pending" | "unsupported" = "ftms") {
  await page.addInitScript((mode) => {
    localStorage.setItem("veloquest:v1", JSON.stringify({ profile: { name: "PRIVATE_PROFILE", startDate: "2026-10-01" }, sessions: [], measurements: [], favoriteRouteIds: [] }));
    (window as any).__ble = { writes: 0, reads: [], disconnected: 0 };
    const uuid = (id: number) => `0000${id.toString(16)}-0000-1000-8000-00805f9b34fb`;
    const chars = [0x2acc, 0x2ad6, 0x2ad2, 0x2ad9].map(id => ({
      uuid: uuid(id), properties: { read: id === 0x2acc || id === 0x2ad6, notify: id === 0x2ad2, indicate: id === 0x2ad9, write: id === 0x2ad9 },
      async readValue() {
        (window as any).__ble.reads.push(id);
        if (id === 0x2acc) return new DataView(new Uint8Array([0, 0, 0, 0, 4, 0, 0, 0]).buffer);
        if (id === 0x2ad6) return new DataView(new Uint8Array([10, 0, 64, 1, 10, 0]).buffer);
        throw new Error("PRIVATE_MEASUREMENT");
      },
      async writeValue() { (window as any).__ble.writes++; },
      async startNotifications() { throw new Error("Must not subscribe"); }
    }));
    Object.defineProperty(navigator, "bluetooth", { configurable: true, value: mode === "unsupported" ? undefined : {
      async requestDevice(options: unknown) {
        (window as any).__ble.options = options;
        if (mode === "cancelled") throw new DOMException("PRIVATE_ERROR", "NotFoundError");
        if (mode === "pending") return new Promise(() => {});
        return { name: "PRIVATE_BIKE", id: "PRIVATE_ID", gatt: {
          async connect() { return { async getPrimaryService(id: number) {
            if (id !== 0x1826 || mode === "absent") throw new DOMException("PRIVATE_ERROR", "NotFoundError");
            return { async getCharacteristics() { return chars; } };
          } }; },
          disconnect() { (window as any).__ble.disconnected++; }
        } };
      }
    } });
  }, mode);
  await page.goto("/");
  await page.getByRole("button", { name: /Plus/ }).click();
}

test("metadata diagnostic exports privately, disconnects and leaves no stored report", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await setup(page);
  const panel = page.getByRole("region", { name: "Diagnostic matériel BLE" });
  await panel.getByRole("button", { name: "Inspecter un appareil BLE" }).click();
  await expect(panel.getByText("Qualification physique : non établie.")).toBeVisible();
  await expect(panel.getByText("1826 : 4 caractéristique(s) visible(s)")).toBeVisible();
  const downloadEvent = page.waitForEvent("download");
  await panel.getByRole("button", { name: "Exporter le rapport sans données personnelles" }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("veloquest-ble-diagnostic.json");
  const json = await readFile((await download.path())!, "utf8");
  expect(json).not.toContain("PRIVATE");
  expect(JSON.parse(json)).toMatchObject({ qualification: "not-qualified", ftms: { resistanceRange: { min: 1, max: 32, increment: 1 } } });
  expect(await page.evaluate(() => (window as any).__ble)).toMatchObject({ writes: 0, reads: [0x2acc, 0x2ad6], disconnected: 1, options: { acceptAllDevices: true } });
  await panel.getByText("Voir le rapport technique").click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await panel.screenshot({ path: `test-results/ble-diagnostic-${test.info().project.name}.png` });
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain("standard-services-only");
  await panel.getByRole("button", { name: "Effacer le rapport" }).click();
  await expect(panel.getByRole("status")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("FTMS absence is not reported as compatibility and a new attempt remains possible", async ({ page }) => {
  await setup(page, "absent");
  const panel = page.getByRole("region", { name: "Diagnostic matériel BLE" });
  await panel.getByRole("button", { name: "Inspecter un appareil BLE" }).click();
  await expect(panel.getByText("1826 : non trouvé lors de cet essai")).toBeVisible();
  await expect(panel.getByRole("button", { name: "Inspecter un appareil BLE" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Vélo Bluetooth" })).toBeEnabled();
});

test("chooser cancellation is recoverable and contains no raw error", async ({ page }) => {
  await setup(page, "cancelled");
  const panel = page.getByRole("region", { name: "Diagnostic matériel BLE" });
  await panel.getByRole("button", { name: "Inspecter un appareil BLE" }).click();
  await expect(panel.getByText(/Inventaire incomplet ou annulé/)).toBeVisible();
  await expect(panel).not.toContainText("PRIVATE_ERROR");
  await expect(page.getByRole("button", { name: "Vélo Bluetooth" })).toBeEnabled();
});

test("explicit cancellation unlocks the normal connection", async ({ page }) => {
  await setup(page, "pending");
  const panel = page.getByRole("region", { name: "Diagnostic matériel BLE" });
  await panel.getByRole("button", { name: "Inspecter un appareil BLE" }).click();
  await expect(page.getByRole("button", { name: "Vélo Bluetooth" })).toBeDisabled();
  await panel.getByRole("button", { name: "Annuler l’inventaire" }).click();
  await expect(page.getByRole("button", { name: "Vélo Bluetooth" })).toBeEnabled();
  await expect(panel.getByRole("button", { name: "Inspecter un appareil BLE" })).toBeEnabled();
});

test("unsupported browser preserves the manual mode", async ({ page }) => {
  await setup(page, "unsupported");
  const panel = page.getByRole("region", { name: "Diagnostic matériel BLE" });
  await expect(panel.getByRole("button", { name: "Inspecter un appareil BLE" })).toBeDisabled();
  await expect(panel.getByText(/Web Bluetooth indisponible/)).toBeVisible();
  await page.getByRole("button", { name: /Séances/ }).click();
  await expect(page.getByRole("heading", { name: "Décrassage" })).toBeVisible();
});

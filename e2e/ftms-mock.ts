import type { Page } from "@playwright/test";

export async function mockFtms(page: Page, mode: "standard" | "sport02" = "standard", heartRateService = false, qualified = false) {
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
    (window as any).__emitDistance = (metres: number) => {
      const view = new DataView(new ArrayBuffer(7));
      view.setUint16(0, 1 << 4, true); view.setUint16(2, 2000, true);
      view.setUint8(4, metres & 255); view.setUint8(5, (metres >> 8) & 255); view.setUint8(6, (metres >> 16) & 255);
      emit(BIKE_DATA, view);
    };
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

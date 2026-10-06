import { afterEach, describe, expect, it, vi } from "vitest";
import { connectFtmsBike, normalizeResistance, parseResistanceRange } from "../lib/ftms";

function fixture({ range = true, feature = true, data = true, controlNotify = true, bits = 4, result = 1 } = {}) {
  const listeners = new Set<(event: unknown) => void>();
  const write = vi.fn(async (bytes: Uint8Array) => {
    const value = new DataView(new Uint8Array([0x80, bytes[0], result]).buffer);
    for (const handler of listeners) handler({ target: { value } });
  });
  const dataCharacteristic = { startNotifications: vi.fn(async () => {}), addEventListener: vi.fn(), removeEventListener: vi.fn() };
  const control = {
    startNotifications: vi.fn(async () => { if (!controlNotify) throw new Error("unavailable"); }),
    writeValueWithResponse: write,
    addEventListener: (_: string, handler: (event: unknown) => void) => listeners.add(handler),
    removeEventListener: (_: string, handler: (event: unknown) => void) => listeners.delete(handler)
  };
  const service = { getCharacteristic: vi.fn(async (id: number) => {
    if (id === 0x2ad2 && data) return dataCharacteristic;
    if (id === 0x2ad9) return control;
    if (id === 0x2acc && feature) return { readValue: async () => {
      const view = new DataView(new ArrayBuffer(8)); view.setUint32(4, bits, true); return view;
    } };
    if (id === 0x2ad6 && range) return { readValue: async () => {
      const view = new DataView(new ArrayBuffer(6));
      view.setInt16(0, -20, true); view.setInt16(2, 100, true); view.setUint16(4, 5, true); return view;
    } };
    throw new DOMException("Missing", "NotFoundError");
  }) };
  const disconnect = vi.fn();
  const getPrimaryService = vi.fn(async () => service);
  const connect = vi.fn(async () => ({ getPrimaryService }));
  const device = { name: "Unknown brand", addEventListener: vi.fn(), removeEventListener: vi.fn(), gatt: { connect, disconnect } };
  const requestDevice = vi.fn(async () => device);
  vi.stubGlobal("navigator", { bluetooth: { requestDevice } });
  vi.stubGlobal("window", globalThis);
  return { write, disconnect, requestDevice, dataCharacteristic, listeners, connect, device, getPrimaryService };
}
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("generic FTMS adapter", () => {
  it("quantizes in reported units, supports signed/fractional ranges and clamps", () => {
    const range = { min: -2, max: 9.8, increment: 0.5 };
    expect(normalizeResistance(1.3, range)).toBe(1.5);
    expect(normalizeResistance(32, range)).toBe(9.5);
    expect(normalizeResistance(-100, range)).toBe(-2);
    expect(() => normalizeResistance(NaN, range)).toThrow();
    expect(() => normalizeResistance(2, { ...range, increment: 0 })).toThrow();
    expect(parseResistanceRange(new DataView(new ArrayBuffer(6)))).toBeUndefined();
    expect(parseResistanceRange(new DataView(new ArrayBuffer(3)))).toBeUndefined();
  });
  it("does not assume a brand or write before explicit control; encodes reported increments", async () => {
    const f = fixture();
    const bike = await connectFtmsBike(() => {});
    expect(f.requestDevice).toHaveBeenCalledWith({ acceptAllDevices: true, optionalServices: [0x1826] });
    expect(f.write).not.toHaveBeenCalled();
    await expect(bike.setResistance!(1.3)).rejects.toThrow("contrôle");
    await bike.requestControl!();
    await bike.setResistance!(1.3);
    expect(Array.from(f.write.mock.calls[1][0])).toEqual([4, 15, 0]);
    bike.disconnect();
    await expect(bike.setResistance!(1)).rejects.toThrow("contrôle");
  });
  it.each([{ range: false }, { feature: false }, { bits: 0 }, { controlNotify: false }])("retains telemetry but disables unproven resistance control: %j", async options => {
    const f = fixture(options);
    const bike = await connectFtmsBike(() => {});
    expect(bike.capabilities.indoorBikeData).toBe(true);
    expect(bike.setResistance).toBeUndefined();
    expect(f.write).not.toHaveBeenCalled();
    bike.disconnect();
  });
  it("disconnects when the required data characteristic is missing", async () => {
    const f = fixture({ data: false });
    await expect(connectFtmsBike(() => {})).rejects.toThrow();
    expect(f.disconnect).toHaveBeenCalled();
  });
  it("disconnects when telemetry subscription fails", async () => {
    const f = fixture();
    f.dataCharacteristic.startNotifications.mockRejectedValue(new Error("subscription failed"));
    await expect(connectFtmsBike(() => {})).rejects.toThrow();
    expect(f.disconnect).toHaveBeenCalled();
  });
  it("rejects a refused control ACK and never enables resistance", async () => {
    fixture({ result: 5 });
    const bike = await connectFtmsBike(() => {});
    await expect(bike.requestControl!()).rejects.toThrow("non autorisé");
    await expect(bike.setResistance!(2)).rejects.toThrow("requise");
  });
  it("times out a missing ACK and cleans its listener", async () => {
    vi.useFakeTimers();
    const f = fixture();
    f.write.mockImplementation(async () => {});
    const bike = await connectFtmsBike(() => {});
    const pending = expect(bike.requestControl!()).rejects.toThrow("aucune confirmation");
    await vi.advanceTimersByTimeAsync(1801);
    await pending;
    expect(f.listeners.size).toBe(0);
  });
  it("releases a stuck handshake and closes a late GATT connection", async () => {
    vi.useFakeTimers();
    const f = fixture();
    let resolve!: (server: { getPrimaryService: typeof f.getPrimaryService }) => void;
    f.connect.mockImplementation(() => new Promise(r => { resolve = r; }));
    const pending = expect(connectFtmsBike(() => {})).rejects.toThrow("délai dépassé");
    await vi.advanceTimersByTimeAsync(15_001);
    await pending;
    expect(f.disconnect).toHaveBeenCalled();
    const calls = f.disconnect.mock.calls.length;
    resolve({ getPrimaryService: f.getPrimaryService });
    await Promise.resolve();
    await Promise.resolve();
    expect(f.disconnect.mock.calls.length).toBeGreaterThan(calls);
    expect(f.getPrimaryService).not.toHaveBeenCalled();
    expect(f.write).not.toHaveBeenCalled();
  });
  it("closes a device selected after the chooser deadline without connecting", async () => {
    vi.useFakeTimers();
    const f = fixture();
    let resolve!: (device: typeof f.device) => void;
    f.requestDevice.mockImplementation(() => new Promise(r => { resolve = r; }));
    const pending = expect(connectFtmsBike(() => {})).rejects.toThrow("délai dépassé");
    await vi.advanceTimersByTimeAsync(15_001);
    await pending;
    resolve(f.device);
    await Promise.resolve();
    await Promise.resolve();
    expect(f.disconnect).toHaveBeenCalled();
    expect(f.connect).not.toHaveBeenCalled();
  });
});

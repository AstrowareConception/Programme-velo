import { afterEach, describe, expect, it, vi } from "vitest";
import { parseHeartRate, subscribeHeartRate, HEART_RATE_SERVICE } from "../lib/heart-rate";
const view = (...bytes: number[]) => new DataView(new Uint8Array(bytes).buffer);
afterEach(() => vi.useRealTimers());
describe("Heart Rate Measurement", () => {
  it("reads both widths, contact and missing measurements", () => {
    expect(parseHeartRate(view(0, 93))).toBe(93);
    expect(parseHeartRate(view(1, 44, 1))).toBe(300);
    expect(parseHeartRate(view(6, 95))).toBe(95);
    for (const data of [view(), view(0), view(1, 44), view(0, 0), view(4, 95)]) expect(parseHeartRate(data)).toBeUndefined();
  });
  it("expires old BPM and cleans up listeners on disconnect", async () => {
    vi.useFakeTimers();
    let listener: (() => void) | undefined;
    const char = { value: view(0, 93), startNotifications: vi.fn(async () => {}), stopNotifications: vi.fn(async () => {}),
      addEventListener: vi.fn((_: string, fn: () => void) => { listener = fn; }), removeEventListener: vi.fn() };
    const getCharacteristic = vi.fn(async () => char);
    const getPrimaryService = vi.fn(async () => ({ getCharacteristic }));
    const publish = vi.fn();
    const stop = subscribeHeartRate({ getPrimaryService }, publish);
    await vi.advanceTimersByTimeAsync(0);
    expect(getPrimaryService).toHaveBeenCalledWith(HEART_RATE_SERVICE);
    expect(getCharacteristic).toHaveBeenCalledWith("00002a37-0000-1000-8000-00805f9b34fb");
    listener!(); expect(publish).toHaveBeenLastCalledWith(93);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(publish).toHaveBeenLastCalledWith(undefined);
    stop(); publish.mockClear(); listener!();
    expect(publish).not.toHaveBeenCalled();
    expect(char.removeEventListener).toHaveBeenCalled();
    expect(char.stopNotifications).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("abandons a late service without subscribing or publishing", async () => {
    vi.useFakeTimers();
    let resolve!: (value: any) => void;
    const getCharacteristic = vi.fn(); const publish = vi.fn();
    subscribeHeartRate({ getPrimaryService: () => new Promise(r => { resolve = r; }) }, publish);
    await vi.advanceTimersByTimeAsync(5_000);
    resolve({ getCharacteristic }); await vi.advanceTimersByTimeAsync(0);
    expect(getCharacteristic).not.toHaveBeenCalled(); expect(publish).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("tolerates an absent service", async () => {
    vi.useFakeTimers(); const publish = vi.fn();
    subscribeHeartRate({ getPrimaryService: async () => { throw new DOMException("absent", "NotFoundError"); } }, publish);
    await vi.advanceTimersByTimeAsync(0);
    expect(publish).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { diagnoseBle, DIAGNOSTIC_SERVICES } from "../lib/ble-diagnostics";

const uuid = (id: number) => `0000${id.toString(16)}-0000-1000-8000-00805f9b34fb`;
const missing = () => new DOMException("SECRET device name / serial / address", "NotFoundError");
const view = (bytes: number[]) => new DataView(new Uint8Array(bytes).buffer);
function fixture() {
  const write = vi.fn();
  const subscribe = vi.fn();
  const personalRead = vi.fn(() => { throw new Error("Personal data must not be read"); });
  const featureRead = vi.fn(async () => view([0, 0, 0, 0, 4, 0, 0, 0]));
  const rangeRead = vi.fn(async () => view([10, 0, 64, 1, 10, 0]));
  const characteristic = (id: number, readValue = personalRead) => ({
    uuid: uuid(id), properties: { read: true, notify: true, write: false },
    readValue, writeValue: write, startNotifications: subscribe
  });
  const service = { getCharacteristics: vi.fn(async () => [
    characteristic(0x2acc, featureRead), characteristic(0x2ad6, rangeRead),
    characteristic(0x2ad2), characteristic(0x2ad9), characteristic(0x2a37)
  ]) };
  const getPrimaryService = vi.fn(async (id: number) => { if (id !== 0x1826) throw missing(); return service; });
  const disconnect = vi.fn();
  const connect = vi.fn(async () => ({ getPrimaryService }));
  const device = { id: "SECRET_ID", name: "SECRET_NAME", gatt: { connect, disconnect } };
  const bluetooth = { requestDevice: vi.fn(async () => device) };
  return { bluetooth, device, service, featureRead, rangeRead, personalRead, write, subscribe, disconnect, getPrimaryService };
}
afterEach(() => vi.useRealTimers());

describe("read-only BLE inventory", () => {
  it("uses a brand-independent chooser and only exports technical metadata", async () => {
    const f = fixture();
    const report = await diagnoseBle(f.bluetooth);
    expect(f.bluetooth.requestDevice).toHaveBeenCalledWith({ acceptAllDevices: true, optionalServices: [...DIAGNOSTIC_SERVICES] });
    expect(report).toMatchObject({ outcome: "inspected", qualification: "not-qualified", ftms: { targetSettingsBits: 4, resistanceRange: { min: 1, max: 32, increment: 1 } } });
    expect(report.services[1].status).toBe("not-found");
    expect(f.personalRead).not.toHaveBeenCalled();
    expect(f.write).not.toHaveBeenCalled();
    expect(f.subscribe).not.toHaveBeenCalled();
    expect(f.disconnect).toHaveBeenCalled();
    expect(JSON.stringify(report)).not.toMatch(/SECRET|heartRate|deviceName|timestamp|userAgent/);
  });
  it("does not invent FTMS when only a heart-rate service exists", async () => {
    const f = fixture();
    f.getPrimaryService.mockImplementation(async id => { if (id !== 0x180d) throw missing(); return f.service; });
    const report = await diagnoseBle(f.bluetooth);
    expect(report.services[0].status).toBe("not-found");
    expect(report.services[1].status).toBe("present");
    expect(report.ftms).toEqual({});
    expect(f.featureRead).not.toHaveBeenCalled();
  });
  it("distinguishes denied access from absence without exporting error messages", async () => {
    const f = fixture();
    f.getPrimaryService.mockRejectedValue(new DOMException("SECRET", "SecurityError"));
    const report = await diagnoseBle(f.bluetooth);
    expect(report.services.every(service => service.status === "not-authorized")).toBe(true);
    expect(JSON.stringify(report)).not.toContain("SECRET");
  });
  it("retains partial inventory when characteristic enumeration fails", async () => {
    const f = fixture();
    f.service.getCharacteristics.mockRejectedValue(new Error("SECRET"));
    const report = await diagnoseBle(f.bluetooth);
    expect(report.services[0]).toMatchObject({ status: "present", characteristicStatus: "unavailable", characteristics: [] });
    expect(f.disconnect).toHaveBeenCalled();
  });
  it("marks truncated features and invalid ranges without inferring support", async () => {
    const f = fixture();
    f.featureRead.mockResolvedValue(view([4]));
    f.rangeRead.mockResolvedValue(view([10, 0, 64, 1, 0, 0]));
    expect((await diagnoseBle(f.bluetooth)).ftms).toEqual({ featureStatus: "invalid", rangeStatus: "invalid", resistanceRange: undefined });
  });
  it("survives an unreadable feature and still inspects range", async () => {
    const f = fixture();
    f.featureRead.mockRejectedValue(new Error("SECRET"));
    expect((await diagnoseBle(f.bluetooth)).ftms).toMatchObject({ featureStatus: "unavailable", rangeStatus: "read" });
  });
  it("handles cancellation without connecting", async () => {
    const f = fixture();
    f.bluetooth.requestDevice.mockRejectedValue(missing());
    expect((await diagnoseBle(f.bluetooth)).outcome).toBe("cancelled-or-not-selected");
    expect(f.device.gatt.connect).not.toHaveBeenCalled();
  });
  it("closes late GATT connections after abort", async () => {
    const f = fixture();
    let resolve!: (server: { getPrimaryService: typeof f.getPrimaryService }) => void;
    f.device.gatt.connect.mockImplementation(() => new Promise(r => { resolve = r; }));
    const controller = new AbortController();
    const pending = diagnoseBle(f.bluetooth, controller.signal);
    await vi.waitFor(() => expect(f.device.gatt.connect).toHaveBeenCalled());
    controller.abort();
    expect((await pending).outcome).toBe("cancelled-or-not-selected");
    const calls = f.disconnect.mock.calls.length;
    resolve({ getPrimaryService: f.getPrimaryService });
    await Promise.resolve();
    await Promise.resolve();
    expect(f.disconnect.mock.calls.length).toBeGreaterThan(calls);
    expect(f.getPrimaryService).not.toHaveBeenCalled();
  });
  it("bounds a stuck operation and disconnects", async () => {
    vi.useFakeTimers();
    const f = fixture();
    f.device.gatt.connect.mockImplementation(() => new Promise(() => {}));
    const pending = diagnoseBle(f.bluetooth);
    await vi.advanceTimersByTimeAsync(15_001);
    expect((await pending).outcome).toBe("timeout");
    expect(f.disconnect).toHaveBeenCalled();
  });
  it("does not claim a service is present when its discovery times out", async () => {
    vi.useFakeTimers();
    const f = fixture();
    f.getPrimaryService.mockImplementation(() => new Promise(() => {}));
    const pending = diagnoseBle(f.bluetooth);
    await vi.advanceTimersByTimeAsync(15_001);
    const report = await pending;
    expect(report).toMatchObject({ outcome: "timeout", failure: { stage: "service-discovery", serviceUuid: uuid(0x1826), errorName: "TimeoutError" } });
    expect(report.services).toEqual([{ uuid: uuid(0x1826), status: "unavailable", characteristics: [], errorName: "TimeoutError" }]);
    expect(f.service.getCharacteristics).not.toHaveBeenCalled();
    expect(f.disconnect).toHaveBeenCalled();
  });
  it("keeps a confirmed service present when only characteristic discovery times out", async () => {
    vi.useFakeTimers();
    const f = fixture();
    f.service.getCharacteristics.mockImplementation(() => new Promise(() => {}));
    const pending = diagnoseBle(f.bluetooth);
    await vi.advanceTimersByTimeAsync(15_001);
    const report = await pending;
    expect(report.failure).toEqual({ stage: "characteristic-discovery", serviceUuid: uuid(0x1826), errorName: "TimeoutError" });
    expect(report.services[0]).toMatchObject({ status: "present", characteristicStatus: "unavailable", errorName: "TimeoutError" });
    expect(f.featureRead).not.toHaveBeenCalled();
  });
  it("exports only known platform codes, never arbitrary error names", async () => {
    const f = fixture();
    const error = new Error("SECRET message");
    error.name = "SECRET_NAME";
    f.device.gatt.connect.mockRejectedValue(error);
    const report = await diagnoseBle(f.bluetooth);
    expect(report.failure).toEqual({ stage: "gatt-connection", errorName: "UnknownError" });
    expect(JSON.stringify(report)).not.toContain("SECRET");
  });
});

import { parseResistanceRange, type ResistanceRange } from "./ftms";
import { bleErrorName, type BleFailure, type BleOperation } from "./ble-failure";

// Only these standard services are requested. No Device Information / serial numbers.
export const DIAGNOSTIC_SERVICES = [0x1826, 0x180d, 0x1816, 0x1818] as const;
const uuid = (value: number) => `0000${value.toString(16).padStart(4, "0")}-0000-1000-8000-00805f9b34fb`;
const propertyNames = ["read", "write", "writeWithoutResponse", "notify", "indicate"] as const;
type Status = "present" | "not-found" | "not-authorized" | "unavailable";
type Characteristic = {
  uuid: string;
  properties: Partial<Record<typeof propertyNames[number], boolean>>;
  readValue(): Promise<DataView>;
};
type Server = { getPrimaryService(id: number): Promise<{ getCharacteristics(): Promise<Characteristic[]> }> };
export type DiagnosticDevice = { gatt?: { connect(): Promise<Server>; disconnect(): void } };
export type DiagnosticBluetooth = { requestDevice(options: { acceptAllDevices: true; optionalServices: number[] }): Promise<DiagnosticDevice> };
export type BleDiagnosticReport = {
  schemaVersion: 1;
  scope: "standard-services-only";
  qualification: "not-qualified";
  outcome: "inspected" | "cancelled-or-not-selected" | "not-authorized" | "unavailable" | "timeout";
  failure?: BleFailure;
  services: {
    uuid: string;
    status: Status;
    characteristics: { uuid: string; properties: string[] }[];
    characteristicStatus?: Status;
    errorName?: string;
  }[];
  ftms: {
    featureStatus?: "read" | "invalid" | "unavailable";
    machineFeaturesBits?: number;
    targetSettingsBits?: number;
    rangeStatus?: "read" | "invalid" | "unavailable";
    resistanceRange?: ResistanceRange;
  };
};

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : "";
}
function status(error: unknown): Status {
  if (errorName(error) === "NotFoundError") return "not-found";
  if (["SecurityError", "NotAllowedError"].includes(errorName(error))) return "not-authorized";
  return "unavailable";
}

/** Metadata only. No telemetry reads, subscriptions, writes, identifiers or raw error text. */
export async function diagnoseBle(bluetooth: DiagnosticBluetooth, signal?: AbortSignal): Promise<BleDiagnosticReport> {
  const report: BleDiagnosticReport = {
    schemaVersion: 1, scope: "standard-services-only", qualification: "not-qualified",
    outcome: "inspected", services: [], ftms: {}
  };
  let device: DiagnosticDevice | undefined;
  let stopped = false;
  let operation: BleOperation = { stage: "device-selection" };
  const disconnect = () => { try { device?.gatt?.disconnect(); } catch {} };
  const abortError = () => new DOMException("Diagnostic stopped", "AbortError");
  const abort = () => { stopped = true; disconnect(); };
  signal?.addEventListener("abort", abort);
  // A stuck GATT request must not keep the UI or a late connection alive.
  async function bounded<T>(operation: Promise<T>, late?: (value: T) => void): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let rejectAbort: () => void = () => {};
    try {
      return await Promise.race([
        operation.then(value => {
          if (stopped || signal?.aborted) { late?.(value); throw abortError(); }
          return value;
        }),
        new Promise<never>((_, reject) => {
          rejectAbort = () => reject(abortError());
          signal?.addEventListener("abort", rejectAbort, { once: true });
          timer = setTimeout(() => { abort(); reject(new DOMException("Diagnostic timeout", "TimeoutError")); }, 15_000);
        })
      ]);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", rejectAbort);
    }
  }
  function ensureActive() { if (stopped || signal?.aborted) throw abortError(); }
  function rethrowStop(error: unknown) {
    if (["AbortError", "TimeoutError"].includes(errorName(error))) throw error;
    ensureActive();
  }
  try {
    ensureActive();
    // Must run immediately within the user's click, before any awaited availability check.
    device = await bounded(bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: [...DIAGNOSTIC_SERVICES] }), late => late.gatt?.disconnect());
    operation = { stage: "gatt-connection" };
    if (!device.gatt) throw new Error("GATT unavailable");
    const server = await bounded(device.gatt.connect(), disconnect);
    for (const id of DIAGNOSTIC_SERVICES) {
      ensureActive();
      operation = { stage: "service-discovery", serviceUuid: uuid(id) };
      const entry: BleDiagnosticReport["services"][number] = { uuid: uuid(id), status: "unavailable", characteristics: [] };
      report.services.push(entry);
      let service;
      try { service = await bounded(server.getPrimaryService(id)); entry.status = "present"; }
      catch (error) { entry.status = status(error); entry.errorName = bleErrorName(error); rethrowStop(error); continue; }
      let characteristics;
      operation = { stage: "characteristic-discovery", serviceUuid: uuid(id) };
      entry.characteristicStatus = "unavailable";
      try { characteristics = await bounded(service.getCharacteristics()); entry.characteristicStatus = "present"; }
      catch (error) { entry.characteristicStatus = status(error); entry.errorName = bleErrorName(error); rethrowStop(error); continue; }
      for (const characteristic of characteristics) {
        ensureActive();
        const characteristicUuid = characteristic.uuid.toLowerCase();
        // Only UUID syntax and boolean properties enter the export; no names/values.
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(characteristicUuid)) continue;
        entry.characteristics.push({ uuid: characteristicUuid, properties: propertyNames.filter(key => characteristic.properties[key] === true) });
        if (id !== 0x1826) continue;
        if (characteristicUuid === uuid(0x2acc)) {
          operation = { stage: "characteristic-read", serviceUuid: uuid(id), characteristicUuid };
          try {
            const value = await bounded(characteristic.readValue());
            report.ftms.featureStatus = value.byteLength >= 8 ? "read" : "invalid";
            if (value.byteLength >= 8) {
              report.ftms.machineFeaturesBits = value.getUint32(0, true);
              report.ftms.targetSettingsBits = value.getUint32(4, true);
            }
          } catch (error) { rethrowStop(error); report.ftms.featureStatus = "unavailable"; }
        }
        if (characteristicUuid === uuid(0x2ad6)) {
          operation = { stage: "characteristic-read", serviceUuid: uuid(id), characteristicUuid };
          try {
            report.ftms.resistanceRange = parseResistanceRange(await bounded(characteristic.readValue()));
            report.ftms.rangeStatus = report.ftms.resistanceRange ? "read" : "invalid";
          } catch (error) { rethrowStop(error); report.ftms.rangeStatus = "unavailable"; }
        }
      }
    }
  } catch (error) {
    report.failure = { ...operation, errorName: bleErrorName(error) };
    const name = errorName(error);
    report.outcome = name === "TimeoutError" ? "timeout"
      : ["AbortError", "NotFoundError"].includes(name) ? "cancelled-or-not-selected"
      : status(error) === "not-authorized" ? "not-authorized" : "unavailable";
  } finally {
    stopped = true;
    signal?.removeEventListener("abort", abort);
    disconnect();
  }
  return report;
}

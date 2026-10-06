import { bleErrorName, describeBleFailure, type BleOperation } from "./ble-failure";

export type BikeTelemetry = {
  speedKmh?: number;
  avgSpeedKmh?: number;
  cadenceRpm?: number;
  avgCadenceRpm?: number;
  resistance?: number;
  powerW?: number;
  avgPowerW?: number;
  heartRate?: number;
  totalEnergyKcal?: number;
  energyPerHourKcal?: number;
  energyPerMinuteKcal?: number;
  metabolicEquivalent?: number;
  distanceM?: number;
  elapsedSeconds?: number;
  remainingSeconds?: number;
};

export type ResistanceRange = {
  min: number;
  max: number;
  increment: number;
};

export type BikeCapabilities = {
  ftms: boolean;
  indoorBikeData: boolean;
  resistanceRange?: ResistanceRange;
  supportsResistanceTarget: boolean;
  supportsPowerTarget: boolean;
  controlPoint: boolean;
  targetSettingsBits?: number;
};

export type BikeConnection = {
  deviceName: string;
  capabilities: BikeCapabilities;
  disconnect: () => void;
  requestControl?: () => Promise<void>;
  setResistance?: (level: number) => Promise<void>;
};

const FTMS_SERVICE = 0x1826;
const FITNESS_MACHINE_FEATURE = 0x2acc;
const INDOOR_BIKE_DATA = 0x2ad2;
const SUPPORTED_RESISTANCE_RANGE = 0x2ad6;
const CONTROL_POINT = 0x2ad9;

type WebBluetoothNavigator = Navigator & {
  bluetooth?: {
    requestDevice(options: unknown): Promise<any>;
    getAvailability?: () => Promise<boolean>;
  };
};

export function hasWebBluetooth() {
  if (typeof navigator === "undefined") return false;
  return Boolean((navigator as WebBluetoothNavigator).bluetooth);
}

export async function webBluetoothAvailable() {
  const bluetooth = (navigator as WebBluetoothNavigator).bluetooth;
  if (!bluetooth) return false;
  try {
    return bluetooth.getAvailability ? await bluetooth.getAvailability() : true;
  } catch {
    return true;
  }
}

export function webBluetoothHint() {
  if (hasWebBluetooth()) return "compatible";
  if (typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent)) return "ios";
  return "unsupported";
}

function u24(view: DataView, offset: number) {
  return view.getUint8(offset) | (view.getUint8(offset + 1) << 8) | (view.getUint8(offset + 2) << 16);
}

export function parseIndoorBikeData(view: DataView): BikeTelemetry {
  if (view.byteLength < 2) return {};
  const flags = view.getUint16(0, true);
  let offset = 2;
  const out: BikeTelemetry = {};

  if ((flags & (1 << 0)) === 0) {
    if (offset + 2 > view.byteLength) return out;
    out.speedKmh = view.getUint16(offset, true) / 100;
    offset += 2;
  }
  if (flags & (1 << 1)) {
    if (offset + 2 > view.byteLength) return out;
    out.avgSpeedKmh = view.getUint16(offset, true) / 100;
    offset += 2;
  }
  if (flags & (1 << 2)) {
    if (offset + 2 > view.byteLength) return out;
    out.cadenceRpm = view.getUint16(offset, true) / 2;
    offset += 2;
  }
  if (flags & (1 << 3)) {
    if (offset + 2 > view.byteLength) return out;
    out.avgCadenceRpm = view.getUint16(offset, true) / 2;
    offset += 2;
  }
  if (flags & (1 << 4)) {
    if (offset + 3 > view.byteLength) return out;
    out.distanceM = u24(view, offset);
    offset += 3;
  }
  if (flags & (1 << 5)) {
    if (offset + 2 > view.byteLength) return out;
    out.resistance = view.getInt16(offset, true) / 10;
    offset += 2;
  }
  if (flags & (1 << 6)) {
    if (offset + 2 > view.byteLength) return out;
    out.powerW = view.getInt16(offset, true);
    offset += 2;
  }
  if (flags & (1 << 7)) {
    if (offset + 2 > view.byteLength) return out;
    out.avgPowerW = view.getInt16(offset, true);
    offset += 2;
  }
  if (flags & (1 << 8)) {
    if (offset + 5 > view.byteLength) return out;
    const totalEnergy = view.getUint16(offset, true); offset += 2;
    if (totalEnergy !== 0xffff) out.totalEnergyKcal = totalEnergy;
    out.energyPerHourKcal = view.getUint16(offset, true); offset += 2;
    out.energyPerMinuteKcal = view.getUint8(offset); offset += 1;
  }
  if (flags & (1 << 9)) {
    if (offset + 1 > view.byteLength) return out;
    out.heartRate = view.getUint8(offset);
    offset += 1;
  }
  if (flags & (1 << 10)) {
    if (offset + 1 > view.byteLength) return out;
    out.metabolicEquivalent = view.getUint8(offset) / 10;
    offset += 1;
  }
  if (flags & (1 << 11)) {
    if (offset + 2 > view.byteLength) return out;
    out.elapsedSeconds = view.getUint16(offset, true);
    offset += 2;
  }
  if (flags & (1 << 12)) {
    if (offset + 2 > view.byteLength) return out;
    out.remainingSeconds = view.getUint16(offset, true);
  }
  return out;
}

async function optionalCharacteristic(service: any, uuid: number) {
  try {
    return await service.getCharacteristic(uuid);
  } catch {
    return null;
  }
}

export function parseResistanceRange(view?: DataView): ResistanceRange | undefined {
  if (!view || view.byteLength < 6) return undefined;
  const range = {
    min: view.getInt16(0, true) / 10,
    max: view.getInt16(2, true) / 10,
    increment: view.getUint16(4, true) / 10
  };
  return range.min <= range.max && range.increment > 0 ? range : undefined;
}

export function normalizeResistance(level: number, range: ResistanceRange): number {
  if (!Number.isFinite(level) || !Number.isFinite(range.min) || !Number.isFinite(range.max)
    || !Number.isFinite(range.increment) || range.min > range.max || range.increment <= 0) {
    throw new Error("Plage ou résistance FTMS invalide.");
  }
  const min = Math.round(range.min * 10);
  const max = Math.round(range.max * 10);
  const step = Math.round(range.increment * 10);
  if (step < 1 || min < -32768 || max > 32767) throw new Error("Plage FTMS invalide.");
  const steps = Math.min(Math.floor((max - min) / step), Math.max(0, Math.round((level * 10 - min) / step)));
  return (min + steps * step) / 10;
}

async function writeControlPoint(characteristic: any, bytes: Uint8Array) {
  if (!characteristic) throw new Error("Le vélo n’expose pas le Fitness Machine Control Point.");
  if (typeof characteristic.writeValueWithResponse === "function") {
    await characteristic.writeValueWithResponse(bytes);
  } else {
    await characteristic.writeValue(bytes);
  }
}

async function controlCommand(characteristic: any, payload: Uint8Array) {
  const opcode = payload[0];

  return new Promise<void>(async (resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      characteristic.removeEventListener("characteristicvaluechanged", onResponse);
      window.clearTimeout(timeout);
    };
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };
    const onResponse = (event: Event) => {
      const value: DataView | undefined = (event.target as any)?.value;
      if (!value || value.byteLength < 3 || value.getUint8(0) !== 0x80 || value.getUint8(1) !== opcode) return;
      const result = value.getUint8(2);
      if (result === 0x01) finish();
      else {
        const labels: Record<number, string> = {
          0x02: "commande non supportée",
          0x03: "paramètre invalide",
          0x04: "échec de l’opération",
          0x05: "contrôle non autorisé"
        };
        finish(new Error(`FTMS : ${labels[result] ?? `erreur 0x${result.toString(16)}`}`));
      }
    };
    const timeout = window.setTimeout(() => finish(new Error("FTMS : aucune confirmation reçue du vélo.")), 1800);

    characteristic.addEventListener("characteristicvaluechanged", onResponse);
    try {
      await writeControlPoint(characteristic, payload);
    } catch (error) {
      finish(error instanceof Error ? error : new Error("Écriture FTMS impossible."));
    }
  });
}

export async function connectFtmsBike(
  onTelemetry: (telemetry: BikeTelemetry) => void,
  onDisconnected?: () => void
): Promise<BikeConnection> {
  const bluetooth = (navigator as WebBluetoothNavigator).bluetooth;
  if (!bluetooth) throw new Error("Web Bluetooth n’est pas disponible sur ce navigateur.");

  let device: any;
  let stopped = false;
  let operation: BleOperation = { stage: "device-selection" };
  const uuid = (id: number) => `0000${id.toString(16)}-0000-1000-8000-00805f9b34fb`;
  const characteristicOperation = (stage: BleOperation["stage"], id: number) => {
    operation = { stage, serviceUuid: uuid(FTMS_SERVICE), characteristicUuid: uuid(id) };
  };
  const disconnect = () => { try { device?.gatt?.disconnect(); } catch {} };
  // A failed/late handshake must release the physical bike for another attempt.
  async function bounded<T>(operation: Promise<T>, late?: (value: T) => void): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        operation.then(value => {
          if (stopped) { late?.(value); throw new Error("Connexion FTMS expirée."); }
          return value;
        }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            stopped = true;
            disconnect();
            reject(new DOMException("Connection timeout", "TimeoutError"));
          }, 15_000);
        })
      ]);
    } finally { clearTimeout(timer); }
  }
  const ensureActive = () => { if (stopped) throw new DOMException("Connection timeout", "TimeoutError"); };

  try {
    device = await bounded(bluetooth.requestDevice({
      acceptAllDevices: true, // Names and advertised services do not establish compatibility.
      optionalServices: [FTMS_SERVICE]
    }), (late: any) => { try { late.gatt?.disconnect(); } catch {} });

    operation = { stage: "gatt-connection" };
    const server: any = await bounded(Promise.resolve(device.gatt?.connect()), disconnect);
    if (!server) throw new Error("Connexion GATT impossible.");

    operation = { stage: "service-discovery", serviceUuid: uuid(FTMS_SERVICE) };
    const service: any = await bounded(server.getPrimaryService(FTMS_SERVICE));

    characteristicOperation("characteristic-discovery", INDOOR_BIKE_DATA);
    const dataChar: any = await bounded(service.getCharacteristic(INDOOR_BIKE_DATA));
    characteristicOperation("characteristic-discovery", FITNESS_MACHINE_FEATURE);
    const featureChar = await bounded(optionalCharacteristic(service, FITNESS_MACHINE_FEATURE));
    characteristicOperation("characteristic-discovery", SUPPORTED_RESISTANCE_RANGE);
    const rangeChar = await bounded(optionalCharacteristic(service, SUPPORTED_RESISTANCE_RANGE));
    characteristicOperation("characteristic-discovery", CONTROL_POINT);
    const controlPoint = await bounded(optionalCharacteristic(service, CONTROL_POINT));

    let targetSettingsBits: number | undefined;
    if (featureChar) {
      characteristicOperation("characteristic-read", FITNESS_MACHINE_FEATURE);
      try {
        const featureValue: DataView = await bounded<DataView>(featureChar.readValue());
        if (featureValue.byteLength >= 8) targetSettingsBits = featureValue.getUint32(4, true);
      } catch {}
    }
    ensureActive();

    let resistanceRange: ResistanceRange | undefined;
    if (rangeChar) {
      characteristicOperation("characteristic-read", SUPPORTED_RESISTANCE_RANGE);
      try {
        resistanceRange = parseResistanceRange(await bounded<DataView>(rangeChar.readValue()));
      } catch {}
    }

    ensureActive();
    let controlReady = false;
    if (controlPoint) {
      characteristicOperation("notification-subscription", CONTROL_POINT);
      try { await bounded(controlPoint.startNotifications()); controlReady = true; } catch {}
    }

    ensureActive();
    const capabilities: BikeCapabilities = {
      ftms: true,
      indoorBikeData: true,
      resistanceRange,
      supportsResistanceTarget: targetSettingsBits !== undefined && Boolean(targetSettingsBits & (1 << 2)),
      supportsPowerTarget: targetSettingsBits !== undefined ? Boolean(targetSettingsBits & (1 << 3)) : false,
      controlPoint: Boolean(controlPoint),
      targetSettingsBits
    };

    const handler = (event: Event) => {
      const characteristic = event.target as any;
      const value: DataView | undefined = characteristic.value;
      if (value) onTelemetry(parseIndoorBikeData(value));
    };

    characteristicOperation("notification-subscription", INDOOR_BIKE_DATA);
    await bounded(dataChar.startNotifications());
    ensureActive();
    dataChar.addEventListener("characteristicvaluechanged", handler);

    let controlGranted = false;
    let disconnected = false;
    const cleanup = () => {
      dataChar.removeEventListener("characteristicvaluechanged", handler);
      device.removeEventListener("gattserverdisconnected", disconnectHandler);
    };
    const disconnectHandler = () => { disconnected = true; controlGranted = false; cleanup(); onDisconnected?.(); };
    device.addEventListener("gattserverdisconnected", disconnectHandler);

    let commandPending = false;
    const sendCommand = async (payload: Uint8Array) => {
      if (disconnected) throw new Error("Connexion FTMS fermée.");
      if (commandPending) throw new Error("Une commande FTMS est déjà en cours.");
      commandPending = true;
      try {
        await controlCommand(controlPoint, payload);
        if (disconnected) throw new Error("Connexion FTMS fermée.");
      }
      catch (error) { controlGranted = false; throw error; }
      finally { commandPending = false; }
    };
    const requestControl = controlReady
      ? async () => {
          await sendCommand(new Uint8Array([0x00]));
          controlGranted = true;
        }
      : undefined;

    const setResistance = controlReady && resistanceRange && capabilities.supportsResistanceTarget
      ? async (level: number) => {
          if (!controlGranted) throw new Error("Demande de contrôle FTMS requise.");
          const value = Math.round(normalizeResistance(level, resistanceRange) * 10);
          const payload = new Uint8Array(3);
          payload[0] = 0x04;
          new DataView(payload.buffer).setInt16(1, value, true);
          await sendCommand(payload);
        }
      : undefined;

    return {
      deviceName: device.name || "Vélo FTMS",
      capabilities,
      requestControl,
      setResistance,
      disconnect: () => {
        disconnected = true;
        controlGranted = false;
        cleanup();
        try { device.gatt?.disconnect(); } catch {}
      }
    };
  } catch (error) {
    stopped = true;
    disconnect();
    throw new Error(`Connexion FTMS — ${describeBleFailure({ ...operation, errorName: bleErrorName(error) })} Ferme les autres applications connectées au vélo, réveille la console et réessaie. Si l’échec persiste, exporte l’inventaire BLE et précise l’appareil et le navigateur.`);
  }
}

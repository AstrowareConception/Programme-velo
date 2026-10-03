export type BikeTelemetry = {
  speedKmh?: number;
  cadenceRpm?: number;
  resistance?: number;
  powerW?: number;
  heartRate?: number;
  distanceM?: number;
  elapsedSeconds?: number;
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
  const flags = view.getUint16(0, true);
  let offset = 2;
  const out: BikeTelemetry = {};

  if ((flags & (1 << 0)) === 0 && offset + 2 <= view.byteLength) {
    out.speedKmh = view.getUint16(offset, true) / 100;
    offset += 2;
  }
  if (flags & (1 << 1)) offset += 2;
  if ((flags & (1 << 2)) && offset + 2 <= view.byteLength) {
    out.cadenceRpm = view.getUint16(offset, true) / 2;
    offset += 2;
  }
  if (flags & (1 << 3)) offset += 2;
  if ((flags & (1 << 4)) && offset + 3 <= view.byteLength) {
    out.distanceM = u24(view, offset);
    offset += 3;
  }
  if ((flags & (1 << 5)) && offset + 2 <= view.byteLength) {
    out.resistance = view.getInt16(offset, true) / 10;
    offset += 2;
  }
  if ((flags & (1 << 6)) && offset + 2 <= view.byteLength) {
    out.powerW = view.getInt16(offset, true);
    offset += 2;
  }
  if (flags & (1 << 7)) offset += 2;
  if (flags & (1 << 8)) offset += 5;
  if ((flags & (1 << 9)) && offset + 1 <= view.byteLength) {
    out.heartRate = view.getUint8(offset);
    offset += 1;
  }
  if (flags & (1 << 10)) offset += 1;
  if ((flags & (1 << 11)) && offset + 2 <= view.byteLength) {
    out.elapsedSeconds = view.getUint16(offset, true);
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

function parseResistanceRange(view?: DataView): ResistanceRange | undefined {
  if (!view || view.byteLength < 6) return undefined;
  return {
    min: view.getInt16(0, true) / 10,
    max: view.getInt16(2, true) / 10,
    increment: view.getUint16(4, true) / 10
  };
}

async function writeControlPoint(characteristic: any, bytes: Uint8Array) {
  if (!characteristic) throw new Error("Le vélo n’expose pas le Fitness Machine Control Point.");
  if (typeof characteristic.writeValueWithResponse === "function") {
    await characteristic.writeValueWithResponse(bytes);
  } else {
    await characteristic.writeValue(bytes);
  }
}

export async function connectFtmsBike(
  onTelemetry: (telemetry: BikeTelemetry) => void,
  onDisconnected?: () => void
): Promise<BikeConnection> {
  const bluetooth = (navigator as WebBluetoothNavigator).bluetooth;
  if (!bluetooth) throw new Error("Web Bluetooth n’est pas disponible sur ce navigateur.");

  const device = await bluetooth.requestDevice({
    filters: [
      { services: [FTMS_SERVICE] },
      { namePrefix: "TOPUTURE" },
      { namePrefix: "Sport" },
      { namePrefix: "SPORT" }
    ],
    optionalServices: [FTMS_SERVICE]
  });

  const server = await device.gatt?.connect();
  if (!server) throw new Error("Connexion GATT impossible.");

  let service: any;
  try {
    service = await server.getPrimaryService(FTMS_SERVICE);
  } catch {
    try { device.gatt?.disconnect(); } catch {}
    throw new Error("Le vélo sélectionné ne fournit pas le service FTMS (0x1826).");
  }

  const dataChar = await service.getCharacteristic(INDOOR_BIKE_DATA);
  const featureChar = await optionalCharacteristic(service, FITNESS_MACHINE_FEATURE);
  const rangeChar = await optionalCharacteristic(service, SUPPORTED_RESISTANCE_RANGE);
  const controlPoint = await optionalCharacteristic(service, CONTROL_POINT);

  let targetSettingsBits: number | undefined;
  if (featureChar) {
    try {
      const featureValue: DataView = await featureChar.readValue();
      if (featureValue.byteLength >= 8) targetSettingsBits = featureValue.getUint32(4, true);
    } catch {}
  }

  let resistanceRange: ResistanceRange | undefined;
  if (rangeChar) {
    try {
      resistanceRange = parseResistanceRange(await rangeChar.readValue());
    } catch {}
  }

  if (controlPoint) {
    try { await controlPoint.startNotifications(); } catch {}
  }

  const capabilities: BikeCapabilities = {
    ftms: true,
    indoorBikeData: true,
    resistanceRange,
    supportsResistanceTarget: targetSettingsBits !== undefined ? Boolean(targetSettingsBits & (1 << 2)) : Boolean(controlPoint && rangeChar),
    supportsPowerTarget: targetSettingsBits !== undefined ? Boolean(targetSettingsBits & (1 << 3)) : false,
    controlPoint: Boolean(controlPoint),
    targetSettingsBits
  };

  const handler = (event: Event) => {
    const characteristic = event.target as any;
    const value: DataView | undefined = characteristic.value;
    if (value) onTelemetry(parseIndoorBikeData(value));
  };

  await dataChar.startNotifications();
  dataChar.addEventListener("characteristicvaluechanged", handler);

  const disconnectHandler = () => onDisconnected?.();
  device.addEventListener("gattserverdisconnected", disconnectHandler);

  const requestControl = controlPoint
    ? async () => {
        await writeControlPoint(controlPoint, new Uint8Array([0x00]));
      }
    : undefined;

  const setResistance = controlPoint && capabilities.supportsResistanceTarget
    ? async (level: number) => {
        const range = capabilities.resistanceRange;
        const min = range?.min ?? 1;
        const max = range?.max ?? 32;
        const clamped = Math.max(min, Math.min(max, level));
        const value = Math.round(clamped * 10);
        const payload = new Uint8Array(3);
        payload[0] = 0x04;
        new DataView(payload.buffer).setInt16(1, value, true);
        await writeControlPoint(controlPoint, payload);
      }
    : undefined;

  return {
    deviceName: device.name || "Vélo FTMS",
    capabilities,
    requestControl,
    setResistance,
    disconnect: () => {
      try { dataChar.removeEventListener("characteristicvaluechanged", handler); } catch {}
      try { device.removeEventListener("gattserverdisconnected", disconnectHandler); } catch {}
      try { device.gatt?.disconnect(); } catch {}
    }
  };
}

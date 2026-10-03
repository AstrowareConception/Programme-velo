export type BikeTelemetry = {
  speedKmh?: number;
  cadenceRpm?: number;
  resistance?: number;
  powerW?: number;
  heartRate?: number;
  distanceM?: number;
  elapsedSeconds?: number;
};

export type BikeConnection = {
  deviceName: string;
  disconnect: () => void;
};

const FTMS_SERVICE = 0x1826;
const INDOOR_BIKE_DATA = 0x2ad2;

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

  // FTMS Indoor Bike Data 0x2AD2. Bit 0 means "More Data":
  // when it is NOT set, instantaneous speed is present.
  if ((flags & (1 << 0)) === 0 && offset + 2 <= view.byteLength) {
    out.speedKmh = view.getUint16(offset, true) / 100;
    offset += 2;
  }
  if (flags & (1 << 1)) offset += 2; // average speed
  if ((flags & (1 << 2)) && offset + 2 <= view.byteLength) {
    out.cadenceRpm = view.getUint16(offset, true) / 2;
    offset += 2;
  }
  if (flags & (1 << 3)) offset += 2; // average cadence
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
  if (flags & (1 << 7)) offset += 2; // average power
  if (flags & (1 << 8)) offset += 5; // total + per hour + per minute energy
  if ((flags & (1 << 9)) && offset + 1 <= view.byteLength) {
    out.heartRate = view.getUint8(offset);
    offset += 1;
  }
  if (flags & (1 << 10)) offset += 1; // MET
  if ((flags & (1 << 11)) && offset + 2 <= view.byteLength) {
    out.elapsedSeconds = view.getUint16(offset, true);
    offset += 2;
  }
  return out;
}

export async function connectFtmsBike(
  onTelemetry: (telemetry: BikeTelemetry) => void,
  onDisconnected?: () => void
): Promise<BikeConnection> {
  const bluetooth = (navigator as WebBluetoothNavigator).bluetooth;
  if (!bluetooth) throw new Error("Web Bluetooth n’est pas disponible sur ce navigateur.");

  // FTMS first; name prefixes help with TEB5 variants reported by users.
  const device = await bluetooth.requestDevice({
    filters: [{ services: [FTMS_SERVICE] }],
    optionalServices: [FTMS_SERVICE]
  });

  const server = await device.gatt?.connect();
  if (!server) throw new Error("Connexion GATT impossible.");

  const service = await server.getPrimaryService(FTMS_SERVICE);
  const dataChar = await service.getCharacteristic(INDOOR_BIKE_DATA);

  const handler = (event: Event) => {
    const characteristic = event.target as any;
    const value: DataView | undefined = characteristic.value;
    if (value) onTelemetry(parseIndoorBikeData(value));
  };

  await dataChar.startNotifications();
  dataChar.addEventListener("characteristicvaluechanged", handler);

  const disconnectHandler = () => onDisconnected?.();
  device.addEventListener("gattserverdisconnected", disconnectHandler);

  return {
    deviceName: device.name || "Vélo FTMS",
    disconnect: () => {
      try { dataChar.removeEventListener("characteristicvaluechanged", handler); } catch {}
      try { device.removeEventListener("gattserverdisconnected", disconnectHandler); } catch {}
      try { device.gatt?.disconnect(); } catch {}
    }
  };
}

import {
  connectFtmsBike,
  hasWebBluetooth,
  webBluetoothHint,
  type BikeCapabilities,
  type BikeConnection as FtmsBikeConnection,
  type BikeTelemetry,
  type ResistanceRange
} from "./ftms";

export type BikeConnection = FtmsBikeConnection & {
  adapterId: string;
};

export type BikeAdapter = {
  id: string;
  label: string;
  transport: "web-bluetooth";
  connect: (
    onTelemetry: (telemetry: BikeTelemetry) => void,
    onDisconnected?: () => void
  ) => Promise<BikeConnection>;
};

export const ftmsBikeAdapter: BikeAdapter = {
  id: "ftms",
  label: "Bluetooth FTMS",
  transport: "web-bluetooth",
  async connect(onTelemetry, onDisconnected) {
    const connection = await connectFtmsBike(onTelemetry, onDisconnected);
    return { ...connection, adapterId: "ftms" };
  }
};

export const bikeAdapters: readonly BikeAdapter[] = [ftmsBikeAdapter];

export function bikeAdapterById(id: string) {
  return bikeAdapters.find((adapter) => adapter.id === id);
}

export async function connectBike(
  onTelemetry: (telemetry: BikeTelemetry) => void,
  onDisconnected?: () => void,
  adapterId = "ftms"
) {
  const adapter = bikeAdapterById(adapterId);
  if (!adapter) throw new Error(`Adaptateur vélo inconnu : ${adapterId}.`);
  return adapter.connect(onTelemetry, onDisconnected);
}

export { hasWebBluetooth, webBluetoothHint };
export type { BikeCapabilities, BikeTelemetry, ResistanceRange };

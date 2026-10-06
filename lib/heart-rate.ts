// Bluetooth Heart Rate Service 1.0, section 3.1.1.
export const HEART_RATE_SERVICE = "0000180d-0000-1000-8000-00805f9b34fb";
const MEASUREMENT = "00002a37-0000-1000-8000-00805f9b34fb";

export function parseHeartRate(view: DataView): number | undefined {
  if (view.byteLength < 2) return undefined;
  const flags = view.getUint8(0);
  if ((flags & 4) && !(flags & 2)) return undefined; // Supported, but contact lost.
  if ((flags & 1) && view.byteLength < 3) return undefined;
  const bpm = flags & 1 ? view.getUint16(1, true) : view.getUint8(1);
  return bpm > 0 ? bpm : undefined;
}

type Characteristic = {
  value?: DataView;
  startNotifications(): Promise<unknown>;
  stopNotifications(): Promise<unknown>;
  addEventListener(name: string, handler: () => void): void;
  removeEventListener(name: string, handler: () => void): void;
};
type Server = { getPrimaryService(uuid: string): Promise<{ getCharacteristic(uuid: string): Promise<Characteristic> }> };

// Optional subscription: never delays or disconnects an otherwise working FTMS bike.
export function subscribeHeartRate(server: Server, publish: (bpm: number | undefined) => void): () => void {
  let active = true;
  let characteristic: Characteristic | undefined;
  let stale: ReturnType<typeof setTimeout> | undefined;
  const handler = () => {
    if (!active || !characteristic?.value) return;
    clearTimeout(stale);
    publish(parseHeartRate(characteristic.value));
    stale = setTimeout(() => { if (active) publish(undefined); }, 10_000);
  };
  const stopNotifications = () => { try { void characteristic?.stopNotifications().catch(() => {}); } catch {} };
  const cleanup = () => {
    active = false;
    clearTimeout(setup);
    clearTimeout(stale);
    characteristic?.removeEventListener("characteristicvaluechanged", handler);
    stopNotifications();
  };
  const setup = setTimeout(cleanup, 5_000);
  void (async () => {
    try {
      const service = await server.getPrimaryService(HEART_RATE_SERVICE);
      if (!active) return;
      characteristic = await service.getCharacteristic(MEASUREMENT);
      if (!active) return;
      characteristic.addEventListener("characteristicvaluechanged", handler);
      await characteristic.startNotifications();
      if (!active) { stopNotifications(); return; }
      clearTimeout(setup);
    } catch { cleanup(); }
  })();
  return cleanup;
}

"use client";

import { useRef, useState } from "react";
import {
  connectBike as connectBikeAdapter,
  hasWebBluetooth,
  webBluetoothHint,
  type BikeConnection,
  type BikeTelemetry
} from "@/lib/bike-adapters";
import { resistanceQualificationFor } from "@/lib/bike-qualification";

type BikeControllerOptions = {
  diagnosing: boolean;
  isLocked: () => boolean;
  onBeforeConnect?: () => void;
  onTelemetry?: (telemetry: BikeTelemetry) => void;
  onDisconnected?: () => void;
  onToast?: (message: string) => void;
};

export function useBikeController({
  diagnosing,
  isLocked,
  onBeforeConnect,
  onTelemetry,
  onDisconnected,
  onToast
}: BikeControllerOptions) {
  const [bike, setBike] = useState<BikeConnection | null>(null);
  const [telemetry, setTelemetry] = useState<BikeTelemetry>({});
  const [lastTelemetryAt, setLastTelemetryAt] = useState<number | null>(null);
  const [bluetoothError, setBluetoothError] = useState<string | null>(null);
  const [connectingBike, setConnectingBike] = useState(false);
  const [controlGranted, setControlGranted] = useState(false);
  const [controlBusy, setControlBusy] = useState(false);
  const controlBusyRef = useRef(false);
  const [testResistanceLevel, setTestResistanceLevel] = useState(1);
  const [resistanceMappingVerified, setResistanceMappingVerifiedState] = useState(false);
  const [autoResistanceControl, setAutoResistanceControl] = useState(false);

  const onBeforeConnectRef = useRef(onBeforeConnect);
  const onTelemetryRef = useRef(onTelemetry);
  const onDisconnectedRef = useRef(onDisconnected);
  const onToastRef = useRef(onToast);
  onBeforeConnectRef.current = onBeforeConnect;
  onTelemetryRef.current = onTelemetry;
  onDisconnectedRef.current = onDisconnected;
  onToastRef.current = onToast;

  function clearConnectionState(resetMapping = false) {
    setBike(null);
    setTelemetry({});
    setControlGranted(false);
    setAutoResistanceControl(false);
    if (resetMapping) setResistanceMappingVerifiedState(false);
  }

  function disconnectBike(resetMapping = false) {
    bike?.disconnect();
    clearConnectionState(resetMapping);
  }

  function setResistanceMappingVerified(verified: boolean) {
    setResistanceMappingVerifiedState(verified);
    setAutoResistanceControl(false);
  }

  async function connectBike() {
    if (isLocked() || diagnosing || connectingBike) return;

    onBeforeConnectRef.current?.();
    setResistanceMappingVerifiedState(false);
    setLastTelemetryAt(null);

    if (!hasWebBluetooth()) {
      setBluetoothError(webBluetoothHint() === "ios"
        ? "Sur iPhone/iPad, les navigateurs actuels n’exposent pas Web Bluetooth à la PWA. Le mode guidé et la saisie manuelle restent disponibles."
        : "Web Bluetooth n’est pas disponible dans ce navigateur.");
      return;
    }

    setConnectingBike(true);
    setBluetoothError(null);

    try {
      const connection = await connectBikeAdapter(
        (next) => {
          setLastTelemetryAt(Date.now());
          setTelemetry((previous) => ({ ...previous, ...next }));
          onTelemetryRef.current?.(next);
        },
        () => {
          clearConnectionState(false);
          onDisconnectedRef.current?.();
        }
      );

      setBike(connection);
      setControlGranted(false);
      setAutoResistanceControl(false);

      const range = connection.capabilities.resistanceRange;
      setTestResistanceLevel(range?.min ?? 1);

      const qualification = resistanceQualificationFor(connection);
      if (qualification.mappingVerified) setResistanceMappingVerifiedState(true);

      if (qualification.autoRequestControl && connection.requestControl && connection.setResistance) {
        try {
          await connection.requestControl();
          setControlGranted(true);
          setAutoResistanceControl(true);
        } catch (error) {
          setBluetoothError(`Pilotage automatique indisponible : ${error instanceof Error ? error.message : "contrôle refusé"}`);
        }
      }

      onToastRef.current?.(
        range
          ? `${connection.deviceName} connecté · résistance ${range.min}–${range.max}`
          : `${connection.deviceName} connecté`
      );
    } catch (error) {
      setBluetoothError(error instanceof Error ? error.message : "Connexion Bluetooth impossible.");
    } finally {
      setConnectingBike(false);
    }
  }

  async function requestBikeControl() {
    if (!bike?.requestControl || controlBusyRef.current) return;
    controlBusyRef.current = true;
    setControlBusy(true);
    setBluetoothError(null);

    try {
      await bike.requestControl();
      setControlGranted(true);
      if (resistanceMappingVerified) setAutoResistanceControl(true);
      onToastRef.current?.("Contrôle FTMS accordé par le vélo.");
    } catch (error) {
      setControlGranted(false);
      setBluetoothError(error instanceof Error ? error.message : "Contrôle FTMS refusé.");
      setAutoResistanceControl(false);
    } finally {
      controlBusyRef.current = false;
      setControlBusy(false);
    }
  }

  async function sendTestResistance(blocked: boolean) {
    if (!bike?.setResistance || !controlGranted || blocked || controlBusyRef.current) return;
    controlBusyRef.current = true;
    setControlBusy(true);
    setBluetoothError(null);

    try {
      await bike.setResistance(testResistanceLevel);
      onToastRef.current?.(`Commande ${testResistanceLevel} acquittée ; effet physique à vérifier.`);
    } catch (error) {
      setControlGranted(false);
      setAutoResistanceControl(false);
      setBluetoothError(error instanceof Error ? error.message : "Commande de résistance refusée.");
    } finally {
      controlBusyRef.current = false;
      setControlBusy(false);
    }
  }

  function failAutomaticControl(error: unknown) {
    setAutoResistanceControl(false);
    setControlGranted(false);
    setBluetoothError(error instanceof Error ? error.message : "Pilotage automatique interrompu.");
  }

  return {
    bike,
    telemetry,
    lastTelemetryAt,
    bluetoothError,
    connectingBike,
    controlGranted,
    controlBusy,
    testResistanceLevel,
    resistanceMappingVerified,
    autoResistanceControl,
    connectBike,
    disconnectBike,
    requestBikeControl,
    sendTestResistance,
    failAutomaticControl,
    setTestResistanceLevel,
    setResistanceMappingVerified,
    setAutoResistanceControl
  };
}

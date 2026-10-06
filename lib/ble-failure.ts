export type BleOperation = {
  stage: "device-selection" | "gatt-connection" | "service-discovery" | "characteristic-discovery" | "characteristic-read" | "notification-subscription";
  serviceUuid?: string;
  characteristicUuid?: string;
};
export type BleFailure = BleOperation & { errorName: string };

// Only known platform codes enter the report, never arbitrary error text or names.
export function bleErrorName(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  return ["AbortError", "TimeoutError", "NetworkError", "SecurityError", "NotAllowedError",
    "NotFoundError", "InvalidStateError", "NotSupportedError", "InvalidModificationError"].includes(name)
    ? name : "UnknownError";
}

export function describeBleFailure(failure: BleFailure): string {
  const labels: Record<BleOperation["stage"], string> = {
    "device-selection": "sélection de l’appareil",
    "gatt-connection": "connexion GATT",
    "service-discovery": "découverte du service",
    "characteristic-discovery": "découverte des caractéristiques",
    "characteristic-read": "lecture de la caractéristique",
    "notification-subscription": "activation des notifications"
  };
  const short = (value: string) => value.slice(4, 8).toUpperCase();
  const target = failure.characteristicUuid ? ` 0x${short(failure.characteristicUuid)}`
    : failure.serviceUuid ? ` 0x${short(failure.serviceUuid)}` : "";
  const reason = failure.errorName === "TimeoutError" ? "délai dépassé"
    : failure.errorName === "NotFoundError" ? "non trouvé lors de cet essai"
    : ["SecurityError", "NotAllowedError"].includes(failure.errorName) ? "accès refusé"
    : failure.errorName === "AbortError" ? "annulé" : "échec";
  return `${labels[failure.stage]}${target} : ${reason} (${failure.errorName}).`;
}

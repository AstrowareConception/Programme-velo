/** Explicit allowlist: never serialize app state, errors, devices or browser identifiers. */
export type SupportDiagnosticInput = {
  buildCommit: string | undefined;
  environment: {
    width: number; height: number; standalone: boolean; online: boolean; secureContext: boolean;
    webBluetooth: boolean; serviceWorker: boolean; clipboard: boolean; wakeLock: boolean;
  };
  pwa: {
    registered: boolean; controlled: boolean; updateWaiting: boolean; busy: boolean;
    cache: { release: string; ready: boolean } | null;
  };
  storage: { hydrated: boolean; stateSaveFailed: boolean; routesSaveFailed: boolean };
  session: { active: boolean; recoveryAvailable: boolean };
  bluetooth: { connected: boolean; connecting: boolean; inspecting: boolean };
};

function commit(value: string | undefined) {
  return typeof value === "string" && /^[a-f0-9]{40}$/i.test(value) ? value : "unknown";
}
function pixels(value: number) {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

export function buildSupportDiagnostic(input: SupportDiagnosticInput, now = new Date()) {
  const env = input.environment;
  return {
    schema: "veloquest-support-v1",
    generatedAt: now.toISOString(),
    app: { name: "VeloQuest", openedBuild: commit(input.buildCommit) },
    environment: {
      viewport: { width: pixels(env.width), height: pixels(env.height) },
      displayMode: env.standalone === true ? "standalone" : "browser",
      online: env.online === true,
      secureContext: env.secureContext === true,
      apisExposed: {
        webBluetooth: env.webBluetooth === true, serviceWorker: env.serviceWorker === true,
        clipboard: env.clipboard === true, wakeLock: env.wakeLock === true
      }
    },
    pwa: {
      registered: input.pwa.registered === true, controlled: input.pwa.controlled === true,
      updateWaiting: input.pwa.updateWaiting === true, busy: input.pwa.busy === true,
      cache: input.pwa.cache ? { release: commit(input.pwa.cache.release), ready: input.pwa.cache.ready === true } : null
    },
    storage: {
      hydrated: input.storage.hydrated === true,
      stateSaveFailed: input.storage.stateSaveFailed === true,
      routesSaveFailed: input.storage.routesSaveFailed === true
    },
    session: { active: input.session.active === true, recoveryAvailable: input.session.recoveryAvailable === true },
    bluetooth: {
      connected: input.bluetooth.connected === true, connecting: input.bluetooth.connecting === true,
      inspecting: input.bluetooth.inspecting === true
    }
  };
}

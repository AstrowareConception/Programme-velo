import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { initializeFirestore, memoryLocalCache, connectFirestoreEmulator } from "firebase/firestore";
import { cloudConfigured, emulatorEnabled, firebaseConfig } from "./config";
let instance: ReturnType<typeof initialize> | undefined;
function initialize() {
  if (!cloudConfigured) throw new Error("Le cloud n’est pas configuré sur cette installation.");
  const app = getApps().find(a => a.name === "veloquest-cloud") ?? initializeApp(firebaseConfig, "veloquest-cloud");
  const auth = getAuth(app);
  // The existing local store owns offline writes. Avoid a second durable cache across accounts.
  const db = initializeFirestore(app, { localCache: memoryLocalCache() });
  if (emulatorEnabled()) { connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true }); connectFirestoreEmulator(db, "127.0.0.1", 8080); }
  auth.languageCode = "fr";
  return { auth, db };
}
export function firebase() { return instance ??= initialize(); }

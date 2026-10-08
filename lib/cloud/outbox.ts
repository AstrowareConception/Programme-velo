import type { UploadIntent } from "./engine";
let opened: Promise<IDBDatabase> | undefined;
function database() {
  return opened ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("veloquest-cloud-outbox", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("pending");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { opened = undefined; reject(new Error("Impossible de préparer une copie locale sûre pour l’envoi cloud.")); };
    request.onblocked = () => { opened = undefined; reject(new Error("Ferme les autres onglets pour préparer la sauvegarde cloud.")); };
  });
}
async function access<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending", mode), request = action(tx.objectStore("pending"));
    tx.oncomplete = () => resolve(request.result);
    tx.onabort = () => reject(new Error("L’envoi cloud n’a pas pu être préparé durablement sur cet appareil."));
    tx.onerror = () => reject(new Error("Stockage de sauvegarde indisponible. Conserve un export JSON et réessaie."));
  });
}
export async function readIntent(): Promise<UploadIntent | null> { return (await access("readonly", s => s.get("upload"))) ?? null; }
export async function stageIntent(intent: UploadIntent) { await access("readwrite", s => s.put(intent, "upload")); }
export async function clearIntent() { await access("readwrite", s => s.delete("upload")); }

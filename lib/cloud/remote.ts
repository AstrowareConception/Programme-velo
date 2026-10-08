import { collection, doc, getDocFromServer, getDocsFromServer, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp, type Firestore } from "firebase/firestore";
import { decodeData, type CloudData } from "./model";
export type Revision = { id: string; createdAt: string; summary: string; kind: string };
export class HeadChanged extends Error { readonly code = "cloud/head-changed"; constructor() { super("Une autre sauvegarde vient d’arriver. Relance la synchronisation."); } }
const MAX_BYTES = 3 * 1024 * 1024;
async function digest(text: string) { return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))), b => b.toString(16).padStart(2, "0")).join(""); }
export class CloudRemote {
  constructor(private db: Firestore, readonly uid: string) {}
  private root(...parts: string[]) { return doc(this.db, "users", this.uid, ...parts); }
  async head(): Promise<string | null> { const d = await getDocFromServer(this.root("sync", "head")); return d.exists() ? d.data().revision : null; }
  watch(changed: () => void, error: (e: unknown) => void) { return onSnapshot(this.root("sync", "head"), { includeMetadataChanges: true }, s => { if (!s.metadata.fromCache && !s.metadata.hasPendingWrites) changed(); }, error); }
  async read(id: string): Promise<CloudData> {
    const snapshot = await getDocFromServer(this.root("revisions", id));
    if (!snapshot.exists()) throw new Error("Cette version n’est plus disponible. Les données locales sont conservées.");
    const m = snapshot.data();
    if (m.schema !== 1 || !Number.isInteger(m.chunks) || m.chunks < 1 || m.chunks > 60) throw new Error("Version cloud non reconnue.");
    const chunks = await Promise.all(Array.from({ length: m.chunks }, (_, i) => getDocFromServer(this.root("revisions", id, "chunks", String(i)))));
    if (chunks.some(s => !s.exists() || typeof s.data()?.text !== "string")) throw new Error("Sauvegarde cloud incomplète.");
    const text = chunks.map(s => s.data()!.text).join("");
    if (new TextEncoder().encode(text).length !== m.bytes || await digest(text) !== m.hash) throw new Error("L’intégrité de la sauvegarde n’a pas pu être vérifiée.");
    return decodeData(text);
  }
  async history(): Promise<Revision[]> {
    const rows = await getDocsFromServer(query(collection(this.db, "users", this.uid, "revisions"), orderBy("createdAt", "desc"), limit(30)));
    return rows.docs.map(d => ({ id: d.id, createdAt: d.data().createdAt?.toDate?.().toISOString() ?? "", summary: d.data().summary, kind: d.data().kind }));
  }
  async commit(expected: string | null, data: CloudData, before?: CloudData, kind = "sync", revisionId?: string) {
    const pack = async (value: CloudData, type: string) => {
      const text = JSON.stringify(value), bytes = new TextEncoder().encode(text).length;
      decodeData(text);
      if (bytes > MAX_BYTES) throw new Error("Sauvegarde trop volumineuse pour le cloud (3 Mo). Exporte ton JSON ; aucune donnée locale n’a été effacée.");
      const chunks: string[] = []; let part = "";
      for (const character of text) { if (part.length + character.length > 60000) { chunks.push(part); part = ""; } part += character; }
      if (part) chunks.push(part);
      return { id: crypto.randomUUID(), chunks, manifest: { schema: 1, chunks: chunks.length, bytes, hash: await digest(text), kind: type, summary: `${value.state.sessions.length} séance(s) · ${value.state.measurements.length} mesure(s)`, createdAt: serverTimestamp() } };
    };
    const current = await pack(data, kind), archive = before ? await pack(before, "before-merge") : null;
    if (revisionId) current.id = revisionId;
    await runTransaction(this.db, async tx => {
      const head = this.root("sync", "head"), old = await tx.get(head);
      const already = await tx.get(this.root("revisions", current.id));
      if (already.exists()) {
        if (already.data().hash !== current.manifest.hash) throw new Error("Identifiant de sauvegarde déjà utilisé pour un contenu différent.");
        return;
      }
      if ((old.exists() ? old.data().revision : null) !== expected) throw new HeadChanged();
      for (const item of [archive, current]) if (item) {
        tx.set(this.root("revisions", item.id), item.manifest);
        item.chunks.forEach((text, i) => tx.set(this.root("revisions", item.id, "chunks", String(i)), { text }));
      }
      tx.set(head, { revision: current.id, updatedAt: serverTimestamp(), schema: 1 });
    });
    return current.id;
  }
}

import { canonical, mergeData, type Choices, type CloudData, type Conflict } from "./model";
export interface RemoteStore {
  uid: string;
  head(): Promise<string | null>;
  read(id: string): Promise<CloudData>;
  commit(expected: string | null, data: CloudData, before?: CloudData, kind?: string, revisionId?: string): Promise<string>;
}
export type UploadIntent = { uid: string; id: string; expected: string | null; local: CloudData; data: CloudData; before?: CloudData; kind: string };
export type Proposal = { local: CloudData; remote: CloudData | null; data: CloudData; conflicts: Conflict[]; head: string | null; base: CloudData | null; kind: "sync" | "restore" };
export async function propose(remote: RemoteStore, local: CloudData, baseId: string | null, restoreId?: string, baseOverride?: CloudData): Promise<Proposal> {
  const head = await remote.head();
  const [current, base, restore] = await Promise.all([head ? remote.read(head) : null, baseId && baseId !== head ? remote.read(baseId) : null, restoreId ? remote.read(restoreId) : null]);
  if (restore) return { local, remote: current, data: restore, conflicts: [], head, base, kind: "restore" };
  const actualBase = baseOverride ?? (baseId === head ? current : base);
  const merged = current ? mergeData(actualBase, local, current) : { data: local, conflicts: [] };
  return { local, remote: current, ...merged, head, base: actualBase, kind: "sync" };
}
export async function accept(remote: RemoteStore, proposal: Proposal, choices: Choices, fresh: () => CloudData | null, install: (data: CloudData, revision: string) => void, stage?: (intent: UploadIntent) => void | Promise<void>) {
  const valid = () => { const current = fresh(); if (!current || canonical(current) !== canonical(proposal.local)) throw new Error("Les données ou l’activité ont changé. Relance la synchronisation avant de choisir."); };
  valid();
  const merged = proposal.kind === "restore" || !proposal.remote ? { data: proposal.data, conflicts: [] } : mergeData(proposal.base, proposal.local, proposal.remote, choices);
  if (merged.conflicts.length) throw new Error("Choisis une version pour chaque conflit avant de continuer.");
  // Keep the local candidate too when adopting another device's edits or restoring history.
  const before = canonical(proposal.local) !== canonical(merged.data) && (proposal.kind === "restore" || !proposal.base || canonical(proposal.local) !== canonical(proposal.base)) ? proposal.local : undefined;
  let revision = proposal.head;
  if (!revision || before || canonical(proposal.remote) !== canonical(merged.data)) {
    const id = crypto.randomUUID();
    await stage?.({ uid: remote.uid, id, expected: proposal.head, local: proposal.local, data: merged.data, before, kind: proposal.kind });
    revision = await remote.commit(proposal.head, merged.data, before, proposal.kind, id);
  } else if (await remote.head() !== proposal.head) throw new Error("La sauvegarde distante a changé. Relance la synchronisation.");
  valid();
  install(merged.data, revision!);
  return revision;
}

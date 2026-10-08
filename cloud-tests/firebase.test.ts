import { readFileSync } from "node:fs";
import { beforeAll, afterAll, beforeEach, expect, it } from "vitest";
import { initializeTestEnvironment, assertFails, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { CloudRemote, HeadChanged } from "../lib/cloud/remote";
import { emptyState } from "../lib/data";
import { cloudData } from "../lib/cloud/model";
let env: RulesTestEnvironment;
beforeAll(async () => { env = await initializeTestEnvironment({ projectId: "demo-veloquest", firestore: { host: "127.0.0.1", port: 8080, rules: readFileSync("firestore.rules", "utf8") } }); }, 20000);
afterAll(async () => { await env?.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });
const data = () => cloudData(emptyState(), []);
const store = (uid = "alice") => new CloudRemote(env.authenticatedContext(uid, { email_verified: true }).firestore() as any, uid);
it("stores and verifies a version, roundtrips Unicode, lists history and refuses stale CAS", async () => {
  const remote = store(), d = data(); d.state.profile.name = "x".repeat(59965) + "🚲é".repeat(10000);
  const revision = await remote.commit(null, d); expect(await remote.head()).toBe(revision); expect(await remote.read(revision)).toEqual(d);
  await expect(remote.commit(null, data())).rejects.toBeInstanceOf(HeadChanged);
  expect(await remote.history()).toHaveLength(1);
}, 20000);
it("atomically retains the pre-merge local version during restore", async () => {
  const remote = store(), initial = data(), changed = data(); changed.state.profile.name = "changed";
  const first = await remote.commit(null, initial); await remote.commit(first, initial, changed, "restore");
  const history = await remote.history(); expect(history).toHaveLength(3);
  const before = history.find(x => x.kind === "before-merge")!; expect(await remote.read(before.id)).toEqual(changed);
});
it("denies anonymous, unverified and other-user access, including archives and chunks", async () => {
  const revision = await store().commit(null, data());
  for (const db of [env.unauthenticatedContext().firestore(), env.authenticatedContext("alice", { email_verified: false }).firestore(), env.authenticatedContext("bob", { email_verified: true }).firestore()]) {
    for (const path of ["users/alice/sync/head", `users/alice/revisions/${revision}`, `users/alice/revisions/${revision}/chunks/0`]) {
      await assertFails(getDoc(doc(db, path))); await assertFails(setDoc(doc(db, path), { text: "stolen" }));
    }
  }
});
it("denies edits or deletes of a saved version and rejects invalid head/schema", async () => {
  const db = env.authenticatedContext("alice", { email_verified: true }).firestore(), revision = await store().commit(null, data());
  await assertFails(setDoc(doc(db, `users/alice/revisions/${revision}/chunks/0`), { text: "replaced" }));
  await assertFails(deleteDoc(doc(db, `users/alice/revisions/${revision}`)));
  await assertFails(setDoc(doc(db, "users/alice/sync/head"), { revision: "missing", schema: 1 }));
  await assertFails(setDoc(doc(db, "users/alice/revisions/bad"), { schema: 999 }));
});
it("rejects oversized backups without advancing the head", async () => {
  const remote = store(), d = data(); d.state.profile.name = "x".repeat(3 * 1024 * 1024);
  await expect(remote.commit(null, d)).rejects.toThrow(/volumineuse/); expect(await remote.head()).toBe(null);
});
it("refuses corrupt remote chunks before any local installation", async () => {
  const remote = store(), revision = await remote.commit(null, data());
  await env.withSecurityRulesDisabled(async c => { await setDoc(doc(c.firestore(), `users/alice/revisions/${revision}/chunks/0`), { text: "{}" }); });
  await expect(remote.read(revision)).rejects.toThrow(/intégrité/);
});
it("retries an acknowledged upload idempotently even after another device advanced the head", async () => {
  const remote = store(), d = data(), id = crypto.randomUUID();
  expect(await remote.commit(null, d, undefined, "sync", id)).toBe(id);
  const changed = data(); changed.state.profile.name = "phone"; const latest = await remote.commit(id, changed);
  expect(await remote.commit(null, d, undefined, "sync", id)).toBe(id); expect(await remote.head()).toBe(latest); expect(await remote.history()).toHaveLength(2);
  await expect(remote.commit(latest, changed, undefined, "sync", id)).rejects.toThrow(/contenu différent/);
});

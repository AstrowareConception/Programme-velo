import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appPath = path.join(root, "components", "VeloQuestApp.tsx");
const controllerPath = path.join(root, "components", "useBikeController.ts");
const adapterPath = path.join(root, "lib", "bike-adapters.ts");
const qualificationPath = path.join(root, "lib", "bike-qualification.ts");

const read = (file) => fs.readFileSync(file, "utf8");
const app = read(appPath);
const controller = read(controllerPath);
const adapters = read(adapterPath);
const qualification = read(qualificationPath);
const failures = [];

const appLines = app.split(/\r?\n/).length;
if (appLines > 2250) {
  failures.push(`VeloQuestApp.tsx repasse à ${appLines} lignes (limite de consolidation : 2250).`);
}

for (const forbidden of [
  { pattern: /toputure|\bteb5\b|\btbe5\b|sport02/i, reason: "une marque ou un modèle de vélo" },
  { pattern: /@\/lib\/ftms/, reason: "le protocole FTMS direct" },
  { pattern: /@\/lib\/bike-qualification/, reason: "la qualification matérielle directe" }
]) {
  if (forbidden.pattern.test(app)) {
    failures.push(`VeloQuestApp.tsx référence encore ${forbidden.reason} ; passer par le contrôleur/adaptateur.`);
  }
}

if (!app.includes('useBikeController')) {
  failures.push("VeloQuestApp.tsx doit utiliser useBikeController pour le cycle de vie du vélo.");
}
if (!controller.includes('@/lib/bike-adapters')) {
  failures.push("useBikeController doit passer par le registre des adaptateurs.");
}
if (/toputure|\bteb5\b|\btbe5\b|sport02/i.test(controller)) {
  failures.push("useBikeController ne doit contenir aucune logique de marque ou de modèle.");
}
if (!adapters.includes('id: "ftms"') || !adapters.includes("connectFtmsBike")) {
  failures.push("Le registre doit conserver FTMS comme adaptateur générique explicite.");
}
if (!qualification.includes("knownBikeProfiles")) {
  failures.push("Les exceptions/profils matériels connus doivent rester centralisés dans bike-qualification.ts.");
}

if (failures.length) {
  console.error("Architecture VéloQuest : contrôle échoué.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Architecture VéloQuest : OK · VeloQuestApp ${appLines}/2250 lignes · contrôleur/adaptateurs séparés.`);

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([".git", ".next", "node_modules", "test-results"]);
const markdownFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (entry.isFile() && entry.name.endsWith(".md")) markdownFiles.push(absolute);
  }
}

function candidateExists(candidate) {
  if (fs.existsSync(candidate)) return true;
  if (!path.extname(candidate) && fs.existsSync(`${candidate}.md`)) return true;
  if (fs.existsSync(path.join(candidate, "README.md"))) return true;
  return false;
}

walk(root);

const broken = [];
let checked = 0;
const linkPattern = /!?\[[^\]]*\]\(([^)]+)\)/g;

for (const file of markdownFiles) {
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(linkPattern)) {
    let target = match[1].trim();
    if (!target) continue;

    if (target.startsWith("<") && target.includes(">")) {
      target = target.slice(1, target.indexOf(">"));
    } else {
      target = target.split(/\s+["']/)[0].trim();
    }

    if (/^(?:https?:|mailto:|tel:|data:)/i.test(target) || target.startsWith("#")) continue;
    if (target.startsWith("/")) continue;

    target = target.split("#")[0].split("?")[0];
    if (!target) continue;

    try { target = decodeURIComponent(target); } catch { /* keep the literal target */ }

    checked += 1;
    const resolved = path.resolve(path.dirname(file), target);
    if (!candidateExists(resolved)) {
      broken.push(`${path.relative(root, file)} -> ${target}`);
    }
  }
}

if (broken.length) {
  console.error("Documentation VéloQuest : liens locaux cassés.");
  for (const item of broken) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`Documentation VéloQuest : OK · ${markdownFiles.length} fichiers Markdown · ${checked} liens locaux vérifiés.`);

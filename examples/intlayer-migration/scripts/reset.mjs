import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pristine = path.join(root, "intlayer-pristine");
const src = path.join(root, "src");

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const ent of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, ent.name);
    const b = path.join(to, ent.name);
    if (ent.isDirectory()) {
      copyDir(a, b);
    } else {
      fs.copyFileSync(a, b);
    }
  }
}

if (!fs.existsSync(pristine)) {
  console.error("intlayer-pristine/ is missing");
  process.exit(1);
}

rmrf(src);
copyDir(pristine, src);
rmrf(path.join(root, ".translation-cache"));
for (const extra of ["migrate-intlayer-report.md"]) {
  const p = path.join(root, extra);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
  }
}

console.log("Reset src/ from intlayer-pristine/ (catalog, report, and cache cleared).");

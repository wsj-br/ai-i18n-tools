import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pristine = path.join(root, "pristine");
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
  console.error("pristine/ is missing");
  process.exit(1);
}

// Restore the working dictionaries (English + pt-BR; es and zh-Hans missing) and
// clear everything translate-intlayer produces so the demo starts over cleanly.
rmrf(src);
copyDir(pristine, src);
rmrf(path.join(root, ".i18n"));
rmrf(path.join(root, ".translation-cache"));

console.log("Reset src/ from pristine/ (es and zh-Hans leaves cleared; catalog and cache removed).");

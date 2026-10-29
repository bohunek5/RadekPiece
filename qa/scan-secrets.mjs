import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
const ignored = new Set([
  "node_modules",
  "dist",
  ".git",
  ".openai",
  "artifacts",
  "evidence",
]);
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/,
  /(?:api[_-]?key|client[_-]?secret|access[_-]?token)\s*[:=]\s*["'][A-Za-z0-9_+\/-]{24,}["']/i,
];
const findings = [];
async function scan(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await scan(file);
    else if (
      /\.(?:js|mjs|json|html|css|md|yml|yaml|env)$/.test(entry.name) &&
      entry.name !== "scan-secrets.mjs"
    ) {
      const source = await readFile(file, "utf8");
      if (patterns.some((pattern) => pattern.test(source)))
        findings.push(path.relative(process.cwd(), file));
    }
  }
}
await scan(process.cwd());
if (findings.length) {
  console.error("Potential credentials found in:", findings.join(", "));
  process.exitCode = 1;
} else console.log("Scoped credential scan: no matches.");

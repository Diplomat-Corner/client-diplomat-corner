#!/usr/bin/env node
/**
 * Next.js build spawns worker processes that inherit NODE_OPTIONS. On Node.js
 * 25+, the Web Storage API expects `--localstorage-file=<path>`. A missing or
 * invalid path (often injected by the IDE or shell) triggers:
 *   Warning: `--localstorage-file` was provided without a valid path
 *
 * We strip any `--localstorage-file` usage, then set one stable path under
 * os.tmpdir() so workers inherit a valid configuration.
 */
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

/** Remove all --localstorage-file variants from NODE_OPTIONS. */
function stripLocalstorageFileOptions(raw) {
  if (!raw?.trim()) return undefined;
  const tokens = raw.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "--localstorage-file") {
      const next = tokens[i + 1];
      if (next && !next.startsWith("-")) i += 1;
      continue;
    }
    if (t.startsWith("--localstorage-file=")) continue;
    out.push(t);
  }
  return out.length ? out.join(" ") : undefined;
}

const env = { ...process.env };
const stripped = stripLocalstorageFileOptions(env.NODE_OPTIONS);

const storagePath = path.join(tmpdir(), "client-diplomat-corner-node-localstorage");
writeFileSync(storagePath, "", { flag: "a" });
const withStorage = `--localstorage-file=${storagePath}`;

if (stripped) {
  env.NODE_OPTIONS = `${stripped} ${withStorage}`;
} else {
  env.NODE_OPTIONS = withStorage;
}

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");
const forward = process.argv.slice(2).length ? process.argv.slice(2) : ["build"];

const child = spawn(process.execPath, [nextCli, ...forward], {
  env,
  stdio: "inherit",
  cwd: root,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});

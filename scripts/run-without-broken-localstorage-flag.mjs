#!/usr/bin/env node
/**
 * Next.js build spawns worker processes that inherit NODE_OPTIONS.
 *
 * - Node 20–24: `--localstorage-file` is NOT allowed in NODE_OPTIONS (exit 9 if
 *   set). We only STRIP any inherited `--localstorage-file` flags (e.g. from IDE).
 * - Node 25+: Web Storage may expect `--localstorage-file=<path>`. After stripping
 *   bad values, we set one stable path under os.tmpdir() for workers.
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
const nodeMajor = Number(String(process.versions.node).split(".")[0]) || 0;

/** Node 25+ allows --localstorage-file in NODE_OPTIONS; Node 20 exits with "not allowed". */
const injectLocalstorageFile = nodeMajor >= 25;

if (injectLocalstorageFile) {
  const storagePath = path.join(
    tmpdir(),
    "client-diplomat-corner-node-localstorage"
  );
  writeFileSync(storagePath, "", { flag: "a" });
  const withStorage = `--localstorage-file=${storagePath}`;
  env.NODE_OPTIONS = stripped ? `${stripped} ${withStorage}` : withStorage;
} else if (stripped !== undefined) {
  env.NODE_OPTIONS = stripped;
} else {
  delete env.NODE_OPTIONS;
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

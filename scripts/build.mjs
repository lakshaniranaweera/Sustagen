// Build-time game gating (hard boundary).
//
// Reads games.build.json, then for every DISABLED game physically moves its
// route folders out of src/app before `next build` and restores them after, so
// the disabled game has no page and no code in the exported `out/` — a real 404,
// nothing to bypass client-side. Also regenerates public/games.json to match, so
// the landing/admin only show games that were actually built.
//
// Safe against interruption: excluded folders are held under .build-excluded/
// with a manifest, and any leftovers are restored at the start of the next run.

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  renameSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { dirname, join } from "node:path";

const ROOT = process.cwd();
const HOLD = join(ROOT, ".build-excluded");
const MANIFEST = join(HOLD, "manifest.json");
const BUILD_CFG = join(ROOT, "games.build.json");
const PUBLIC_CFG = join(ROOT, "public", "games.json");

// Route folders a game owns (id === folder name).
function routeDirs(id) {
  return [join("src", "app", id), join("src", "app", "admin", id)];
}

function move(fromRel, toAbs) {
  const fromAbs = join(ROOT, fromRel);
  if (!existsSync(fromAbs)) return false;
  mkdirSync(dirname(toAbs), { recursive: true });
  renameSync(fromAbs, toAbs);
  return true;
}

// Restore any folders held from a previous (possibly interrupted) run.
function restore() {
  if (!existsSync(MANIFEST)) {
    if (existsSync(HOLD)) rmSync(HOLD, { recursive: true, force: true });
    return;
  }
  const held = JSON.parse(readFileSync(MANIFEST, "utf8"));
  for (const rel of held) {
    const heldAbs = join(HOLD, rel);
    const backAbs = join(ROOT, rel);
    if (existsSync(heldAbs)) {
      mkdirSync(dirname(backAbs), { recursive: true });
      renameSync(heldAbs, backAbs);
    }
  }
  rmSync(HOLD, { recursive: true, force: true });
}

function readConfig() {
  const cfg = JSON.parse(readFileSync(BUILD_CFG, "utf8"));
  if (!Array.isArray(cfg.games)) throw new Error("games.build.json: missing games[]");
  return cfg.games.map((g) => ({ id: g.id, enabled: g.enabled !== false }));
}

// Keep the runtime config in sync with what was actually built.
function writePublicConfig(games) {
  const out = {
    _comment:
      "AUTO-GENERATED from games.build.json by the build. Lists games included in THIS build. Editing an enabled game to false here hides it at runtime (reload, no rebuild); it cannot re-enable a game that was build-excluded (its code isn't here).",
    games: games.map((g) => ({ id: g.id, enabled: g.enabled })),
  };
  writeFileSync(PUBLIC_CFG, JSON.stringify(out, null, 2) + "\n");
}

function main() {
  restore(); // clean slate

  const games = readConfig();
  const disabled = games.filter((g) => !g.enabled);

  writePublicConfig(games);

  // Move disabled games' route folders into the hold area.
  const held = [];
  for (const g of disabled) {
    for (const rel of routeDirs(g.id)) {
      if (move(rel, join(HOLD, rel))) held.push(rel);
    }
  }
  if (held.length) {
    mkdirSync(HOLD, { recursive: true });
    writeFileSync(MANIFEST, JSON.stringify(held));
    console.log(
      `[build] Excluded games: ${disabled.map((g) => g.id).join(", ")}`
    );
  } else {
    console.log("[build] All games enabled — nothing excluded.");
  }

  let code = 1;
  try {
    const res = spawnSync("npx", ["next", "build"], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    code = res.status ?? 1;
  } finally {
    restore(); // always put source back, even on failure
  }
  process.exit(code);
}

main();

// Runs install.ps1 with a real Windows PowerShell and a throwaway
// LOCALAPPDATA, so the user's own Windows Terminal is never touched.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { FRAGMENT_FILE } from "./theme-template.mjs";

const SCRIPT = fileURLToPath(new URL("../install.ps1", import.meta.url));
const FRAGMENT = fileURLToPath(
  new URL(`../dist/${FRAGMENT_FILE}`, import.meta.url),
);
const TARGET = ["Microsoft", "Windows Terminal", "Fragments", "SeppsWorkshop"];

const onWindows = process.platform === "win32";
const run = (command, args, options) =>
  spawnSync(command, args, { encoding: "utf8", ...options });

// Windows PowerShell, directly or through WSL interop. undefined elsewhere.
const shell = ["powershell.exe", "pwsh.exe"].find(
  (exe) => run(exe, ["-NoProfile", "-Command", "exit 0"]).status === 0,
);
const skip =
  !shell && "needs Windows PowerShell (Windows, or WSL with interop)";

const wslpath = (flag, path) => run("wslpath", [flag, path]).stdout.trim();
const toWindows = (path) => (onWindows ? path : wslpath("-w", path));

// A new, empty directory that Windows can write to.
function windowsTempDir() {
  const root = onWindows
    ? tmpdir()
    : wslpath(
        "-u",
        run(shell, ["-NoProfile", "-Command", "$env:TEMP"]).stdout.trim(),
      );
  return mkdtempSync(join(root, "sepps-workshop-wt-"));
}

function install(script, appData) {
  return run(
    shell,
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", toWindows(script)],
    {
      env: {
        ...process.env,
        LOCALAPPDATA: toWindows(appData),
        WSLENV: [process.env.WSLENV, "LOCALAPPDATA"].filter(Boolean).join(":"),
      },
    },
  );
}

test("install.ps1 is ASCII only", () => {
  // Windows PowerShell 5.1 reads a script without a byte order mark in the
  // ANSI code page; a single non-ASCII character becomes garbage.
  const bytes = readFileSync(SCRIPT);
  const index = bytes.findIndex((byte) => byte > 0x7e);
  assert.equal(index, -1, `non-ASCII byte at offset ${index}`);
});

test("install.ps1 never parses or rewrites the fragment", () => {
  assert.doesNotMatch(
    readFileSync(SCRIPT, "utf8"),
    /Get-Content|ConvertFrom-Json|Set-Content|Out-File/i,
  );
});

test(
  "it copies the fragment byte for byte, and again on a second run",
  {
    skip,
  },
  () => {
    const appData = windowsTempDir();
    try {
      for (const attempt of ["first", "second"]) {
        const result = install(SCRIPT, appData);
        assert.equal(result.status, 0, `${attempt} run: ${result.stderr}`);
        const installed = readFileSync(join(appData, ...TARGET, FRAGMENT_FILE));
        assert.ok(installed.equals(readFileSync(FRAGMENT)), `${attempt} run`);
      }
    } finally {
      rmSync(appData, { recursive: true, force: true });
    }
  },
);

test(
  "without a fragment it stops, says why and creates nothing",
  {
    skip,
  },
  () => {
    const appData = windowsTempDir();
    const lonely = windowsTempDir();
    try {
      // The script alone, with no dist/ beside it.
      copyFileSync(SCRIPT, join(lonely, "install.ps1"));
      const result = install(join(lonely, "install.ps1"), appData);
      assert.notEqual(result.status, 0);
      assert.match(result.stdout + result.stderr, /npm run build/);
      assert.throws(() =>
        readFileSync(join(appData, ...TARGET, FRAGMENT_FILE)),
      );
    } finally {
      rmSync(appData, { recursive: true, force: true });
      rmSync(lonely, { recursive: true, force: true });
    }
  },
);

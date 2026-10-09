# Sepp’s Workshop Windows Terminal port: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship one generated Windows Terminal colour scheme, "Sepp’s Workshop", installed from a clone with `install.ps1` as a JSON Fragment Extension.

**Architecture:** A pure `buildTheme(tokens)` maps foundation tokens to the scheme object; `build.mjs` writes it to `themes/` (for manual paste) and, wrapped as a fragment, to `dist/`, and copies the README images. `install.ps1` copies the fragment into Windows Terminal's per-user Fragments folder.

**Tech stack:** Node.js 20+ (ESM, `node:test`), Windows PowerShell 5.1 and PowerShell 7 for the install script, Prettier. No runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-10-09-windows-terminal-port-design.md`

Paths: `PORT` is `/home/vanlaarmi12/Git-Repos/sepps-workshop/sepps-workshop-windows-terminal`, `FISH` is `/home/vanlaarmi12/Git-Repos/sepps-workshop/sepps-workshop-fish`. Run every command from `PORT` unless it says otherwise.

## Global constraints

- No hex value and no alpha arithmetic in `src/theme-template.mjs` or `build.mjs`. A missing value is fixed in the foundation, not approximated.
- One scheme, no variants. Its name is `tokens.meta.name`, "Sepp’s Workshop", with the typographic apostrophe (U+2019).
- The scheme has exactly these keys: `name`, `background`, `foreground`, `cursorColor`, `selectionBackground`, and the sixteen colours `black`, `red`, `green`, `yellow`, `blue`, `purple`, `cyan`, `white` and their `bright*` versions.
- File names: `themes/sepps-workshop.json`, `dist/sepps-workshop-windows-terminal.json`. Fragment folder: `%LOCALAPPDATA%\Microsoft\Windows Terminal\Fragments\SeppsWorkshop\`.
- Generated JSON is UTF-8 without a byte order mark, two-space indentation, trailing newline, the apostrophe written as the character itself.
- `install.ps1` is ASCII only and copies the fragment byte for byte. It never uses `Get-Content`, `ConvertFrom-Json`, `Set-Content` or `Out-File` on it.
- Docs are English, no emoji, paragraphs on one line (no hard wraps). The product is written "Sepp’s Workshop" with a typographic apostrophe, the company "sepp.med gmbh".
- Commits use Conventional Commits with a gitmoji and end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Check `git status --short` before each commit.
- Nothing is pushed, tagged or published.
- Deviation from the spec: `.claude/settings.json` gets no PowerShell permission. `npm test` is already allowed and runs the script; a blanket `powershell.exe` permission would allow far more than the port needs.

## Review focus

1. The fragment is missing when `install.ps1` runs (a partial checkout, or `dist/` deleted): the script must stop with a message that names the cure and a non-zero exit code, and create nothing. Test in Task 2.
2. The script is run a second time after `git pull`: it must overwrite the old fragment without an error. Test in Task 2.
3. The Fragments folder does not exist yet (Windows Terminal never had a fragment): the script must create the whole path. The Task 2 test starts from an empty `LOCALAPPDATA`.
4. The apostrophe in the scheme name is damaged on the way to disk (escaped, or re-encoded with a byte order mark): Windows Terminal would show a wrong name or ignore the file. Tests in Task 1 (raw character, no byte order mark) and Task 2 (byte-identical copy).
5. A user edits `settings.json` by hand and types a straight apostrophe: the scheme is not found. No test can cover this; the README gives the line to copy. Task 3.

---

### Task 1: Scheme mapping, build and generated output

**Files:**

- Create: `package.json`, `.gitignore`, `.prettierignore`, `.claudeignore`
- Create: `src/theme-template.mjs`, `src/theme-template.test.mjs`, `build.mjs`
- Generated: `themes/sepps-workshop.json`, `dist/sepps-workshop-windows-terminal.json`, `images/sepps-workshop-header.jpg`, `images/sepp-recruiting.png`, `package-lock.json`

**Interfaces:**

- Consumes: `tokens` from `@sepps-workshop/design-system` (`meta.name`, `surface.bg_terminal`, `text.fg`, `accent`, `overlay.selection.hex_terminal`, `ansi.*`).
- Produces, from `src/theme-template.mjs`: `buildTheme(tokens) -> object` (the scheme), `buildFragment(tokens) -> { schemes: [scheme] }`, `toJson(value) -> string`, and the constants `THEME_FILE = "sepps-workshop.json"` and `FRAGMENT_FILE = "sepps-workshop-windows-terminal.json"`. Task 2 imports `FRAGMENT_FILE`.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "sepps-workshop-windows-terminal",
  "description": "One dark color scheme for Windows Terminal on sepp.med Darkblue. WCAG AA verified.",
  "version": "0.1.0",
  "private": true,
  "license": "MIT",
  "author": {
    "name": "sepp.med gmbh"
  },
  "homepage": "https://github.com/sepps-workshop/sepps-workshop-windows-terminal",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/sepps-workshop/sepps-workshop-windows-terminal.git"
  },
  "bugs": {
    "url": "https://github.com/sepps-workshop/sepps-workshop-windows-terminal/issues"
  },
  "keywords": [
    "windows-terminal",
    "terminal",
    "theme",
    "color-scheme",
    "dark-theme",
    "wcag",
    "accessibility",
    "sepps-workshop"
  ],
  "type": "module",
  "scripts": {
    "build": "node build.mjs",
    "test": "node --test src/theme-template.test.mjs src/install.test.mjs",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

- [ ] **Step 2: Write the ignore files**

`.gitignore`:

```
node_modules/
.DS_Store

.superpowers/

# Claude Code — personal files
.claude/settings.local.json
.claude/local.md
.claude/worktrees/
```

`.prettierignore`:

```
node_modules/
themes/
dist/
package-lock.json
images/
```

`.claudeignore`:

```
node_modules/
themes/
dist/
```

- [ ] **Step 3: Install the dependencies**

Run: `npm install --save-dev @sepps-workshop/design-system@^0.7.0 prettier@^3.9.9`
Expected: both appear under `devDependencies`, `package-lock.json` is created, no errors.

- [ ] **Step 4: Write the failing tests**

`src/theme-template.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import tokens from "@sepps-workshop/design-system";
import {
  buildTheme,
  buildFragment,
  toJson,
  THEME_FILE,
  FRAGMENT_FILE,
} from "./theme-template.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url));
const scheme = buildTheme(tokens);

// Windows Terminal key -> foundation ANSI slot.
const ANSI = {
  black: "black",
  red: "red",
  green: "green",
  yellow: "yellow",
  blue: "blue",
  purple: "magenta",
  cyan: "cyan",
  white: "white",
  brightBlack: "bright_black",
  brightRed: "bright_red",
  brightGreen: "bright_green",
  brightYellow: "bright_yellow",
  brightBlue: "bright_blue",
  brightPurple: "bright_magenta",
  brightCyan: "bright_cyan",
  brightWhite: "bright_white",
};

test("the scheme has exactly Windows Terminal's documented keys", () => {
  // https://learn.microsoft.com/en-us/windows/terminal/customize-settings/color-schemes
  // The terminal ignores an unknown key without an error; this is the guard.
  assert.deepEqual(
    Object.keys(scheme).sort(),
    [
      "name",
      "background",
      "foreground",
      "cursorColor",
      "selectionBackground",
      ...Object.keys(ANSI),
    ].sort(),
  );
});

test("the name is the foundation's, typographic apostrophe included", () => {
  assert.equal(scheme.name, tokens.meta.name);
  assert.ok(scheme.name.includes("’"));
});

test("background, foreground, cursor and selection come from their tokens", () => {
  assert.equal(scheme.background, tokens.surface.bg_terminal);
  assert.equal(scheme.foreground, tokens.text.fg);
  assert.equal(scheme.cursorColor, tokens.accent);
  // A terminal cannot blend: the selection is flattened over its background.
  assert.equal(
    scheme.selectionBackground,
    tokens.overlay.selection.hex_terminal,
  );
});

test("the sixteen colours come from ansi, purple from magenta", () => {
  for (const [key, slot] of Object.entries(ANSI)) {
    assert.equal(scheme[key], tokens.ansi[slot], key);
  }
});

test("every colour is a six-digit hex value", () => {
  for (const [key, value] of Object.entries(scheme)) {
    if (key !== "name") assert.match(value, /^#[0-9a-f]{6}$/, key);
  }
});

test("the fragment holds the one scheme and nothing else", () => {
  assert.deepEqual(buildFragment(tokens), { schemes: [scheme] });
});

test("toJson indents by two, ends with one newline and keeps the apostrophe", () => {
  const json = toJson(scheme);
  assert.ok(json.startsWith('{\n  "name": "Sepp’s Workshop",\n'));
  assert.ok(json.endsWith("}\n") && !json.endsWith("\n\n"));
  assert.ok(!json.includes("\\u"));
});

test("the sources contain no colour value", () => {
  for (const file of ["src/theme-template.mjs", "build.mjs"]) {
    assert.doesNotMatch(
      read(file).toString("utf8"),
      /#[0-9a-f]{3,8}\b|\balphaOver\b/i,
      `${file} must take every colour from the tokens`,
    );
  }
});

test("the committed files are what the build produces", () => {
  const stale = "is stale: run `npm run build`";
  assert.equal(
    read(`themes/${THEME_FILE}`).toString("utf8"),
    toJson(scheme),
    `themes/ ${stale}`,
  );
  const fragment = read(`dist/${FRAGMENT_FILE}`);
  assert.equal(
    fragment.toString("utf8"),
    toJson(buildFragment(tokens)),
    `dist/ ${stale}`,
  );
  // Windows Terminal needs UTF-8 without a byte order mark.
  assert.notEqual(fragment[0], 0xef, "dist/ starts with a byte order mark");
  for (const image of ["sepps-workshop-header.jpg", "sepp-recruiting.png"]) {
    const source = readFileSync(
      fileURLToPath(
        import.meta.resolve(`@sepps-workshop/design-system/assets/${image}`),
      ),
    );
    assert.ok(read(`images/${image}`).equals(source), `${image} ${stale}`);
  }
});
```

- [ ] **Step 5: Run the tests to see them fail**

Run: `node --test src/theme-template.test.mjs`
Expected: FAIL, `Cannot find module` for `./theme-template.mjs`.

- [ ] **Step 6: Write the template**

`src/theme-template.mjs`:

```js
// Maps the foundation's terminal tokens to a Windows Terminal colour scheme.
// One pure function: tokens -> scheme object.
//
// The scheme format has these keys and no others; the terminal ignores an
// unknown key without an error.
// https://learn.microsoft.com/en-us/windows/terminal/customize-settings/color-schemes

export const THEME_FILE = "sepps-workshop.json";
export const FRAGMENT_FILE = "sepps-workshop-windows-terminal.json";

// Windows Terminal key -> foundation ANSI slot. The terminal calls the
// sixth colour purple; the foundation, like everyone else, magenta.
const ANSI = {
  black: "black",
  red: "red",
  green: "green",
  yellow: "yellow",
  blue: "blue",
  purple: "magenta",
  cyan: "cyan",
  white: "white",
  brightBlack: "bright_black",
  brightRed: "bright_red",
  brightGreen: "bright_green",
  brightYellow: "bright_yellow",
  brightBlue: "bright_blue",
  brightPurple: "bright_magenta",
  brightCyan: "bright_cyan",
  brightWhite: "bright_white",
};

export function buildTheme(tokens) {
  return {
    name: tokens.meta.name,
    background: tokens.surface.bg_terminal,
    foreground: tokens.text.fg,
    cursorColor: tokens.accent,
    // The scheme has no alpha, so the selection takes the value the
    // foundation flattened over the terminal background.
    selectionBackground: tokens.overlay.selection.hex_terminal,
    ...Object.fromEntries(
      Object.entries(ANSI).map(([key, slot]) => [key, tokens.ansi[slot]]),
    ),
  };
}

// A JSON Fragment Extension: what install.ps1 puts into the Fragments folder.
// https://learn.microsoft.com/en-us/windows/terminal/json-fragment-extensions
export const buildFragment = (tokens) => ({ schemes: [buildTheme(tokens)] });

export const toJson = (value) => JSON.stringify(value, null, 2) + "\n";
```

- [ ] **Step 7: Write the build script**

`build.mjs`:

```js
// Reads foundation tokens from @sepps-workshop/design-system, emits the
// colour scheme (themes/, for manual paste) and the fragment that
// install.ps1 deploys (dist/), and copies the README images.

import { mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import tokens from "@sepps-workshop/design-system";

import {
  buildTheme,
  buildFragment,
  toJson,
  THEME_FILE,
  FRAGMENT_FILE,
} from "./src/theme-template.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const IMAGES = join(ROOT, "images");

// writeFileSync writes UTF-8 without a byte order mark, which is what
// Windows Terminal needs for a fragment.
for (const [dir, file, value] of [
  ["themes", THEME_FILE, buildTheme(tokens)],
  ["dist", FRAGMENT_FILE, buildFragment(tokens)],
]) {
  mkdirSync(join(ROOT, dir), { recursive: true });
  writeFileSync(join(ROOT, dir, file), toJson(value), "utf8");
}

// The images are the foundation's; copying them here keeps them from drifting.
mkdirSync(IMAGES, { recursive: true });
for (const image of ["sepps-workshop-header.jpg", "sepp-recruiting.png"]) {
  copyFileSync(
    fileURLToPath(
      import.meta.resolve(`@sepps-workshop/design-system/assets/${image}`),
    ),
    join(IMAGES, image),
  );
}

console.log(`Built themes/${THEME_FILE}, dist/${FRAGMENT_FILE} and images/`);
```

- [ ] **Step 8: Build and run the tests**

Run: `npm run build && node --test src/theme-template.test.mjs`
Expected: `Built themes/sepps-workshop.json, dist/sepps-workshop-windows-terminal.json and images/`, then all 9 tests PASS.

- [ ] **Step 9: Check the output by eye**

Run: `cat themes/sepps-workshop.json`
Expected: 21 keys, starting with `"name": "Sepp’s Workshop"`, `"background": "#0d3174"`, `"foreground": "#e7eaf1"`, `"cursorColor": "#fbba00"`, `"selectionBackground": "#1a212d"`.

- [ ] **Step 10: Format and commit**

```bash
npx prettier --write .
git status --short
git add package.json package-lock.json .gitignore .prettierignore .claudeignore src/theme-template.mjs src/theme-template.test.mjs build.mjs themes dist images
git commit -m "✨ feat: generate the Windows Terminal colour scheme and fragment

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Install script

**Files:**

- Create: `install.ps1`
- Test: `src/install.test.mjs`

**Interfaces:**

- Consumes: `FRAGMENT_FILE` from `src/theme-template.mjs`, and the committed `dist/sepps-workshop-windows-terminal.json` from Task 1.
- Produces: `install.ps1`, which Task 3's README documents. It reads `$env:LOCALAPPDATA` and writes `Microsoft\Windows Terminal\Fragments\SeppsWorkshop\sepps-workshop-windows-terminal.json` below it.

Background for the test: it needs a Windows PowerShell. On Windows it calls `powershell.exe` directly. Under WSL it reaches the same program through interop; there the temporary directory must be on the Windows side, paths are converted with `wslpath`, and an environment variable only crosses to Windows if it is named in `WSLENV`. Where no Windows PowerShell exists, the integration tests are skipped and say so.

- [ ] **Step 1: Write the failing tests**

`src/install.test.mjs`:

```js
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
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `node --test src/install.test.mjs`
Expected: FAIL. The two static tests fail with `ENOENT` for `install.ps1`; the two integration tests fail too (or are skipped where there is no Windows PowerShell).

- [ ] **Step 3: Write the script**

`install.ps1`. Type it with plain ASCII characters only: straight quotes, `->` for arrows, no dashes other than the hyphen.

```powershell
# Installs the Sepp's Workshop color scheme into Windows Terminal as a
# JSON Fragment Extension. Your settings.json is not touched.
# Run from a clone of this repository: .\install.ps1
# https://learn.microsoft.com/en-us/windows/terminal/json-fragment-extensions
#
# Keep this file ASCII only: Windows PowerShell 5.1 reads a script without a
# byte order mark in the ANSI code page. The fragment is copied byte for byte
# and never parsed: it must stay UTF-8 without a byte order mark.

$ErrorActionPreference = "Stop"

$file = "sepps-workshop-windows-terminal.json"
$source = Join-Path $PSScriptRoot "dist\$file"
$targetDir = Join-Path $env:LOCALAPPDATA "Microsoft\Windows Terminal\Fragments\SeppsWorkshop"

if (-not (Test-Path -LiteralPath $source)) {
    Write-Error "Fragment not found at $source. Run 'npm run build' first."
    exit 1
}

New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
Copy-Item -Force -LiteralPath $source -Destination (Join-Path $targetDir $file)

Write-Host "Installed the Sepp's Workshop color scheme to $targetDir"
Write-Host "Restart Windows Terminal, then pick it under Settings -> Color schemes"
Write-Host "(or per profile under Settings -> <profile> -> Appearance -> Color scheme)."
```

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: all tests of both files PASS. On this machine (WSL with interop) the two integration tests must run, not skip; if the output shows `# skipped 2`, stop and find out why `powershell.exe` was not found.

- [ ] **Step 5: Confirm nothing was left behind and nothing real was touched**

Run: `ls "$(wslpath -u "$(powershell.exe -NoProfile -Command '$env:TEMP' | tr -d '\r')")" | grep -c sepps-workshop-wt- ; ls "$(wslpath -u "$(powershell.exe -NoProfile -Command '$env:LOCALAPPDATA' | tr -d '\r')")/Microsoft/Windows Terminal/Fragments" 2>/dev/null | grep -c SeppsWorkshop`
Expected: `0` and `0`. The temporary directories are gone, and the user's own Fragments folder has no `SeppsWorkshop` entry (installing for real is the user's step).

- [ ] **Step 6: Format and commit**

```bash
npx prettier --write src/install.test.mjs
git status --short
git add install.ps1 src/install.test.mjs
git commit -m "✨ feat: add install.ps1 to deploy the scheme as a fragment

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Documentation and repository scaffolding

**Files:**

- Create: `README.md`, `CLAUDE.md`, `CHANGELOG.md`, `.claude/learnings.md`, `.claude/skills/release/SKILL.md`
- Copy unchanged from `FISH`: `LICENSE`, `.githooks/pre-commit`, `scripts/sync-config-table.sh`, `.github/workflows/claude.yml`, `.github/workflows/claude-code-review.yml`, `.claude/skills/sepps-workshop/SKILL.md`
- Copy from `FISH` and adapt: `.claude/settings.json`

**Interfaces:**

- Consumes: the file names, the fragment folder and the script behaviour from Tasks 1 and 2.
- Produces: nothing other tasks rely on.

- [ ] **Step 1: Copy the unchanged files**

```bash
FISH=/home/vanlaarmi12/Git-Repos/sepps-workshop/sepps-workshop-fish
mkdir -p .githooks scripts .github/workflows .claude/skills/sepps-workshop .claude/skills/release
cp "$FISH/LICENSE" LICENSE
cp -p "$FISH/.githooks/pre-commit" .githooks/pre-commit
cp -p "$FISH/scripts/sync-config-table.sh" scripts/sync-config-table.sh
cp "$FISH/.github/workflows/claude.yml" "$FISH/.github/workflows/claude-code-review.yml" .github/workflows/
cp /home/vanlaarmi12/Git-Repos/sepps-workshop/sepps-workshop-design-system/handoff/SKILL.md .claude/skills/sepps-workshop/SKILL.md
grep -rn -i fish LICENSE .githooks scripts .github ; test -x .githooks/pre-commit && echo executable
```

Expected: the `grep` prints nothing, and `executable` is printed. (The handoff skill names fish as one of the five ports; it is copied as it is and not checked here.)

- [ ] **Step 2: Write `.claude/settings.json`**

The fish port's file without its two fish permissions:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.local)",
      "Read(./.env.*.local)",
      "Read(./.env.development)",
      "Read(./.env.production)",
      "Read(./.env.staging)",
      "Read(./.env.test)",
      "Read(./secrets/**)",
      "Bash(rm -rf:*)"
    ],
    "allow": [
      "Bash(npm install:*)",
      "Bash(npm run build:*)",
      "Bash(npm test:*)",
      "Bash(npm run format:*)",
      "Bash(node build.mjs)",
      "Bash(node --test:*)",
      "Bash(npx prettier:*)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Read|Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path // empty' | { read -r p || exit 0; b=$(basename -- \"$p\"); case \"$b\" in .env|.env.local|.env.*.local|.env.development|.env.production|.env.staging|.env.test) echo \"secret-file-guard: blocked $b\" >&2; exit 1;; .env.*) case \"$b\" in *.example|*.sample|*.template|*.dist) exit 0;; *) echo \"secret-file-guard: blocked $b\" >&2; exit 1;; esac;; esac; }"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs -r npx --no-install prettier --write --ignore-unknown --log-level=warn 2>/dev/null || true"
          }
        ]
      }
    ]
  },
  "env": {
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "50",
    "MAX_THINKING_TOKENS": "10000",
    "CLAUDE_CODE_SUBAGENT_MODEL": "haiku"
  }
}
```

Then check it against the source: `diff <(grep -v 'fish' /home/vanlaarmi12/Git-Repos/sepps-workshop/sepps-workshop-fish/.claude/settings.json) .claude/settings.json`
Expected: the only difference is the missing comma after `"Bash(npx prettier:*)"`.

- [ ] **Step 3: Write the release skill**

Start from the fish port's and replace what names fish:

```bash
FISH=/home/vanlaarmi12/Git-Repos/sepps-workshop/sepps-workshop-fish
sed -e 's/sepps-workshop-fish/sepps-workshop-windows-terminal/g' \
    -e 's/(Fisher installs the theme straight from this repository)/(the scheme is installed from a clone with `install.ps1`)/' \
    -e 's/the generated theme file is committed/the generated files in `themes\/` and `dist\/` are committed/' \
    -e 's/a foundation minor bump, newly covered fish variables/a foundation minor bump, a new feature in `install.ps1`/' \
    -e 's/a renamed theme file or a changed installation path/a renamed scheme, a renamed fragment file or a changed fragment folder/' \
    "$FISH/.claude/skills/release/SKILL.md" > .claude/skills/release/SKILL.md
grep -n -i 'fish' .claude/skills/release/SKILL.md
```

Expected: the `grep` prints nothing.

- [ ] **Step 4: Write `.claude/learnings.md`**

```markdown
# Learnings

- 2026-10-09: Windows Terminal schemes have no alpha, so `selectionBackground` takes `overlay.selection.hex_terminal`. The terminal paints it opaque and draws selected text in white or black by the selection's lightness.
- 2026-10-09: `install.ps1` must stay ASCII only (Windows PowerShell 5.1 reads a script without a byte order mark in the ANSI code page) and must copy the fragment byte for byte: the scheme name holds U+2019, and a fragment must be UTF-8 without a byte order mark.
- 2026-10-09: A fragment cannot change the profile defaults, so it cannot switch the scheme on. Activation is the user's step in Settings.
- 2026-10-09: From WSL, `powershell.exe` only sees an environment variable that is named in `WSLENV`, and it needs a temporary directory on the Windows side.
```

- [ ] **Step 5: Write `CHANGELOG.md`**

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- The Sepp’s Workshop colour scheme for Windows Terminal: one scheme, generated from the terminal tokens of `@sepps-workshop/design-system`.
- `install.ps1`, which deploys the scheme as a JSON Fragment Extension, so Windows Terminal picks it up without an edit to `settings.json`.
- `themes/sepps-workshop.json` for pasting the scheme into `settings.json` by hand.
- Tests that derive every expected value from the design system and run `install.ps1` with a real Windows PowerShell.
```

- [ ] **Step 6: Write `README.md`**

````markdown
<p align="center">
  <img src="./images/sepps-workshop-header.jpg" width="100%" alt="Sepp, the blue robot, assembling code blocks with a wrench in his workshop" />
</p>

# Sepp’s Workshop for Windows Terminal

<p>
  <img src="https://img.shields.io/badge/WCAG-AA-3aaa35" alt="WCAG AA" />
  <img src="https://img.shields.io/badge/license-MIT-b2b2b2" alt="MIT license" />
</p>

One dark colour scheme for [Windows Terminal](https://learn.microsoft.com/en-us/windows/terminal/), built on sepp.med Darkblue with Sunset yellow as the cursor. It sets the background, the text, the cursor, the selection and the sixteen ANSI colours. There are no variants and nothing to configure: this is the one scheme.

The colours come from the [Sepp’s Workshop design system](https://github.com/sepps-workshop/sepps-workshop-design-system), whose build refuses to ship a text colour that fails WCAG AA on its background. All sixteen colours except black are checked against the Darkblue background.

## Install

In PowerShell:

```powershell
git clone https://github.com/sepps-workshop/sepps-workshop-windows-terminal.git
cd sepps-workshop-windows-terminal
.\install.ps1
```

The script copies one file, a [JSON Fragment Extension](https://learn.microsoft.com/en-us/windows/terminal/json-fragment-extensions), into `%LOCALAPPDATA%\Microsoft\Windows Terminal\Fragments\SeppsWorkshop\`. Windows Terminal reads that folder by itself. Your `settings.json` is not touched, and you do not need Node.js: the file is already built.

If PowerShell refuses to run the script because of the execution policy, unblock it first:

```powershell
Unblock-File .\install.ps1
```

### Switch it on

Restart Windows Terminal. Then open **Settings**, **Color schemes**, choose **Sepp’s Workshop** and set it as the default. To use it for one profile only, go to **Settings**, the profile, **Appearance**, **Color scheme**.

If you would rather edit `settings.json`, copy this line: the apostrophe in the name is a typographic one, and a straight one does not match.

```json
"colorScheme": "Sepp’s Workshop"
```

### Update

```powershell
git pull
.\install.ps1
```

### Manual install

No script? Open [`themes/sepps-workshop.json`](./themes/sepps-workshop.json) and paste its content into the `"schemes"` array of your `settings.json` (**Settings**, **Open JSON file**).

### Uninstall

Choose another colour scheme, delete `%LOCALAPPDATA%\Microsoft\Windows Terminal\Fragments\SeppsWorkshop\` and restart Windows Terminal.

## Recommended companions

- **Font**: themes cannot ship fonts. The design system recommends [JetBrains Mono](https://www.jetbrains.com/lp/mono/), or [JetBrainsMono Nerd Font](https://www.nerdfonts.com/font-downloads) if your prompt shows icons.
- **Shell colours**: a terminal scheme colours what programs print, not what you type. For syntax highlighting on the command line there is [Sepp’s Workshop for fish](https://github.com/sepps-workshop/sepps-workshop-fish); a PowerShell port is planned.
- **Prompt**: the scheme does not touch your prompt. A [Starship](https://starship.rs) port is planned.

## How it is built

The scheme is generated. The design system says what the terminal background, the text, the accent and the sixteen ANSI colours are; this repository puts them under the keys Windows Terminal reads. It contains no colour value of its own, and a test fails if one appears.

A few things follow from the palette and are deliberate:

- The slots Windows Terminal calls `purple` and `brightPurple` are orange. The sepp.med palette has no magenta, so the design system puts Bright Orange there.
- Red is a coral red, not the Racing Red of the logo. Racing Red does not reach a readable contrast on Darkblue.
- A selection darkens the background. Windows Terminal draws the selected text in white on it.
- Blue on a blue terminal is the hardest colour: blue and cyan differ in lightness as well as in hue.
- `black` is a true black-grey, darker than the background. It is the anchor for programs that paint black bars; as text on Darkblue it is hard to read, in this scheme as in any dark one.

## Contributing

You need Node.js 20 or later, and Windows PowerShell for the install test (on Windows, or from WSL).

```bash
npm install
npm run build   # regenerates themes/, dist/ and images/ from @sepps-workshop/design-system
npm test
```

The files under `themes/` and `dist/` are generated; edit `src/theme-template.mjs` and rebuild. The test runs `install.ps1` against a temporary folder, not against your Windows Terminal. To try a local build for real, run `.\install.ps1`.

If a colour looks wrong, or two colours are hard to tell apart, the cause is almost always in the design system and not in this port. Please open the issue [there](https://github.com/sepps-workshop/sepps-workshop-design-system/issues). A mapping mistake (the right colour under the wrong key) belongs here.

## License

MIT. See [LICENSE](./LICENSE).

## Want to join Sepp’s Workshop?

<img align="right" width="150" src="./images/sepp-recruiting.png" alt="Sepp, the blue robot, holding a sign that reads Be you – with us!" />

sepp.med builds and tests software for places where a bug is more than an inconvenience: medical devices, cars, aircraft. We have been doing it since 1980, as a family-run company in the Nuremberg metropolitan region. If you would rather get the contrast ratio right than argue about it, you might like it here.

Browse the [open positions](https://www.seppmed.com/career/open-positions/), or send a [speculative application](https://www.seppmed.com/career/speculative-application/) if none of them fits yet. Be you – with us.
````

- [ ] **Step 7: Write `CLAUDE.md`**

```markdown
# sepps-workshop-windows-terminal

Windows Terminal port of the [Sepp’s Workshop design system](https://github.com/sepps-workshop/sepps-workshop-design-system). Node.js + ESM. Reads tokens from `@sepps-workshop/design-system`; emits one colour scheme to `themes/` and one fragment to `dist/`. One scheme, no variants.

## Key Config Files

| File                                       | Purpose                                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------------------------- |
| `.claude/learnings.md`                     | One-line corrections from past sessions; appended to, never rewritten                   |
| `.claude/settings.json`                    | Permissions, secret-file guard, PostToolUse Prettier hook, env defaults                 |
| `.claude/skills/release/SKILL.md`          | `/release` skill: version bump → CHANGELOG → tag → push → GitHub release                |
| `.claude/skills/sepps-workshop/SKILL.md`   | Port-side skill: how to read foundation tokens; copied from the foundation's `handoff/` |
| `.claudeignore`                            | Paths Claude Code should skip when indexing (`node_modules/`, `themes/`, `dist/`)       |
| `.githooks/pre-commit`                     | Runs sync-config-table.sh and gitleaks on every commit                                  |
| `.github/workflows/claude-code-review.yml` | Auto-reviews PRs with Claude on open/synchronize                                        |
| `.github/workflows/claude.yml`             | Responds to `@claude` mentions in issues, PRs, and review comments                      |
| `.gitignore`                               | Git ignore patterns                                                                     |
| `.prettierignore`                          | Paths Prettier must skip: generated `themes/`, `dist/` and `images/`                    |
| `build.mjs`                                | Reads foundation tokens, emits the scheme and the fragment, copies the README images    |
| `package.json`                             | npm scripts (`build`, `test`, `format`) and the design-system devDependency             |
| `scripts/sync-config-table.sh`             | Keeps this table in sync with the filesystem (called by pre-commit)                     |

## Commands

- `npm install` — fetch deps (foundation tokens, prettier)
- `npm run build` — read tokens, emit `themes/sepps-workshop.json`, `dist/sepps-workshop-windows-terminal.json` and `images/`
- `npm test` — template tests, then an integration test that runs `install.ps1` with a real Windows PowerShell
- `npm run format` — run Prettier on the project
- `.\install.ps1` (Windows, PowerShell) — copy the built fragment into Windows Terminal's Fragments folder

After cloning, run `git config core.hooksPath .githooks` to enable the pre-commit hook.

## Structure

- `build.mjs` — top-level build script
- `src/theme-template.mjs` — pure `buildTheme(tokens)` (the scheme object) and `buildFragment(tokens)` (`{ schemes: [scheme] }`)
- `src/theme-template.test.mjs` — unit tests; expected values come from the tokens
- `src/install.test.mjs` — runs `install.ps1` with a temporary `LOCALAPPDATA`; skipped without Windows PowerShell
- `install.ps1` — copies `dist/sepps-workshop-windows-terminal.json` to `%LOCALAPPDATA%\Microsoft\Windows Terminal\Fragments\SeppsWorkshop\`
- `themes/` — **generated**, committed: the scheme alone, for manual paste into `settings.json`
- `dist/` — **generated**, committed: the fragment `install.ps1` deploys, so a clone installs without Node
- `images/` — **generated**: copied by the build from the foundation's `assets/`

## References

`.claude/skills/sepps-workshop/SKILL.md` **Read when:** adding or changing any colour mapping. It maps port needs to foundation tokens.

`node_modules/@sepps-workshop/design-system/README.md` **Read when:** you need to know what a role means or why a value is what it is.

`docs/superpowers/specs/2026-10-09-windows-terminal-port-design.md` **Read when:** you need the reasoning behind a mapping, the install story, or the Windows Terminal facts it rests on.

## Conventions

- **No colour in this repository.** No hex value and no alpha arithmetic in `src/theme-template.mjs` or `build.mjs`. A test fails on either.
- **The key set is closed.** A scheme has `name`, `background`, `foreground`, `cursorColor`, `selectionBackground` and the sixteen colours. Windows Terminal ignores an unknown key without an error, so a test pins the exact set.
- **Purple is magenta.** `purple` and `brightPurple` take `ansi.magenta` and `ansi.bright_magenta`.
- **The selection is flattened for the terminal.** `selectionBackground` takes `overlay.selection.hex_terminal`; the scheme format has no alpha.
- **The name is `tokens.meta.name`.** It holds a typographic apostrophe (U+2019) and is the identifier users put in `"colorScheme"`. Changing it breaks their settings.
- **`install.ps1` is ASCII only and moves bytes.** No `Get-Content`, `ConvertFrom-Json`, `Set-Content` or `Out-File` on the fragment. Tests check both.
- **Activation is the user's step.** The fragment adds the scheme; it does not update profiles.
- **Foundation gaps go upstream.** A value the port needs and cannot find is fixed in `sepps-workshop-design-system`, not approximated here.
- **Scope.** The terminal's colours only. Shell syntax colours belong to the fish and PowerShell ports, the prompt to the Starship port.
- **Determinism.** Same tokens in, byte-identical files out. `npm test` fails if `themes/`, `dist/` or `images/` is stale.
- **Writing.** The product name is written "Sepp’s Workshop" with a typographic apostrophe, the company "sepp.med gmbh". Docs are English, exact where technical, no emoji.

## Don't

- Don't hand-edit `themes/`, `dist/` or `images/`; run `npm run build`.
- Don't add a second scheme or a variant.
- Don't add `profiles` to the fragment or a Windows Terminal `themes` object.
- Don't run `install.ps1` against the user's real Windows Terminal without being asked; the test uses a temporary folder.
- Don't commit secrets. Don't use `--force`.

## Learnings

When the user corrects a mistake or points out a recurring issue, append a one-line summary to `.claude/learnings.md`. Don't modify CLAUDE.md directly.

## Compact Instructions

When compacting, preserve: list of modified files, current test status, open TODOs, and key decisions made.
```

- [ ] **Step 8: Format, enable the hook and check the config table**

```bash
npx prettier --write .
git config core.hooksPath .githooks
bash scripts/sync-config-table.sh
grep -c 'TODO: add description' CLAUDE.md
```

Expected: `sync-config-table: no changes` or `updated CLAUDE.md`, and the count is `0`. If a row has `TODO: add description`, the table in Step 7 missed a file: write its purpose into that row.

- [ ] **Step 9: Run every check**

Run: `npm run build && git status --short themes dist images && npm test && npm run format:check`
Expected: the build leaves `themes/`, `dist/` and `images/` unchanged (no output from `git status`), all tests PASS with none skipped, and Prettier reports `All matched files use Prettier code style!`.

- [ ] **Step 10: Check the README against the rules**

Run: `grep -n -P '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' README.md CLAUDE.md CHANGELOG.md ; grep -n "Sepp's" README.md CHANGELOG.md ; tail -5 README.md`
Expected: no emoji found in `README.md` or `CHANGELOG.md` (`CLAUDE.md` may show the arrows of the release row only), no straight-apostrophe "Sepp's", and the file ends with the "Want to join Sepp’s Workshop?" section.

- [ ] **Step 11: Commit**

```bash
git status --short
git add README.md LICENSE CHANGELOG.md CLAUDE.md .claude .githooks .github scripts
git commit -m "📝 docs: add README, licence, changelog and Claude Code config

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git status --short
npm run format:check
git log --oneline
```

Expected: a clean working tree, Prettier still content (the pre-commit hook may rewrite the table in `CLAUDE.md`; it formats what it writes), and five commits (spec, plan, and the three tasks). Do not push.

---

## After the plan

1. Tell the user the scheme is built and how to install it for real: from Windows PowerShell, `cd` to the clone (`\\wsl.localhost\Ubuntu\home\vanlaarmi12\Git-Repos\sepps-workshop\sepps-workshop-windows-terminal`) and run `.\install.ps1`. Do not run it for them unless asked.
2. Ask whether the scheme used the foundation correctly, and log corrections to `.claude/learnings.md`, as the handoff skill requires.
3. Remind the user that a screenshot (`images/screenshot.png`) and the push are theirs.

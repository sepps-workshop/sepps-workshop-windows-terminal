import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import tokens from "@sepps-workshop/design-system";
import {
  buildTheme,
  buildWindowTheme,
  buildFragment,
  toJson,
  THEME_FILE,
  WINDOW_THEME_FILE,
  FRAGMENT_FILE,
} from "./theme-template.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url));
const scheme = buildTheme(tokens);
const windowTheme = buildWindowTheme(tokens);

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

test("the window theme puts the tab row on the chrome colour", () => {
  // https://learn.microsoft.com/en-us/windows/terminal/customize-settings/themes
  // deepEqual pins the key set too: the terminal ignores an unknown key.
  const chrome = tokens.surface.bg_chrome;
  assert.deepEqual(windowTheme, {
    name: tokens.meta.name,
    window: { applicationTheme: "dark" },
    tabRow: { background: chrome, unfocusedBackground: chrome },
    tab: { background: "terminalBackground", unfocusedBackground: chrome },
  });
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
  assert.equal(
    read(`themes/${WINDOW_THEME_FILE}`).toString("utf8"),
    toJson(windowTheme),
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

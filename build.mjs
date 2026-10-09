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

# Sepp’s Workshop for Windows Terminal: design

Date: 2026-10-09. Status: awaiting review.

## Goal

One Windows Terminal colour scheme, "Sepp’s Workshop", generated from `@sepps-workshop/design-system`, installed by cloning the repository and running one script, and switched on in the Settings picker. The port decides which token feeds which scheme key and nothing about colour.

Blueprints: `vivid-life-windows-terminal` for the Windows Terminal mechanics (scheme format, fragment install, `install.ps1`, README install wording), `sepps-workshop-fish` for everything else (rules, tests, scaffolding, README voice).

## Decisions taken with the user

1. The install story is the one of `vivid-life-windows-terminal`: `git clone`, then `.\install.ps1`, which deploys a JSON Fragment Extension. Manual paste is the fallback. No download one-liner and no remote script.
2. The scheme is named "Sepp’s Workshop", with the typographic apostrophe. That is `tokens.meta.name`.

## Facts checked on 2026-10-09

- A colour scheme accepts `name`, `background`, `foreground`, `cursorColor`, `selectionBackground` and the sixteen colours `black`, `red`, `green`, `yellow`, `blue`, `purple`, `cyan`, `white` and their `bright*` versions. Colours are `#rgb` or `#rrggbb`; there is no alpha. `cursorColor` and `selectionBackground` are optional. ([Color schemes](https://learn.microsoft.com/en-us/windows/terminal/customize-settings/color-schemes))
- A fragment holds `profiles` and `schemes`. A scheme in a fragment must have a name and all sixteen colours. A per-user fragment lives in `%LOCALAPPDATA%\Microsoft\Windows Terminal\Fragments\{app-name}\{file-name}.json`; the terminal reads every `.json` file in that folder. The file must be UTF-8. ([JSON fragment extensions](https://learn.microsoft.com/en-us/windows/terminal/json-fragment-extensions))
- A fragment can update the built-in and dynamic profiles by GUID, but not the profile defaults. So a fragment cannot switch the scheme on for every profile, and activation is the user's step.
- The current renderer (`src/renderer/atlas/AtlasEngine.cpp` in `microsoft/terminal`) paints `selectionBackground` opaque and draws selected text in white or black, chosen by the lightness of the selection colour. The foundation's flattened selection colour is therefore shown as it is, with white text on it.

## The port

### Output

Both files are generated and committed, so a clone installs without Node.

- `themes/sepps-workshop.json`: the one scheme object, for manual paste into `settings.json`.
- `dist/sepps-workshop-windows-terminal.json`: the fragment, `{ "schemes": [ <the scheme> ] }`. This is what `install.ps1` deploys.

Both are written as UTF-8 without a byte order mark, with two-space indentation and a trailing newline. The apostrophe in the name is written as the character itself, not as an escape.

### Mapping

`src/theme-template.mjs` exports a pure `buildTheme(tokens)` that returns the scheme object, and `buildFragment(tokens)` that wraps it.

| Scheme key                    | Token                                     |
| ----------------------------- | ----------------------------------------- |
| `name`                        | `meta.name`                               |
| `background`                  | `surface.bg_terminal`                     |
| `foreground`                  | `text.fg`                                 |
| `cursorColor`                 | `accent`                                  |
| `selectionBackground`         | `overlay.selection.hex_terminal`          |
| `black` … `white`             | `ansi.black` … `ansi.white`               |
| `brightBlack` … `brightWhite` | `ansi.bright_black` … `ansi.bright_white` |

Windows Terminal calls the sixth colour `purple`; it takes `ansi.magenta`, and `brightPurple` takes `ansi.bright_magenta`. In this palette that is Bright Orange: the brand has no magenta.

A terminal cannot blend and paints on the terminal background, so the selection takes `hex_terminal`, as in the fish port. The accent-tinted selection of `vivid-life-windows-terminal`, blended in the port, is not carried over: it would be alpha arithmetic in a port, and Sepp’s Workshop selections darken.

The port contains no hex value and no alpha arithmetic. There is no key the foundation has no value for, so nothing is left out.

### Build

`build.mjs` writes the two JSON files and copies the README images (`sepps-workshop-header.jpg`, `sepp-recruiting.png`) from the foundation's `assets/` into `images/`. Same tokens in, byte-identical output.

### Install script

`install.ps1`, run from a clone:

1. Stops with a clear message if `dist/sepps-workshop-windows-terminal.json` is missing.
2. Creates `%LOCALAPPDATA%\Microsoft\Windows Terminal\Fragments\SeppsWorkshop\`.
3. Copies the fragment there with `Copy-Item -Force`.
4. Prints where the file went and where to pick the scheme.

Two rules, both for Windows PowerShell 5.1:

- The script is ASCII only. 5.1 reads a UTF-8 script without a byte order mark in the ANSI code page, which turns any non-ASCII character into garbage. So the script does not print the scheme name with its apostrophe; it says "the Sepp's Workshop color scheme" in plain ASCII in its messages.
- The script moves bytes and never parses or rewrites the fragment. `Get-Content`, `ConvertFrom-Json`, `Set-Content` and `Out-File` are not used on it.

The script works in Windows PowerShell 5.1 and in PowerShell 7.

### Tests (`node --test`)

1. The scheme has exactly the documented key set. Windows Terminal ignores an unknown or misspelt key without an error, so the test is the guard.
2. Every key equals its token, and every colour is a six-digit hex value.
3. The fragment is `{ schemes: [scheme] }` and nothing else.
4. No hex literal and no `alphaOver` in `src/theme-template.mjs` or `build.mjs`.
5. The committed `themes/`, `dist/` and `images/` equal a fresh build. `dist/` has no byte order mark.
6. `install.ps1` contains only ASCII bytes.
7. Integration with a real PowerShell: `install.ps1` runs with `LOCALAPPDATA` pointing at a temporary directory; the fragment lands at `Microsoft\Windows Terminal\Fragments\SeppsWorkshop\sepps-workshop-windows-terminal.json`, byte-identical to `dist/`. A second run succeeds too. The test uses `powershell.exe` or `pwsh` if one is on the path (under WSL through interop, with a temporary directory on the Windows side) and is skipped otherwise.

There is no CI test workflow for now, as in the other ports.

### README

English, no emoji, exact where technical, relaxed elsewhere. Sections, following the fish port:

1. Header image, title, badges.
2. What it is: one dark scheme on sepp.med Darkblue, no variants.
3. Install: clone and `.\install.ps1`; the `Unblock-File` hint; choosing the scheme under Settings, Color schemes, or per profile; updating with `git pull` and a second run; manual paste from `themes/sepps-workshop.json`; uninstall by deleting the fragment folder. A note that the name carries a typographic apostrophe, with the line to copy for anyone who edits `settings.json` by hand.
4. Recommended companions: JetBrains Mono or JetBrainsMono Nerd Font, the fish port for syntax colours, the Starship port for the prompt.
5. How it is built: the mapping table in words, and the deliberate points (the `purple` slots are Bright Orange, the selection darkens, red is the readable coral and not Racing Red, selected text is drawn white by the terminal).
6. Contributing: colour problems go to the foundation, mapping mistakes here.
7. Licence.
8. "Want to join Sepp’s Workshop?", as in the fish port.

A screenshot needs a running terminal; the README gets one when the user adds `images/screenshot.png`.

### Scaffolding

Copied from the fish port and adapted in names and paths only: `.claude/settings.json` (PowerShell permissions in place of the fish ones), `.githooks/pre-commit`, `scripts/sync-config-table.sh`, `.gitignore`, `.prettierignore` and `.claudeignore` (both also list `dist/`), `claude.yml` and `claude-code-review.yml`, `LICENSE` (MIT, sepp.med gmbh). The handoff skill is copied from the foundation to `.claude/skills/sepps-workshop/SKILL.md`. The release skill follows the fish port's: version bump, changelog, tag, push, GitHub release, no registry.

`CLAUDE.md` and `CHANGELOG.md` are written for this port. `package.json` is private, MIT, version `0.1.0`, with `@sepps-workshop/design-system` `^0.7.0` and Prettier as the only dev dependencies.

## Out of scope

- Pushing, tagging and releasing.
- Changing the user's own Windows Terminal settings.
- A screenshot.
- Windows Terminal's window and tab themes (`themes` in `settings.json`): the foundation's chrome roles are written for an editor, and fragments are documented for profiles and schemes only.
- Switching the scheme on through profile updates in the fragment, a download one-liner, a CI test workflow.

## After this ships

Ask whether the scheme used the foundation correctly and log corrections to `.claude/learnings.md`, as the skill requires.

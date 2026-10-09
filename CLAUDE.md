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
- **Determinism.** Same tokens in, byte-identical files out. `npm test` fails if `themes/`, `dist/` or `images/` is stale. `.gitattributes` keeps `themes/` and `dist/` on LF, so the comparison also holds on a Git for Windows checkout.
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

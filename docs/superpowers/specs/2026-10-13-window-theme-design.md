# Window theme for the tab row: design

Date: 2026-10-13. Status: implemented on `feat/window-theme`; not to be merged before the design-system change below.

This replaces the "out of scope" line on window and tab themes in `2026-10-09-windows-terminal-port-design.md`.

## Why

On Darkblue the terminal carries the brand, but the user finds long text easier to read on the darker canvas the VS Code port uses (`surface.bg`). VS Code can afford that canvas because Darkblue surrounds it. A terminal has one surface besides its panes: the tab row, which is also the title bar. A window theme can colour it, so the terminal can have the same split: Darkblue as the frame, the pane as the place to read.

The user tried it on 2026-10-13 in their own `settings.json` (Darkblue tab row, pane on `#14284c`) and approved the look.

## Decisions taken with the user

1. The theme ships as a generated file to paste (`themes/sepps-workshop-window-theme.json`), with the steps in the README. Someone who installs a terminal theme can edit a JSON file.
2. `install.ps1` stays as it is and does not edit `settings.json`. This keeps the install story of `vivid-life-windows-terminal`; the window theme itself is a departure from that sibling, which has none.

## Facts checked on 2026-10-13

- A fragment holds `profiles` and `schemes`. Themes are not among them. ([JSON fragment extensions](https://learn.microsoft.com/en-us/windows/terminal/json-fragment-extensions))
- A theme is an object in the `themes` array of `settings.json`, selected by name with `"theme"`. `tabRow` and `tab` each take `background` and `unfocusedBackground`; a theme colour is a hex value, `"accent"` or `"terminalBackground"`. With tabs in the title bar, which is the default, `tabRow` colours the title bar. `window.frame` is Preview only. ([Themes](https://learn.microsoft.com/en-us/windows/terminal/customize-settings/themes))

## Mapping

`buildWindowTheme(tokens)` in `src/theme-template.mjs`:

| Theme key                    | Value                  |
| ---------------------------- | ---------------------- |
| `name`                       | `meta.name`            |
| `window.applicationTheme`    | `"dark"`               |
| `tabRow.background`          | `surface.bg_chrome`    |
| `tabRow.unfocusedBackground` | `surface.bg_chrome`    |
| `tab.background`             | `"terminalBackground"` |
| `tab.unfocusedBackground`    | `surface.bg_chrome`    |

`surface.bg_chrome` is the foundation's role for the chrome around content. The row keeps its colour in an unfocused window: the frame is the brand anchor, and the user's trial used that. An inactive tab takes the row's colour, which looks like a transparent tab without a colour value in the port. The user compared it with a transparent value in a window with several tabs on 2026-10-13 and saw no difference worth naming.

`window.frame` is left out: it is Preview only.

## Tests

One test compares the whole theme object with its expected values from the tokens, which pins the key set as well. The stale-file test covers the new file. The no-colour test already covers the template.

## Not in this change

The pane still takes `surface.bg_terminal`, which is Darkblue in the design system this port builds on. Moving a standalone terminal to the darker canvas is a change to the design system (`bg_terminal` and the `hex_terminal` overlays, with their gates) and reaches this port through a version bump, without a change to the mapping.

Until then the theme is not worth shipping: pane, active tab, inactive tabs and row are all Darkblue, so the active tab cannot be told from the others. The README wording ("built on sepp.med Darkblue", the active tab running into its pane) is settled with that version bump.

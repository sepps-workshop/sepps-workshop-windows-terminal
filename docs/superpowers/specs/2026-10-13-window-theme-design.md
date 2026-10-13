# Window theme for the tab row: design

Date: 2026-10-13. Status: implemented.

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

## The pane

The pane takes `surface.bg_terminal`, as before. Design system 0.9.0 moved that role from Darkblue to the canvas (`surface.bg`), and the port follows through the version bump, without a change to the mapping. With an earlier design system the pane, the tabs and the row are all Darkblue and the active tab cannot be told from the others, so the theme needs `^0.9.0`.

// Maps the foundation's terminal tokens to a Windows Terminal colour scheme
// and its chrome colour to a window theme. Pure functions: tokens -> object.
//
// The scheme format has these keys and no others; the terminal ignores an
// unknown key without an error.
// https://learn.microsoft.com/en-us/windows/terminal/customize-settings/color-schemes

export const THEME_FILE = "sepps-workshop.json";
export const WINDOW_THEME_FILE = "sepps-workshop-window-theme.json";
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

// A window theme: the tab row, which is also the title bar. It is the one
// surface a terminal has besides its panes, so it takes the chrome colour.
// A fragment cannot carry a theme; this one is pasted into settings.json.
// https://learn.microsoft.com/en-us/windows/terminal/customize-settings/themes
export function buildWindowTheme(tokens) {
  const chrome = tokens.surface.bg_chrome;
  return {
    name: tokens.meta.name,
    window: { applicationTheme: "dark" },
    tabRow: { background: chrome, unfocusedBackground: chrome },
    // The active tab runs into its pane; the others sink into the row.
    tab: { background: "terminalBackground", unfocusedBackground: chrome },
  };
}

// A JSON Fragment Extension: what install.ps1 puts into the Fragments folder.
// https://learn.microsoft.com/en-us/windows/terminal/json-fragment-extensions
export const buildFragment = (tokens) => ({ schemes: [buildTheme(tokens)] });

export const toJson = (value) => JSON.stringify(value, null, 2) + "\n";

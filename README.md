<p align="center">
  <img src="./images/sepps-workshop-header.jpg" width="100%" alt="Sepp, the blue robot, assembling code blocks with a wrench in his workshop" />
</p>

# Sepp’s Workshop for Windows Terminal

<p>
  <img src="https://img.shields.io/badge/WCAG-AA-3aaa35" alt="WCAG AA" />
  <img src="https://img.shields.io/badge/license-MIT-b2b2b2" alt="MIT license" />
</p>

One dark colour scheme for [Windows Terminal](https://learn.microsoft.com/en-us/windows/terminal/), in the sepp.med colours: a deep blue to read on, a shade darker than the brand's Darkblue, with Sunset yellow as the cursor. It sets the background, the text, the cursor, the selection and the sixteen ANSI colours. There are no variants and nothing to configure: this is the one scheme. A small window theme comes with it and puts the tab row on Darkblue itself, so the brand colour frames the terminal.

The colours come from the [Sepp’s Workshop design system](https://github.com/sepps-workshop/sepps-workshop-design-system), whose build refuses to ship a text colour that fails WCAG AA on its background. All sixteen colours except black are checked against the background.

## Install

In PowerShell:

```powershell
git clone https://github.com/sepps-workshop/sepps-workshop-windows-terminal.git
cd sepps-workshop-windows-terminal
.\install.ps1
```

The script copies one file, a [JSON Fragment Extension](https://learn.microsoft.com/en-us/windows/terminal/json-fragment-extensions), into `%LOCALAPPDATA%\Microsoft\Windows Terminal\Fragments\SeppsWorkshop\`. Windows Terminal reads that folder by itself. The script does not touch your `settings.json`, and you do not need Node.js: the file is already built.

If PowerShell refuses to run the script because of the execution policy, run it once with the policy lifted. This changes no setting:

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

### Switch it on

Restart Windows Terminal. Then open **Settings**, **Color schemes**, choose **Sepp’s Workshop** and set it as the default. To use it for one profile only, go to **Settings**, the profile, **Appearance**, **Color scheme**.

If you would rather edit `settings.json`, copy this line: the apostrophe in the name is a typographic one, and a straight one does not match.

```json
"colorScheme": "Sepp’s Workshop"
```

### Colour the tab row

A colour scheme stops at the edge of the pane. The tab row, which is also the title bar, belongs to a window theme, and Windows Terminal reads window themes from `settings.json` only: a fragment cannot carry one. So this step is by hand, and optional.

Open `settings.json` (**Settings**, **Open JSON file**). Paste the content of [`themes/sepps-workshop-window-theme.json`](./themes/sepps-workshop-window-theme.json) into the `"themes"` array; add the array if the file has none. Then select the theme, on the top level of the file:

```jsonc
"theme": "Sepp’s Workshop",
"themes": [
  // the content of themes/sepps-workshop-window-theme.json
]
```

The tab row is Darkblue now, whether the window has the focus or not. The active tab takes the background of its pane and runs into it; the other tabs sink into the row. The theme applies to the whole window, also to tabs that use another colour scheme.

### Update

```powershell
git pull
.\install.ps1
```

If you pasted the window theme, compare it with the file after an update; the script does not change what you pasted.

### Manual install

No script? Open [`themes/sepps-workshop.json`](./themes/sepps-workshop.json) and paste its content into the `"schemes"` array of your `settings.json` (**Settings**, **Open JSON file**).

### Uninstall

Choose another colour scheme, delete `%LOCALAPPDATA%\Microsoft\Windows Terminal\Fragments\SeppsWorkshop\` and restart Windows Terminal. If you added the window theme, set `"theme"` back to `"dark"`, `"light"` or `"system"` and remove the object from `"themes"`.

## Recommended companions

- **Font**: themes cannot ship fonts. The design system recommends [JetBrains Mono](https://www.jetbrains.com/lp/mono/), or [JetBrainsMono Nerd Font](https://www.nerdfonts.com/font-downloads) if your prompt shows icons.
- **Shell colours**: a terminal scheme colours what programs print, not what you type. For syntax highlighting on the command line there is [Sepp’s Workshop for fish](https://github.com/sepps-workshop/sepps-workshop-fish); a PowerShell port is planned.
- **Prompt**: the scheme does not touch your prompt. For a [Starship](https://starship.rs) prompt in the same colours there is [Sepp’s Workshop for Starship](https://github.com/sepps-workshop/sepps-workshop-starship).

## How it is built

The scheme is generated. The design system says what the terminal background, the text, the accent and the sixteen ANSI colours are; this repository puts them under the keys Windows Terminal reads. It contains no colour value of its own, and a test fails if one appears. The window theme is generated the same way: its tab row takes the colour the design system gives to the chrome of an editor, the sidebar and status bar of [Sepp’s Workshop for VS Code](https://github.com/sepps-workshop/sepps-workshop-vs-code).

A few things follow from the palette and are deliberate:

- The background is not Darkblue. Darkblue is too bright to read on for hours, so the design system mixes it with Darkblack for the place where the text is, in a terminal as in an editor, and keeps Darkblue for the frame around it. In Windows Terminal the frame is the tab row; see [Colour the tab row](#colour-the-tab-row).
- The slots Windows Terminal calls `purple` and `brightPurple` are orange. The sepp.med palette has no magenta, so the design system puts Bright Orange there.
- Red is a coral red, not the Racing Red of the logo. Racing Red does not reach a readable contrast on a dark blue.
- A selection darkens the background. Windows Terminal draws the selected text in white on it.
- Blue on a blue terminal is the hardest colour: blue and cyan differ in lightness as well as in hue.
- `black` is a true black-grey, darker than the background. It is the anchor for programs that paint black bars; as text on the background it is hard to read, in this scheme as in any dark one.

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

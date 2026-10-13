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
- **Prompt**: the scheme does not touch your prompt. For a [Starship](https://starship.rs) prompt in the same colours there is [Sepp’s Workshop for Starship](https://github.com/sepps-workshop/sepps-workshop-starship).

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

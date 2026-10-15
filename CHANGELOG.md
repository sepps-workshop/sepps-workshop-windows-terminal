# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.2.0] - 2026-10-15

### Changed

- Updated to `@sepps-workshop/design-system` 0.12.0.
- The selection is a light Sunset tint (`selectionBackground` `#4e4d39`) instead of a near-black (`#1b1f25`). The dark selection differed from the background mostly in hue and hardly in lightness, so it was easy to miss.

## [0.1.1] - 2026-10-13

### Changed

- README rewritten in a friendlier voice: Sepp, the robot the theme is named after, now introduces it. The instructions are unchanged.

## [0.1.0] - 2026-10-13

### Added

- The Sepp’s Workshop colour scheme for Windows Terminal: one scheme, generated from the terminal tokens of `@sepps-workshop/design-system`.
- `install.ps1`, which deploys the scheme as a JSON Fragment Extension, so Windows Terminal picks it up without an edit to `settings.json`.
- `themes/sepps-workshop.json` for pasting the scheme into `settings.json` by hand.
- The scheme sits on the terminal background of design system 0.9.0, the dark canvas (`#14284c`), not on Darkblue itself. The window theme needs that: with an earlier design system the tabs and the row have one colour.
- `themes/sepps-workshop-window-theme.json`, a Windows Terminal window theme that puts the tab row on Darkblue, for pasting into `settings.json` by hand. A fragment cannot carry a theme.
- Tests that derive every expected value from the design system and run `install.ps1` with a real Windows PowerShell.

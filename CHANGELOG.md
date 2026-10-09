# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- The Sepp’s Workshop colour scheme for Windows Terminal: one scheme, generated from the terminal tokens of `@sepps-workshop/design-system`.
- `install.ps1`, which deploys the scheme as a JSON Fragment Extension, so Windows Terminal picks it up without an edit to `settings.json`.
- `themes/sepps-workshop.json` for pasting the scheme into `settings.json` by hand.
- Tests that derive every expected value from the design system and run `install.ps1` with a real Windows PowerShell.

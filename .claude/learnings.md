# Learnings

- 2026-10-09: Windows Terminal schemes have no alpha, so `selectionBackground` takes `overlay.selection.hex_terminal`. The terminal paints it opaque and draws selected text in white or black by the selection's lightness.
- 2026-10-09: `install.ps1` must stay ASCII only (Windows PowerShell 5.1 reads a script without a byte order mark in the ANSI code page) and must copy the fragment byte for byte: the scheme name holds U+2019, and a fragment must be UTF-8 without a byte order mark.
- 2026-10-09: A fragment cannot change the profile defaults, so it cannot switch the scheme on. Activation is the user's step in Settings.
- 2026-10-09: From WSL, `powershell.exe` only sees an environment variable that is named in `WSLENV`, and it needs a temporary directory on the Windows side.
- 2026-10-10: `Unblock-File` only removes the download mark of a file from a ZIP or browser download. A cloned script has none, so against a `Restricted` execution policy the working hint is a one-off `powershell -ExecutionPolicy Bypass -File .\install.ps1`.
- 2026-10-10: Generated files that a test compares byte for byte with a fresh build need `eol=lf` in `.gitattributes`, or a Git for Windows checkout turns them into CRLF and the test fails on a clean clone.

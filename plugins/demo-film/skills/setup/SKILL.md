---
name: setup
description: Check and install the tools that demo films need (Node.js 20+, pnpm, ffmpeg, Google Chrome, and Homebrew on macOS), so the user never installs them by hand. Use when the user says "set up demo films", "install what demo films need", "get my computer ready for demo films", or when the demo-film skill finds a tool missing. Safe to run again.
---

# Demo film setup

You install the tools for the user. The user is probably not a developer. Do not ask the user to
type commands. Run the setup script, explain each step in one plain line, and finish with
"Ready".

The scripts are in this skill's folder:

- Windows: `scripts/setup-windows.ps1` (Windows PowerShell 5.1 or 7)
- macOS: `scripts/setup-macos.sh` (bash)

Each script prints one line per tool (`OK`, `MISSING`), then `READY`, `NOT READY` or `BLOCKED`.
During an install it prints `STEP <plain line>` before each command and `RUN <command>`.

## 1. Check

Run the check. It changes nothing.

- Windows: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "<skill>/scripts/setup-windows.ps1"`
- macOS: `bash "<skill>/scripts/setup-macos.sh"`

If the output ends with `READY`, tell the user "Your computer is ready for demo films." and stop.

## 2. Tell the user the plan

List what is missing and what you will install, one plain line each. For example:

> Your computer needs two tools for demo films:
> - Node.js, which runs the film tools.
> - ffmpeg, which turns the recording into a video file.
>
> I will install them now. Windows can ask for permission: click **Yes**.

On macOS without Homebrew, also say: "A Terminal window will open. Type your Mac password there
and press Enter. The letters do not show while you type."

## 3. Install

Run the same script with the install flag:

- Windows: `... setup-windows.ps1 -Install`
- macOS: `bash "<skill>/scripts/setup-macos.sh" --install`

Give it 10 minutes (a timeout of 600000 ms). Before each `RUN` line, the script prints the
`STEP` line. Relay each `STEP` line to the user in your own words as it happens, if you can.

To see the commands without an install, add `-DryRun` (Windows) or `--dry-run` (macOS).

## 4. Read the result

| Last line | What to do |
|---|---|
| `READY` | Say "Ready. Your computer has everything for demo films." Then continue with the user's film request, or tell them to ask "Make a demo film of <address>". |
| `BLOCKED <what>` | Stop. Say only: "Your computer does not let me install <what>. Please ask your IT team to allow <what>, then ask me again." Do not try another install method, an admin account or a way around the block. |
| `WAITING ...` (macOS, exit 3) | The Homebrew install still runs in Terminal. Ask the user to finish it there, then run the install again. |
| `NOT READY` | Run the check again. If a tool is still missing, the install did not take: say which tool, and ask the user to restart the computer and ask you again. |

Permission prompts:

- **Windows (UAC).** Node.js and Chrome install for all users, so Windows asks "Do you want to
  allow this app to make changes?". The user clicks **Yes**. If the user clicks No, or has no
  admin rights, the script stops with `BLOCKED`. That is the "ask IT" case.
- **macOS.** Homebrew and Chrome ask for the Mac password. A Mac user that is not an
  administrator gets `BLOCKED`.

## 5. Use the new tools in this session

Claude Code started before the install, so its shell does not know the new tools yet. For the
rest of this session, start each command with the path refresh:

- Windows (PowerShell): `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User') + ';' + "$env:APPDATA\npm"; `
- Windows (Git Bash): run the command through `powershell.exe -NoProfile -Command "<refresh>; <command>"`.
- macOS: `eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || /usr/local/bin/brew shellenv)"; `

If a tool is still "not found", ask the user to type `/exit`, then `claude` again, and to repeat
the request. A new Claude Code session sees every new tool.

## Rules

- The scripts are safe to run again. They install only what is missing.
- Never install a different version on top of a working one. A tool that shows `OK` stays as it is.
- Never print or ask for a password. The user types the Mac password in Terminal only.
- Never change system settings, execution policies or security software.

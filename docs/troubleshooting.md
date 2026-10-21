# Troubleshooting

Find the message or the symptom in the left column. Do the steps in the right column.

## Install

| Problem | What to do |
|---|---|
| `claude`, `node`, `pnpm` or `ffmpeg` is "not recognized" or "not found" | 1. Close the terminal. 2. Open a new terminal. 3. Try again. If it still fails, install the tool again ([Getting started](getting-started.md), step 1). |
| `node -v` shows v18 or lower | Install Node.js 20 or later: `winget install OpenJS.NodeJS.LTS` or `brew install node`. |
| `winget` is not found (Windows) | Install "App Installer" from the Microsoft Store, then open a new PowerShell. |
| `brew` is not found (macOS) | Install Homebrew from https://brew.sh, then open a new Terminal. |
| `npm install -g pnpm` fails with a permission error (macOS) | Run `corepack enable pnpm` instead. |
| `/plugin` is not a known command | Update Claude Code: run `claude update`, then start it again. |

## Capture

| Problem | What to do |
|---|---|
| "Chrome is not found", or `chromium.launch` fails | Install Google Chrome. The capture uses the Chrome that is on your computer. |
| `ffmpeg` fails at the end of the capture | Install ffmpeg and open a new terminal. Then record again. |
| "app.permission is empty" | Write one sentence in `app.permission`: why you can film the app. See [Privacy](privacy.md). |
| "Set the app's address" | Set `app.base` in the timeline, or the `BASE` variable. |
| "no saved sign-in" | Run `pnpm login <id>` and sign in. |
| "the saved sign-in has expired" | Run `pnpm login <id>` again. |
| The sign-in page says "This browser or app may not be secure" | Your sign-in provider refuses automated browsers. Ask your IT team for a test account with a plain password, and use the form sign-in. See [Sign-in](sign-in.md). |
| The recording shows the sign-in page, not the app | The session expired, or `signedIn` is not set. Run `pnpm login <id>` again. Add `signedIn` to `app.login`. |
| `drift <id>: target ... did not resolve` | The app changed, or the selector is wrong. Run `pnpm inspect <id> <path>` and fix the selector. |
| `late:` lines after a capture | The app was slow at that step. Add a `waitFor` action after the step that loads. |
| The capture fails | Open `public/rec/<id>.take/failure.png`. It shows what the browser saw at the failure. |
| The film shows a frozen screen for some seconds | Record again. If it happens again at the same place, add a `waitFor` after the step before it. |

## Render

| Problem | What to do |
|---|---|
| On Windows, `remotion.exe ENOENT` | The folder path is too long for Windows (260 characters at most). Move the film project to a short path, for example `C:\demo-films\my-app`. Delete `node_modules` and run `pnpm install` again. |
| "no recording for `<id>` yet" | Run `pnpm capture <id>` first. Without a recording, the film shows the cards only. |
| The logo does not show | Check that the file is under `public/` and that `brand.json` gives the path from `public/`, for example `brand/logo.svg`. |
| The text is hard to read | The ink colour does not have enough contrast on the ground colour. Choose a darker `ink` or a lighter `ground`. |
| `Fontconfig error` lines | Ignore them. They do not change the film. |

## Other problems

Tell Claude what you see, and at which second of the film. Claude can look at the frames and fix
most problems.

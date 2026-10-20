# demo-film

A skill for Claude Code that makes a short, silent demo film of a web app. Claude records the
real app in Chrome, then adds a camera, a spotlight, a large cursor, short captions and an end
card. You tell Claude what to show. Claude does the technical work.

The result is an MP4 file, 1920x1080, 20 to 70 seconds.

## 1. Install the tools

Do these steps one time. Open a terminal: **PowerShell** on Windows, **Terminal** on macOS.

On macOS, install Homebrew first if you do not have it: see https://brew.sh.

| Tool | Windows (PowerShell) | macOS (Terminal) |
|---|---|---|
| Claude Code | `irm https://claude.ai/install.ps1 \| iex` | `curl -fsSL https://claude.ai/install.sh \| bash` |
| Node.js 20 or later | `winget install OpenJS.NodeJS.LTS` | `brew install node` |
| pnpm | `npm install -g pnpm` | `npm install -g pnpm` |
| ffmpeg | `winget install Gyan.FFmpeg` | `brew install ffmpeg` |
| Google Chrome | `winget install Google.Chrome` | `brew install --cask google-chrome` |

1. Run the commands in the table, top to bottom.
2. Close the terminal and open a new one, so it finds the new tools.
3. Run `claude` one time and sign in with your Claude account.

To check the tools, run `node -v`, `pnpm -v` and `ffmpeg -version`. Each command must show a
version number. Node must show v20 or later.

## 2. Install the skill

**Option A: plugin (recommended).** Start Claude Code with `claude`. Type these two commands:

```
/plugin marketplace add True-Aim-AG/demo-film-skill
/plugin install demo-film@demo-film-skill
```

Then close Claude Code and start it again.

**Option B: manual copy.**

1. Download this repository as a ZIP file (the green **Code** button, then **Download ZIP**).
   Unzip it.
2. Copy the folder `plugins/demo-film/skills/demo-film` to your skills folder:
   - Windows: `C:\Users\<you>\.claude\skills\demo-film`
   - macOS: `~/.claude/skills/demo-film`
3. Start Claude Code again.

## 3. Make a film

1. Make an empty folder for your films, for example `demo-films` in your home folder.
2. Open a terminal in that folder and run `claude`.
3. Ask Claude:

   > Make a demo film of https://your-app.example.com

Claude asks you some questions first:

- **Brand or no brand.** Your logo and colours, or a neutral look with no logo.
- **Permission.** You must own the app, or have the owner's agreement to film it.
- **Test account.** Use a test account with fake data only. Real customer data must not be in
  the film.
- **What to show**, who watches, and the words on screen.

**Sign-in.** If the app needs a sign-in, Claude opens a Chrome window on the app. Sign in as you
always do (password, Microsoft or Google sign-in, a code from your phone). When you see the app,
close the window. Claude keeps the session in the `.auth` folder of the film project. Do not share
that folder: it gives access to your account until the session expires.

Claude then makes a draft. Watch it and tell Claude what to change, in your own words: "too fast",
"remove this line", "show the total longer". Claude makes the final film and gives you the file
path.

## Try the example

The skill includes an example film of a public to-do demo app. It needs no sign-in. Ask Claude:

> Make the example film from the demo-film skill.

Or run it yourself, from the folder where this repository is (a clone or the unzipped ZIP).

Windows (PowerShell):

```
Copy-Item -Recurse plugins\demo-film\skills\demo-film\template $HOME\demo-films\example
Copy-Item plugins\demo-film\skills\demo-film\examples\todo-list\timeline.json $HOME\demo-films\example\timelines\todo-list.json
cd $HOME\demo-films\example
pnpm install
pnpm capture todo-list
pnpm render todo-list
```

macOS (Terminal):

```
mkdir -p ~/demo-films
cp -R plugins/demo-film/skills/demo-film/template ~/demo-films/example
cp plugins/demo-film/skills/demo-film/examples/todo-list/timeline.json ~/demo-films/example/timelines/todo-list.json
cd ~/demo-films/example
pnpm install
pnpm capture todo-list
pnpm render todo-list
```

The film is `out/todo-list.mp4` in the example folder. The capture takes about 30 seconds, the
render about 1 to 3 minutes.

## Licences

- **This repository:** MIT licence (see `LICENSE`).
- **Remotion**, the video engine the films are made with, has its own licence. Remotion is free
  for individuals, for for-profit organisations with up to 3 employees, for non-profit
  organisations, and for evaluation. **A for-profit company with 4 or more employees must buy a
  Remotion Company Licence** before it uses Remotion to make videos. See
  https://www.remotion.dev/docs/license and https://www.remotion.pro/license. (Checked on 20
  October 2026, against the `LICENSE.md` in Remotion's repository. Remotion says the licence
  changes slightly in version 5; the skill uses version 4.)
- **Playwright** (Apache 2.0) records the app. **ffmpeg** and **Chrome** are installed by you,
  under their own licences.
- **Fonts and logos:** use only fonts and logos that you may use in a video.

## Problems

| Problem | What to do |
|---|---|
| `ffmpeg` or `pnpm` is not found | Close the terminal, open a new one, and try again. |
| "Chrome is not found" | Install Google Chrome (step 1). |
| The sign-in page says the browser is not secure | Your company's sign-in blocks automated browsers. Ask your IT team for a test account with a plain password. |
| "the saved sign-in has expired" | Ask Claude to sign in again. |
| The film shows the wrong part of the page | Tell Claude what you see and at which second. |

Made by True Aim AG.

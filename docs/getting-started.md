# Getting started

This guide takes you from zero to your first demo film. It takes about 30 minutes the first time.

## Before you start

You need all of these. Check each item before you start.

- [ ] **Claude Code**, with a paid Claude plan (Pro, Max, Team or Enterprise) or a Claude
      Console account with API credit. The free plan does not include Claude Code.
- [ ] **Node.js 20 or later.**
- [ ] **pnpm**, a package manager for Node.js.
- [ ] **ffmpeg**, a video tool.
- [ ] **Google Chrome.**
- [ ] **Terminal basics.** You can open a terminal, paste a command and press Enter.
- [ ] **A test account on your app, with fake data only.** Real customer data must not appear
      in a film.
- [ ] **Permission to film the app.** You own the app, or its owner agreed.
- [ ] **A Remotion Company Licence**, if your company is for-profit and has 4 or more employees.
      See [Licences](licences.md).

Steps 1 and 2 install the software. You do them one time.

## 1. Install the tools

### Windows

1. Open **PowerShell**: press the Windows key, type `PowerShell`, press Enter.
2. Run these commands, one at a time:

   ```
   irm https://claude.ai/install.ps1 | iex
   winget install OpenJS.NodeJS.LTS
   winget install Gyan.FFmpeg
   winget install Google.Chrome
   ```

3. Close PowerShell and open it again. The new commands are now on the path.
4. Run this command:

   ```
   npm install -g pnpm
   ```

### macOS

1. Open **Terminal**: press Cmd+Space, type `Terminal`, press Enter.
2. If you do not have Homebrew, install it. Follow the one command on https://brew.sh.
3. Run these commands, one at a time:

   ```
   curl -fsSL https://claude.ai/install.sh | bash
   brew install node
   brew install ffmpeg
   brew install --cask google-chrome
   npm install -g pnpm
   ```

4. Close Terminal and open it again.

### Check the tools

Run each command. Each one must show a version number.

```
claude --version
node -v
pnpm -v
ffmpeg -version
```

Node must show `v20` or a higher number. If a command is not found, see
[Troubleshooting](troubleshooting.md).

## 2. Install the skill

1. Run `claude`. The first time, Claude Code asks you to sign in with your Claude account.
2. In Claude Code, type this command and press Enter:

   ```
   /plugin marketplace add True-Aim-AG/demo-film-skill
   ```

3. Type this command and press Enter:

   ```
   /plugin install demo-film@demo-film-skill
   ```

4. Type `/exit` and press Enter. Then run `claude` again.

The skill is now installed. To install it without the plugin commands, see the README,
"Option B: manual copy".

## 3. Make your first film

1. Make a folder for your films. Keep the path short, for example `C:\demo-films` on Windows or
   `~/demo-films` on macOS.
2. Open a terminal in that folder:
   - Windows: `cd C:\demo-films`
   - macOS: `cd ~/demo-films`
3. Run `claude`.
4. Type your request, with the address of your app:

   > Make a demo film of https://app.example.com

Claude asks you questions. Answer them in your own words.

1. **Brand or no brand.** Your logo and colours, or a neutral look. If you choose your brand,
   give Claude your logo file, or let Claude read the logo and colours from your website. See
   [Brand](brand.md).
2. **Permission.** Say who owns the app and who agreed to the film.
3. **Test account.** Confirm that you sign in with a test account that holds fake data only.
4. **The film.** Who watches it, the one thing to show, and the words on screen.
5. **Sign-in.** How you sign in to the app. Claude then opens a Chrome window. Sign in as you
   always do. When you see the app, close the window. See [Sign-in](sign-in.md).

Claude then writes the film plan, records the app and makes a draft.

Note: Claude asks for your permission before it runs a command. Read the request, then accept
it. To see what each command does, see [Commands](commands.md).

## 4. Review the draft

1. Open the draft file that Claude names, for example `out\new-invoice-draft.mp4`.
2. Watch it.
3. Tell Claude what to change, in your own words: "too fast", "remove the second caption",
   "show the total for longer".

Claude changes the film and makes a new draft. Repeat until you like the story and the rhythm.

## 5. Get the final film

1. Ask Claude: "Make the final film."
2. Claude renders the film and looks at every frame for problems.
3. Claude gives you the file path, for example `C:\demo-films\my-app\out\new-invoice.mp4`.

The film is an MP4 file, 1920x1080, silent. You can send it, put it on your website or play it
in a presentation.

## Next steps

- Make a second film of the same app: ask Claude "Make another film of the same app, about
  <feature>". Claude uses the same folder, brand and sign-in.
- Change the words of a film: ask Claude. A change of words does not need a new recording.
- Read the full documentation: [docs](README.md).

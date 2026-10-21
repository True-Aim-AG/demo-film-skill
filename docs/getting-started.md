# Getting started

This guide takes you from zero to your first demo film. It takes about 30 minutes the first time.

## Before you start

You bring these four things. Check each one before you start.

- [ ] **A paid Claude plan** (Pro, Max, Team or Enterprise), or a Claude Console account with
      API credit. The free plan does not include Claude Code.
- [ ] **A test account on your app, with fake data only.** Real customer data must not appear
      in a film.
- [ ] **Permission to film the app.** You own the app, or its owner agreed.
- [ ] **A Remotion Company Licence**, if your company is for-profit and has 4 or more employees.
      See [Licences](licences.md).

Claude installs the tools for you: Node.js 20 or later, pnpm, ffmpeg and Google Chrome, and
Homebrew on macOS. You do not install them by hand.

## 1. Install Claude Code and the skill

You do this step one time.

### Windows

1. Open **PowerShell**: press the Windows key, type `PowerShell`, press Enter.
2. Paste this block and press Enter:

   ```
   irm https://claude.ai/install.ps1 | iex
   $env:Path += ";$env:USERPROFILE\.local\bin"
   claude plugin marketplace add True-Aim-AG/demo-film-skill
   claude plugin install demo-film@demo-film-skill
   claude "Set up demo films"
   ```

### macOS

1. Open **Terminal**: press Cmd+Space, type `Terminal`, press Enter.
2. Paste this block and press Enter:

   ```
   curl -fsSL https://claude.ai/install.sh | bash
   export PATH="$HOME/.local/bin:$PATH"
   claude plugin marketplace add True-Aim-AG/demo-film-skill
   claude plugin install demo-film@demo-film-skill
   claude "Set up demo films"
   ```

The block installs Claude Code, adds the skill, and starts Claude with the request "Set up demo
films".

## 2. Let Claude set up your computer

1. Sign in with your Claude account when Claude Code asks.
2. Claude checks your computer. It lists the tools that are missing and says what each one does.
3. Accept when Claude asks to run the setup.
4. On Windows, click **Yes** when Windows asks "Do you want to allow this app to make changes?".
5. On macOS, a Terminal window can open for Homebrew. Type your Mac password there and press
   Enter. The letters do not show while you type.
6. Wait until Claude says "Ready".

If your computer does not let Claude install a tool, Claude stops and tells you what to ask your
IT team to allow. This can happen on a company laptop. When IT has allowed it, ask Claude "Set
up demo films" again.

Note: You can run the setup again at any time. It installs only what is missing.

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

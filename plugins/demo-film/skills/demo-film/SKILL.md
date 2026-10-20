---
name: demo-film
description: Make a short, silent demo film of a web app. Playwright records the real app once on the film's clock; Remotion adds the camera, spotlight, big cursor, callouts and end card from one timeline file. Asks brand or no brand first, supports a one-time manual sign-in (SSO, MFA). Use when the user says "make a demo video of my app", "film this feature", "product video", "screen film", "walkthrough video", "demo film of <url>", or wants to re-cut or re-capture a film in a project made by this skill (timelines/<id>.json, pnpm capture, pnpm render).
---

# Demo film

A 20 to 70 second silent film of one feature of a web app. **Record once, direct in post.**
Playwright drives the real app and logs the mouse path and element boxes. Remotion adds everything
cinematic from that log. One `timelines/<id>.json` drives both, so a copy change is a re-render and
a re-capture re-syncs itself.

**The user is probably not a developer.** Do every technical step yourself. Ask only plain
questions: what to show, who watches, which words. Never ask the user to edit code, JSON or frame
numbers. Show the result as a video file and ask what they think.

## Step 0. Check the tools

Run `node -v` (20 or later), `pnpm -v`, `ffmpeg -version`, and check that Google Chrome is
installed. If one is missing, tell the user which, and offer the install command from the README
(winget on Windows, brew on macOS). Install only after the user agrees.

## Step 1. Ask: brand or no brand

Ask this first, before anything else:

> Should the film use your company's brand (logo, colours, font), or a neutral look with no logo?

- **No brand.** Keep `brand.json` at `"mode": "none"`. Neutral grey ground, dark text, one blue
  accent, Inter font, no logo. The end card shows only the end line, if any.
- **Brand.** Ask for the logo file (SVG or PNG, the version for a light background) and the
  colours. If the user does not have them, offer to read them from the app's own page with
  `pnpm brand <url>` and show the user what it found. Then fill `brand.json`. Details:
  `references/brand.md`.

## Step 2. Permission and privacy

Ask both questions, and stop if the answer is no:

1. **"Do you own this app, or has its owner agreed that you film it?"** Write the answer into the
   timeline as `app.permission` (one sentence). The capture refuses to run without it.
2. **"Can you sign in with a test account that holds only fake data?"** Film fake data only: no
   real customer, person, e-mail address, amount or document, even blurred. If a screen still
   shows something real (the user's own name in the header, a chat widget, a notification count),
   hide it with `app.hideCss` or replace it with `app.textFixes`, and list each one in `plan.md`
   under "Film-only adjustments" with its reason.

Check the contact sheet frame by frame for anything real before you give the film to the user.

## Step 3. The brief

Ask the questions in `references/brief.md` (audience, the one thing to show, the case, what must
not appear, length, ending). Keep it to half a page in `plan.md`. The user confirms it.

## Step 4. Set up the film project

One folder holds all films of one app. Default: `~/demo-films/<app-name>/`, unless the user names
another folder. Never inside this skill's folder.

1. Copy `template/` (this skill's folder) to the project folder. It includes `.gitignore`.
2. Run `pnpm install` there.
3. Fill `brand.json` (step 1). Put the logo and the font file under `public/brand/`.
4. Copy `examples/todo-list/timeline.json` to `timelines/<id>.json` as a start. The id is short,
   lowercase, with dashes: `new-invoice`, `team-setup`.

Commands, in the film project:

```
pnpm login <id>            sign in by hand once, in a visible Chrome window (saved in .auth/)
pnpm inspect <id> [path]   screenshot and element list of one page, to write targets
pnpm brand <url> [<id>]    read colours, font and logo candidates off a page
pnpm pace <id> [--write]   reading time: lengthen short cards and callouts (before capture)
pnpm check-films <id|all>  walk the timeline against the app without recording: ok or drift
pnpm capture <id>          record the take: public/rec/<id>/ (recording.mp4, events.json)
pnpm draft <id>            out/<id>-draft.mp4, 720p, fast
pnpm render <id>           out/<id>.mp4, 1080p H.264, the film
pnpm still <id> <sec>      one frame as a PNG
pnpm sheet <id> [every]    contact sheet of the latest render, for review
pnpm studio                scrub every film in a browser
pnpm shift <id> <sec>      move the screen part and its take together, without a new take
```

## Step 5. Sign-in

Ask the user how they sign in to the app, then set `app.login` in the timeline:

- **No sign-in** (a public page): `{ "type": "none" }`.
- **Any sign-in, the default**: `{ "type": "saved", "signedIn": "<selector>" }`. Run
  `pnpm login <id>`. A Chrome window opens on the app. Tell the user: "Sign in as you always do,
  with the test account. When you see the app, close the window." This works with passwords,
  Microsoft or Google SSO, MFA codes and passkeys. The session goes to `.auth/session.json`, which
  is git-ignored. `signedIn` is a selector that only a signed-in page has (a profile menu); with
  it, the capture says clearly when the session has expired. When it expires, run `pnpm login`
  again.
- **A plain form, on request**: `{ "type": "form", "url": "/login", "user": "<sel>", "password":
  "<sel>", "submit": "<sel>", "done": "/home" }`. The capture reads `FILM_USER` and
  `FILM_PASSWORD` from the environment. Ask the user to set them in their own terminal. Never
  write a password into a file, a timeline, a message or a command you print.

Some identity providers refuse a browser that automation started ("This browser may not be
secure"). Then use the form login with a test account that has no SSO, or ask the app's
administrator for one.

## Step 6. Write the timeline

1. Run `pnpm inspect <id> <path>` on each page the film uses. Read `out/inspect.png` and
   `out/inspect.json` to choose selectors. Prefer `data-testid`, `id`, `name` and `aria-label`
   over class names.
2. Write `timelines/<id>.json` (schema: `references/timeline.md`): `app`, cards, callouts,
   targets, actions, camera, spots. The copy lives there; the storyboard table in `plan.md`
   mirrors it.
3. Run `pnpm pace <id> --write`, so every word has its reading time.
4. Run `pnpm check-films <id>`. Fix every drift in the timeline (targets, waits) before a capture.

## Step 7. Review 1: the draft

Run `pnpm capture <id>`, then `pnpm draft <id>`. Give the user the path to
`out/<id>-draft.mp4` and ask about story, words and rhythm, in plain terms. This draft on the
real app is the mockup. Do not polish before the user agrees on story and rhythm.

## Step 8. The film

1. Run `pnpm render <id>` and `pnpm sheet <id>`.
2. Look at the contact sheet yourself. Write a short ranked critique (`references/method.md`,
   "Review"), fix the cheap high-impact items, and re-render. Check that every fix landed.
3. Give the user the path to `out/<id>.mp4` and the remaining points. Change what they ask:
   their taste wins over every default here.
4. Re-capture only if an action or the app changed. A change of words is a re-render.

Renders and takes are git-ignored. The film is the file `out/<id>.mp4`.

## Style defaults

- The brand from `brand.json`, or the neutral look. The app in its light theme.
- Opening cards on the ground colour, type only, then the screen scales in. The film ends on the
  logo (brand) or the end line (no brand).
- Big cursor (46 px) with a halo and a click ring, drawn in post. Zoom 1.0 to 1.65,
  ease-in-out, 1.1 to 1.4 s per move. A spotlight dims the rest to 45 % with an accent edge.
- A glass callout lower left, one title and at most one sub line.
- **Reading time in proportion to the words**: 1 s plus 0.3 s a word, never shorter.
  `pnpm pace <id> --write` adds the hold.
- Silent, 1920x1080, 30 fps.

## Copy

Few words, one idea per callout. Name what the viewer sees, not how the software works. Avoid
"AI", "powered by", "seamless", "revolutionary". No em dashes.

- Open on the viewer's problem, in their words, with "your": "Your invoices arrive by email."
  The first card is on frame 0.
- One closing card after the screen at most: the viewer's day afterwards, stated only from what
  the film showed. No figure the app did not show.
- `end.line`: one small next step under the logo ("Book a 20-minute walkthrough."). Leave it out
  for a film shown live.

Every name, number and term on screen comes from the test account and is fictional.

More defaults (motion, density, review loop): `references/method.md`.

## Lessons (each one cost a failed run)

- **Device scale.** The DevTools screencast ignores Playwright's emulated scale. The capture
  launches Chrome with `--force-device-scale-factor=2` and `viewport: null`, then resizes the
  window until the page is exactly 1920x1080. Do not "simplify" this to `deviceScaleFactor`.
- **Redirects at sign-in.** A sign-in URL often carries `?next=<page>`, so a URL regex matches
  too early. Wait on `pathname` and on `networkidle`.
- **Latency.** App speed drifts the timeline. Put a `waitFor` action after any navigation or
  processing step; the capture cuts the idle wait from the recording. Watch the `late:` lines the
  capture prints.
- **A quiet page freezes the screencast.** Chrome sends a frame only when the page repaints. The
  capture keeps a 1 px, near-transparent square changing every frame. A frame gap over 0.3 s
  outside a cut in `frames.txt` means the take froze.
- **Cold server.** A route can take 30 s or more on first load. `app.setup` visits every page
  the take uses, off camera, so nothing loads slowly on camera.
- **Clean state.** Each capture starts in a fresh browser with only the saved sign-in. Put any
  reset (delete yesterday's test record, close a dialog) in `app.setup` and `app.teardown`.
- **Measure, never hardcode.** Every framed element is a `target` measured live, at a time
  before the first action or camera move that uses it.
- **Takes are atomic.** A capture writes `public/rec/<id>.take` and replaces the last good take
  only on success. On failure, `failure.png` in that folder shows what the browser saw.

## Changing the engine or the look

| To change | Edit |
|---|---|
| Logo, colours, font | `brand.json` only |
| Sizes, cursor, callout glass, spotlight, end card, timings | `src/look.ts` |
| How a layer behaves (a new kind of callout, a camera rule) | `src/Film.tsx`, `src/lib/timeline.ts` |
| What the capture can do (a new action or setup step) | `capture/record.cjs`, then `references/timeline.md` |
| Commands, render settings, contact sheet | `scripts/film.cjs`, `package.json` |
| One film's words, timing, framing | that film's timeline only |

After an engine change, run `pnpm typecheck`, re-render a film and look at the frames.

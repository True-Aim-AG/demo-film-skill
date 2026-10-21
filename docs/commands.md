# Commands

Run each command in the film project folder. `<id>` is the film id, the name of a file in
`timelines/` without `.json`. Claude runs these commands for you. You can also run them
yourself.

## Set up

| Command | What it does |
|---|---|
| `pnpm install` | Installs the film engine. Run it one time in a new film project. |
| `pnpm login <id>` | Opens a visible Chrome window on the app. You sign in. The session goes to `.auth/session.json`. See [Sign-in](sign-in.md). |
| `pnpm brand <url> [<id>]` | Reads the colours, the font and logo candidates from a page. Writes `out/brand-page.png` and `out/brand/`. Does not change `brand.json`. |
| `pnpm inspect <id> [<path>]` | Opens one page of the app as the capture sees it. Writes `out/inspect.png` and `out/inspect.json`, a list of the visible elements with a selector for each. |

## Check and record

| Command | What it does |
|---|---|
| `pnpm pace <id>` | Lists each card and caption that is too short to read. |
| `pnpm pace <id> --write` | Makes those cards and captions longer and moves every later time. Run it before a capture. |
| `pnpm check-films <id>` | Signs in, runs the setup, and does the steps without a recording. Prints `ok`, or the step that failed, with a screenshot at `out/<id>-check.png`. |
| `pnpm check-films all` | The same check for every film in the project. |
| `pnpm capture <id>` | Records the film's steps on the app. Writes `public/rec/<id>/`. Takes about as long as the film. |

## Render

| Command | What it does |
|---|---|
| `pnpm draft <id>` | Renders `out/<id>-draft.mp4` at 1280x720. Fast, for review. |
| `pnpm render <id>` | Renders `out/<id>.mp4` at 1920x1080. The final film. |
| `pnpm still <id> <sec>` | Renders one frame to `out/<id>-<sec>.png`. |
| `pnpm sheet <id> [every]` | Makes `out/<id>-sheet.png`, a grid with one frame every 2 seconds (or every `every` seconds) of the latest render. |
| `pnpm studio` | Opens Remotion Studio in the browser. You can play every film and move frame by frame. |

## Change

| Command | What it does |
|---|---|
| `pnpm shift <id> <sec>` | Moves the screen part of the film, and its recording, later (or earlier with a negative number). Use it when the opening cards get longer. No new recording is necessary. |
| `pnpm typecheck` | Checks the film engine code after a change to `src/`. |

## Environment variables

| Variable | Used by | Meaning |
|---|---|---|
| `BASE` | capture, login, inspect, check-films | The app's address. Overrides `app.base` in the timeline. |
| `FILM_USER`, `FILM_PASSWORD` | capture, inspect, check-films | The test account for the form sign-in. Set them in your terminal only. |

To set a variable for one command:

- Windows (PowerShell): `$env:BASE = "https://app.example.com"; pnpm capture new-invoice`
- macOS: `BASE=https://app.example.com pnpm capture new-invoice`

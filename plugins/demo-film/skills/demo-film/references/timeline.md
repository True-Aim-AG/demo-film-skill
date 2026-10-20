# Timeline: `timelines/<id>.json`

The file name is the film id (the Remotion composition and the argument to every command). All
times are film seconds. A key `_` anywhere holds a comment. Worked example:
`examples/todo-list/timeline.json` in this skill.

## Frame

| Key | Meaning |
|---|---|
| `fps`, `width`, `height`, `duration` | 30, 1920, 1080, total seconds |
| `recStart`, `recEnd` | film time the take starts and stops (start at or just before `screenIn`) |
| `screenIn`, `screenOut` | the screen scales in after the cards, and recedes before the end card |
| `endCard` | the end card fades in |

## Words

- `cards`: `{ from, to, lines: [..], accent? }`. Type on the ground colour; `accent` is the
  index of the accent-coloured line. A card from 0 is already on the first frame. A card that
  starts after `screenIn` is a closing card, shown after the screen recedes and before `endCard`.
- `end`: `{ line?, url? }`, optional. A next step and a url on the end card, under the logo.
- `callouts`: `{ from, to, title, sub? }`. Glass panel, lower left. One at a time.
- Each card and callout needs `to - from` of at least 1 s + 0.3 s per word. `pnpm pace <id>`
  reports the short ones; `--write` inserts the missing hold and moves every later time.

## The app (capture only)

`app`:

- `base`: the app's address (`https://app.example.com`). The `BASE` environment variable
  overrides it. Required.
- `start`: the page after sign-in (`/dashboard`). `query`: appended to every URL the capture
  opens (`"lang=en"`), optional.
- `permission`: one sentence on why the user may film this app. Required: the capture refuses
  to run without it.
- `login`: how the capture signs in.
  - `{ "type": "none" }`: no sign-in (default).
  - `{ "type": "saved", "signedIn": "<sel>", "state": "session" }`: reuse the session that
    `pnpm login <id>` saved to `.auth/<state>.json`. `signedIn` (optional) is a selector only a
    signed-in page has; the capture then fails clearly when the session expired.
  - `{ "type": "form", "url", "user", "password", "submit", "done" }`: fill a sign-in form with
    `FILM_USER` and `FILM_PASSWORD` from the environment. `user`, `password` and `submit` are
    selectors (defaults: email input, password input, submit button). `done` is the pathname
    that shows the sign-in worked (default `start`).
- `colorScheme`: `"light"` (default) or `"dark"`.
- `localStorage`: `{ key: value }` set before the app loads (a theme, a dismissed banner).
- `files`: `{ key: path }`, relative to the film project. Used by `drop` and `dragOver`. PDF,
  JPEG and PNG carry their type.
- `hideCss`: a list of CSS rules for the take (`"#chat-widget { display: none !important }"`).
  `textFixes`: `[from, to]` text replacements on screen. Both are film-only adjustments: list
  each in `plan.md` with its reason.
- `setup`, `teardown`: off-camera steps, run in order. `{ do: ... }`:
  `goto {path}`, `click {sel}`, `clickIf {sel}` (only if visible: a cookie banner),
  `waitFor {sel}`, `waitUrl {path}` (pathname prefix), `wait {ms}`, `type {sel, text}`,
  `press {key}`, `switch {sel, on}`, `closeAll {sel}`, `mouse {to: [x, y]}` (where the cursor
  rests when the take starts). Default setup: go to `start`. Default teardown: none.

## Targets and actions (capture)

- `targets`: `{ name: { sel, at } }`. `sel` is a selector or a list (the box is their union).
  Measured live at `at`, which must come before every action, camera move or spotlight using it.
- `actions`: `{ t, type, ... }`, performed at film time `t`:
  - `mouseTo`: `target` (plus `px` from its left edge, `dx`, `dy`) or `to: [x, y]`; `dur` seconds.
  - `click`: at the current mouse position (`target` is only a label for the log).
  - `type`: `sel` (an input or textarea), `text`, `dur` (spread over the characters); `select:
    true` replaces what is there.
  - `press`: `key` (`"Enter"`, `"Tab"`, `"Escape"`).
  - `dragOver`, `drop`: `target` (the drop zone) and `file`, a key or a list of keys dropped
    together.
  - `waitFor`: `sel`. A sync point: waiting beyond `t` is cut from the recording.
  - `scrollBottom`: `sel` (the scroll container), `dur`.
  - `scrollTo`: `sel` (the scroll container), `to` (an element in it), `top` (px from the
    container's top where `to` lands), `dur`.

## Checking a timeline against the app

`pnpm check-films <id|all>` signs in, runs `app.setup`, then walks the actions without
recording: every target must resolve and every `waitFor` succeed. One line per film, `ok` or
`drift <id>: <step>: <what>`, with a screenshot at `out/<id>-check.png`. Run it after the app
changes and before a capture. Fix a drift in the timeline (targets, waits), not the story.

## Direction (film)

- `camera`: `{ start, end, zoom, target, fy? }`. `target` is a point, a target name or a list of
  names (their union); `fy` places the frame vertically in it (0.5 centre). Holds between moves.
- `spots`: `{ from, to, targets: [..] }`. Dims everything but the named boxes.
- `cursorOn`: `[from, to]`. `clicks`: film times of click rings (match the `click` actions).
- `fileCard`: `{ from, to, img: [..] }`. Thumbnails from `public/` the cursor carries to the drop
  zone; several fan out as a bundle.

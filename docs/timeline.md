# Timeline

Each film has one file, `timelines/<id>.json`. The file name is the film id. All times are
seconds on the film's clock. A key `_` anywhere holds a comment.

A full example is in the skill: `plugins/demo-film/skills/demo-film/examples/todo-list/timeline.json`.

## Frame

| Field | Meaning |
|---|---|
| `fps` | Frames per second. Use 30. |
| `width`, `height` | 1920 and 1080. |
| `duration` | The length of the film, in seconds. |
| `recStart`, `recEnd` | The film times when the recording starts and stops. Start at `screenIn` or just before it. |
| `screenIn` | The app screen scales in, after the opening cards. |
| `screenOut` | The app screen recedes, before the end card. |
| `endCard` | The end card fades in. |

## Words

| Field | Meaning |
|---|---|
| `cards` | Text-only cards: `{ "from", "to", "lines": [...], "accent" }`. `accent` is the index of the line in the accent colour. A card from 0 shows on the first frame. A card that starts after `screenIn` is a closing card, after the screen recedes. |
| `callouts` | Captions in a glass panel at the lower left: `{ "from", "to", "title", "sub" }`. One at a time. `sub` is optional. |
| `end` | The end card text: `{ "line", "url" }`. Both are optional. |

Each card and caption needs 1 second plus 0.3 seconds a word on screen. Run `pnpm pace <id>
--write` to fix the short ones.

## The app

`app` holds what the capture needs. The film does not use it.

| Field | Meaning |
|---|---|
| `base` | The app's address, for example `https://app.example.com`. The `BASE` variable overrides it. Required. |
| `start` | The first page after sign-in, for example `/dashboard`. |
| `permission` | One sentence: why you can film this app. Required. The capture stops without it. |
| `login` | The sign-in mode. See [Sign-in](sign-in.md). |
| `query` | Text added to every address that the capture opens, for example `"lang=en"`. |
| `colorScheme` | `"light"` (default) or `"dark"`. |
| `localStorage` | Keys that the app reads when it loads: `{ "theme": "light" }`. |
| `files` | Files to drop onto the app: `{ "invoice": "files/invoice.pdf" }`. Paths are from the film project. |
| `hideCss`, `textFixes` | Masks for things that must not show. See [Privacy](privacy.md). |
| `setup`, `teardown` | Steps before and after the recording. See below. |

### Setup and teardown

`setup` runs before the recording, off camera. Use it to open the right page, close a cookie
banner, load each page one time so that it is fast on camera, and put the cursor at its start
point. `teardown` runs after the recording. Use it to remove the test record that the film made.

Each step is `{ "do": "<step>", ... }`:

| Step | Fields | What it does |
|---|---|---|
| `goto` | `path` | Opens a page. |
| `click` | `sel` | Clicks an element. |
| `clickIf` | `sel` | Clicks an element only if it is visible, for example a cookie banner. |
| `waitFor` | `sel` | Waits until an element shows. |
| `waitUrl` | `path` | Waits until the page path starts with `path`. |
| `wait` | `ms` | Waits that many milliseconds. |
| `type` | `sel`, `text` | Fills a field at once. |
| `press` | `key` | Presses a key, for example `Enter`. |
| `switch` | `sel`, `on` | Sets a switch to on (`true`) or off (`false`). |
| `closeAll` | `sel` | Clicks every element that matches, for example the close button of each tab. |
| `mouse` | `to: [x, y]` | Puts the cursor at a point. The recording starts with the cursor there. |

Default setup: open `start`. Default teardown: nothing.

Note: Each capture starts in a new browser with only the saved sign-in. Data in the app itself
stays. If the film adds a record, remove it in `teardown`, or the next capture shows it twice.

## Targets

A target is an element that the film frames, points at or lights up. The capture measures its
box on the live page at the time `at`.

```json
"targets": {
  "save": { "sel": "button[data-testid=save]", "at": 12.0 },
  "total": { "sel": ["#subtotal", "#total"], "at": 20.0 }
}
```

`sel` is one selector or a list. For a list, the box covers all of them. `at` must come before
the first step, camera move or spotlight that uses the target.

### Selectors

A selector tells the capture which element to use. Use the most stable one that you can find:

1. A test id: `[data-testid="save"]`.
2. An id: `#save-button`.
3. A name or a label: `input[name="email"]`, `[aria-label="Search"]`.
4. Visible text: `button:has-text("Save")`.
5. A class name: `.btn-primary`. Use this last, because class names change often.

### Find selectors with `pnpm inspect`

1. Run `pnpm inspect <id> <path>`, for example `pnpm inspect new-invoice /invoices`.
2. Open `out/inspect.png` to see the page as the capture sees it.
3. Open `out/inspect.json`. Each entry has a `sel`, the element type, its text and its box
   `[x, y, width, height]`.

## Actions

Actions are the steps on camera. Each one happens at the film time `t`.

| Type | Fields | What it does |
|---|---|---|
| `mouseTo` | `target` (with `px`, `dx`, `dy`) or `to: [x, y]`, `dur` | Moves the mouse over `dur` seconds. `px` is the distance from the target's left edge. |
| `click` | `target` (a label only) | Clicks where the mouse is. |
| `type` | `sel`, `text`, `dur`, `select` | Types the text over `dur` seconds. `select: true` replaces the text that is there. |
| `press` | `key` | Presses a key: `Enter`, `Tab`, `Escape`. |
| `waitFor` | `sel` | Waits until an element shows. The wait is cut from the film, so a slow app does not slow the film. |
| `dragOver`, `drop` | `target`, `file` | Drags a file from `app.files` onto a drop zone. `file` can be a list. |
| `scrollBottom` | `sel`, `dur` | Scrolls a container to the bottom. |
| `scrollTo` | `sel`, `to`, `top`, `dur` | Scrolls container `sel` until element `to` is `top` pixels from the container's top. |

Put a `waitFor` after each step that loads a page or makes the app work.

## Direction

| Field | Meaning |
|---|---|
| `camera` | Camera moves: `{ "start", "end", "zoom", "target", "fy" }`. `target` is a point, a target name or a list of names. `zoom` is from 1.0 to about 1.65. `fy` sets the vertical position in the target (0.5 is the middle). The camera holds between moves. |
| `spots` | Spotlights: `{ "from", "to", "targets": [...] }`. The rest of the screen gets darker. |
| `cursorOn` | `[from, to]`: when the large cursor shows. |
| `clicks` | The film times of the click rings. Use the same times as the `click` actions. |
| `fileCard` | `{ "from", "to", "img": [...] }`: thumbnails from `public/` that the cursor carries to a drop zone. |

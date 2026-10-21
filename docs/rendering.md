# Rendering

A render turns the recording and the timeline into an MP4 file. You can render as often as you
want. A render does not touch the app.

## Draft, film, still, sheet

| Command | Output | Size | Use it for |
|---|---|---|---|
| `pnpm draft <id>` | `out/<id>-draft.mp4` | 1280x720 | Fast review of story and rhythm |
| `pnpm render <id>` | `out/<id>.mp4` | 1920x1080, H.264 | The final film |
| `pnpm still <id> <sec>` | `out/<id>-<sec>.png` | 1920x1080 | One frame, for example to check the end card |
| `pnpm sheet <id> [every]` | `out/<id>-sheet.png` | a grid | One frame every 2 seconds, to check the whole film quickly |
| `pnpm studio` | a browser tab | | Play every film, move frame by frame |

A draft takes about 1 minute for a 30-second film. A final film takes about 1 to 3 minutes.

## When to record again

| You changed | Do this |
|---|---|
| The words on a card or caption | Render again |
| The camera, a spotlight, the cursor times | Render again |
| `brand.json` | Render again |
| The length of a card or caption (`pnpm pace --write`) | Record again, then render: the steps moved |
| The opening cards only, and they got longer | `pnpm shift <id> <sec>`, then render |
| A step (click, type, scroll) | Record again, then render |
| The app itself | `pnpm check-films <id>`, fix the timeline, record again, render |

## The output

- Format: MP4, H.264, 1920x1080, 30 frames a second, no sound.
- Size: about 2 to 5 MB for 30 seconds.
- Place: `out/` in the film project. The folder is not in git.

The film plays in every browser, in PowerPoint and Keynote, and on LinkedIn and YouTube.

## Quality settings

The render settings are in `scripts/film.cjs`. The final film uses `--crf=16` (high quality).
A lower number gives a larger file and a better picture.

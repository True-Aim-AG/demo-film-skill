# How it works

The skill records the real app one time, then directs the film from that recording. This is
"record once, direct in post".

## The two parts

1. **The capture.** Playwright opens Chrome without a window, signs in, and does the steps of the
   film at the right seconds: move the mouse, click, type, scroll. It records every frame of the
   page at 3840x2160. It also logs the mouse path and the position of each element that the film
   frames.
2. **The film.** Remotion builds the film from the recording and the log. It adds the opening
   cards, the camera moves, the spotlight, a large cursor, the captions and the end card.

Because the cursor, the camera and the captions come from the log, they stay sharp and in sync.
A change of words or camera only needs a new render. A new recording is only necessary when the
steps or the app change.

## The film project

A film project is one folder for all the films of one app. Claude makes it from the skill's
`template/` folder.

```
my-app/
  brand.json            the look: brand or no brand
  plan.md               the brief and the storyboard of each film
  timelines/<id>.json   one file per film: words, steps, camera
  public/brand/         your logo and font files
  public/rec/<id>/      the recording of each film (not in git)
  out/                  drafts, films, stills and contact sheets (not in git)
  .auth/                the saved sign-in (not in git, never share it)
  capture/              the capture scripts
  src/                  the film engine (Remotion)
  scripts/              render, pace and shift helpers
```

## The timeline

Each film has one timeline file, `timelines/<id>.json`. The file name is the film id. The
timeline holds everything about the film:

- The app: the address, the start page, the sign-in mode and the setup steps.
- The words: the opening cards, the captions ("callouts") and the end line.
- The steps: where the mouse goes, what it clicks, what it types, and when.
- The direction: the camera moves, the spotlights and when the cursor shows.

All times are seconds on the film's clock. See [Timeline](timeline.md) for every field.

## The workflow that Claude follows

1. Check the tools, and install what is missing.
2. Ask: brand or no brand.
3. Ask for permission and a test account.
4. Write a short brief with you.
5. Make the film project and the sign-in.
6. Write the timeline and check it against the app.
7. Record and make a draft. You review story and rhythm.
8. Render the film, check every frame, and fix problems. You review the film.

You decide on the story, the words and the look. Claude does the technical work.

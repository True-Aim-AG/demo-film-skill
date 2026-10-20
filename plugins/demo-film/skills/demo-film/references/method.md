# Method: defaults and the review loop

The defaults below come from finished films. They are defaults, not laws. When the user wants
something different, do what they ask and write the new value into `plan.md` so it sticks.

## Who decides

The user owns story, words and taste. You own every technical step. The user speaks in plain
terms ("too fast", "drop that line", "make it calmer"); you translate that into the timeline.

| The user says | You change |
|---|---|
| "too fast" / "too slow" | holds on cards and callouts, typing `dur`, mouse `dur` |
| "too much going on" | split the beat, cut a callout, remove a spotlight |
| "this line is wrong" | the words in the timeline (and the storyboard in `plan.md`) |
| "warmer", "calmer", "more like us" | `brand.json` colours, then `src/look.ts` |
| "this jump is jarring" | camera move `start` and `end` (longer), fewer moves |

Confirm each change back in plain words ("I made the middle quicker, take a look"), never in
seconds or frame numbers.

## Two review points

1. **The draft** (`pnpm draft`): story, words and rhythm. Do not polish before the user agrees.
2. **The film** (`pnpm render`): the look and the details, with your critique first.

## Density

- At most 2 new things on screen at once. If a beat brings more, split it.
- One idea per callout. A callout names what the viewer sees, it does not repeat the screen.
- One payoff moment per film. Protect it with time and a spotlight.

## Motion

- Ease-out and ease-in-out only. No bounce, no spring, no elastic.
- Elements arrive with a small rise and fade, never a hard cut.
- Camera moves of 1.1 to 1.4 s, zoom at most 1.65. Hold between moves.
- No vendor title card before the first card. No fade to black at the end.

## Timing

- Reading time: 1 s plus 0.3 s a word on every card and callout (`pnpm pace`).
- Typing: about 12 to 16 characters a second reads as human.
- Zero dead air between beats: one beat hands off to the next.

## Review: the ranked critique

After each render, run `pnpm sheet <id>` and look at the contact sheet (and stills where it is
unclear). Write a short list for the user, ranked by impact per effort:

```
1. Callout covers the total, impact high, effort low
   Where: 18 s
   What: the glass panel hides the amount the callout names
   Fix: move the camera target up (fy 0.35)
```

Look for: a frame with real data, an element cut off by the zoom, a callout that hides what it
names, a beat that drags or rushes, a typo, a spotlight on the wrong box, a frozen screen, low
contrast. Keep it to the few points that matter. Fix the cheap high-impact ones, re-render, and
look at the new frame before you say a fix worked.

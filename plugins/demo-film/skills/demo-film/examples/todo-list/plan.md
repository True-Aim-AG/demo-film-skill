# To-do list film: plan

An example film that runs end to end on a public demo app, with no sign-in. Copy
`timeline.json` to `timelines/<id>.json` in a film project and replace the app, the words, the
targets and the actions.

## Brief

- **Audience.** Anyone who keeps a task list. They know to-do lists; they do not know this app.
- **The one thing to show.** You add a task in one line and tick it off in one click.
- **The case.** An empty list. Three tasks typed, the first ticked off, the "Active" filter.
- **Data.** Fictional tasks. Each capture starts in a fresh browser, so the list starts empty.
- **Permission.** Public demo site that the Playwright project publishes for browser testing.
- **Must not appear.** Nothing to hide. The site's own yellow "this is a demo" banner stays.
- **Length.** 32 s, silent, English.
- **Ending.** No brand: the end line and the url.

## Storyboard

| # | Time | On screen (words) | Camera and cursor |
|---|---|---|---|
| 1 | 0.0–6.2 | "Your week. One list." / "Add it. Tick it off. Nothing slips." | Type only |
| 2 | 6.0–10.7 | "Type a task." | Screen scales in, push in on the input, cursor clicks it, types |
| 3 | 10.7–15.0 | "Press Enter. It is on the list." | Two more tasks typed |
| 4 | 15.0–20.4 | "Done. Crossed off." | Push in on the list, tick the first task, spotlight it |
| 5 | 20.4–25.4 | "What is left." / "Two tasks open." | Click "Active", spotlight the open tasks |
| 6 | 25.4–27.6 | none | Pull back, screen recedes |
| 7 | 27.6–32.0 | "Made with demo-film." / url | End card |

## Film-only adjustments

None.

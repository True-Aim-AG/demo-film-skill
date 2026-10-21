# Privacy

A film travels. People forward it, post it and play it in meetings. Everything on screen
becomes public. These rules keep real data out of every film.

## Rule 1: you must have permission

Film only an app that you own, or whose owner agreed to the film. The timeline records this in
one sentence, `app.permission`. The capture stops if the field is empty.

```json
"permission": "We own this app. Approved by the product team on 3 November 2026."
```

## Rule 2: film fake data only

1. Make a test account on the app.
2. Fill it with fake data: fake names, fake companies, fake amounts, fake documents.
3. Sign in with that account only. See [Sign-in](sign-in.md).

WARNING: Do not film real customer data, even blurred or for a short time.
A paused video shows every frame clearly.

## Rule 3: mask what is still real

Some real things can still show on a test account: your own name in the header, a support chat
widget, a count of notifications, a real company name in a footer. Mask them with one of two
timeline fields.

### `hideCss`: hide an element

A list of CSS rules that the capture adds to every page:

```json
"hideCss": [
  "#intercom-container { display: none !important }",
  ".user-menu .name { visibility: hidden !important }"
]
```

Use `display: none` to remove an element. Use `visibility: hidden` to keep its space but hide
it.

### `textFixes`: replace text

A list of pairs, `[from, to]`. The capture replaces the text on every page, also text that
arrives later:

```json
"textFixes": [
  ["Andrea Muster", "Alex Example"],
  ["Real Company AG", "Example Ltd"]
]
```

## Rule 4: check every frame

1. Render the film.
2. Run `pnpm sheet <id> 1` for a contact sheet with one frame every second.
3. Look at each frame for real names, numbers, addresses and documents.
4. If you find one, mask it, record again and check again.

Claude does this check before it gives you the film. Do your own check too.

## Write down each mask

List each `hideCss` and `textFixes` entry in `plan.md`, under "Film-only adjustments", with
the reason. Then the next person knows why the film does not show exactly the app.

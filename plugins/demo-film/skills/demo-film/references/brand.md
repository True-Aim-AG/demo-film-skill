# Brand: `brand.json`

One file at the film project's root sets the look. Files it names live under `public/`.

```json
{
  "mode": "custom",
  "name": "Example Ltd",
  "logo": "brand/logo.svg",
  "colors": { "ground": "#F7F5F0", "ink": "#111827", "inkSoft": "#374151", "accent": "#0F766E" },
  "font": { "file": "brand/font.woff2", "family": "Example Sans" }
}
```

| Key | Meaning |
|---|---|
| `mode` | `"none"`: neutral look, no logo, Inter. `"custom"`: the keys below apply. |
| `name` | Shown on the end card when there is no logo file. |
| `logo` | SVG (best) or PNG under `public/`, the version for a light background. Small top left on the cards, large on the end card. Empty: no logo. |
| `colors.ground` | Background of the cards, the end card and the callout glass. Light. |
| `colors.ink` | Titles and the cursor. Dark, with strong contrast on `ground`. |
| `colors.inkSoft` | Callout sub lines. |
| `colors.accent` | The one accent: the highlighted card line, cursor halo, click ring, spotlight edge, callout bar, end-card url. |
| `font.file` | A font file under `public/` (woff2, woff, ttf, otf). Empty: Inter. |
| `font.family` | Any name for that font. |

## Getting the brand from the user

1. Ask for the logo file and the brand colours (hex codes). A brand guide PDF or the company
   website is enough: read the colours from it.
2. If the user has neither, run `pnpm brand <url>` on the app or the company website. It prints a
   proposal, saves `out/brand-page.png` and downloads logo candidates to `out/brand/`. The
   guesses can be wrong: check them against the screenshot, then show the user the logo and the
   four colours and ask "Is this right?".
3. Copy the chosen logo to `public/brand/` and fill `brand.json`.

## Checks

- `ink` on `ground` needs a contrast ratio of 4.5 or more. A light logo on a light ground is
  invisible: ask for the dark version.
- The font needs weights 500 and 600, or one variable file. Use the font only with the owner's
  licence for video. If in doubt, keep Inter.
- After a change, run `pnpm still <id> 2` and `pnpm still <id> <end second>` and look at both.

# Brand

The file `brand.json` in the film project sets the look of every film in that project. Claude
asks "brand or no brand" first and fills the file.

## No brand

```json
{ "mode": "none" }
```

The film uses a neutral look: a light grey ground, dark text, one blue accent and the Inter
font. There is no logo. The end card shows the end line only.

## Your brand

```json
{
  "mode": "custom",
  "name": "Example Ltd",
  "logo": "brand/logo.svg",
  "colors": { "ground": "#F7F5F0", "ink": "#111827", "inkSoft": "#374151", "accent": "#0F766E" },
  "font": { "file": "brand/font.woff2", "family": "Example Sans" },
  "poweredBy": true
}
```

| Field | Meaning |
|---|---|
| `mode` | `"none"` or `"custom"`. |
| `name` | The company name. The end card shows it when there is no logo file. |
| `logo` | The logo file, under `public/`. Use SVG if you have it, else PNG. Use the version for a light background. The logo shows small at the top left of the cards and large on the end card. |
| `colors.ground` | The background of the cards, the end card and the captions. Use a light colour. |
| `colors.ink` | The titles and the cursor. Use a dark colour. |
| `colors.inkSoft` | The second line of a caption. |
| `colors.accent` | The one accent colour: a highlighted line, the cursor halo, the click ring, the spotlight edge, the caption bar. |
| `font.file` | A font file under `public/` (woff2, woff, ttf or otf). Leave it empty to use Inter. |
| `font.family` | A name for that font. Any name is correct. |
| `poweredBy` | See below. |

### Where the brand comes from

1. Give Claude your logo file and your brand colours (hex codes, for example `#0F766E`). A brand
   guide PDF or your website is enough.
2. If you do not have them, Claude runs `pnpm brand <url>` on your app or website. It finds the
   colours, the font and logo candidates. Claude shows you the result and asks if it is correct.

### Rules for a good result

- The text colour (`ink`) must have strong contrast on the ground colour, a ratio of 4.5 or more.
- A white logo on a light ground is not visible. Give the dark version.
- Use a font only if your font licence allows its use in a video. If you are not sure, keep Inter.

## The "Powered by True Aim" mark

By default, the end card shows a small "Powered by" mark with the True Aim logo, at the lower
right. It shows in both modes. It is small and does not compete with your logo.

To remove the mark, set this field in `brand.json`:

```json
"poweredBy": false
```

Then render the film again. No new recording is necessary.

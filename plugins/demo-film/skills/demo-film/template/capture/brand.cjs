// Read the brand off the app's own page: colours, font and logo candidates.
//
//   pnpm brand <url> [<id>]
//
// Prints a brand.json proposal and saves out/brand-page.png (what the page looked like) plus
// every logo candidate it can download to out/brand/. With <id>, it uses that timeline's saved
// sign-in (pnpm login). Nothing is written to brand.json: you pick, then edit it. The guesses can
// be wrong (white text on a dark hero reads as "ink"): check them against the screenshot.
const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const [url, id] = process.argv.slice(2);
if (!url) { console.error("usage: pnpm brand <url> [<id>]"); process.exit(1); }
let state;
if (id) {
  const app = JSON.parse(fs.readFileSync(path.join(ROOT, "timelines", `${id}.json`), "utf8")).app || {};
  const f = path.join(ROOT, ".auth", `${(app.login || {}).state || "session"}.json`);
  if (fs.existsSync(f)) state = f;
}

(async () => {
  const OUT = path.join(ROOT, "out", "brand");
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...(state ? { storageState: state } : {}) });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  await page.screenshot({ path: path.join(ROOT, "out", "brand-page.png") });
  const found = await page.evaluate(() => {
    const css = (el, k) => (el ? getComputedStyle(el)[k] : "");
    const hex = (c) => {
      const m = (c || "").match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);
      if (!m || (m[4] !== undefined && Number(m[4]) === 0)) return null;
      return "#" + [m[1], m[2], m[3]].map((v) => Math.round(Number(v)).toString(16).padStart(2, "0")).join("").toUpperCase();
    };
    // The accent: the most common saturated background among buttons and links.
    const count = {};
    for (const el of document.querySelectorAll("button, a, [role=button], header, nav")) {
      for (const k of ["backgroundColor", "color"]) {
        const h = hex(css(el, k));
        if (!h) continue;
        const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
        if (Math.max(r, g, b) - Math.min(r, g, b) < 40) continue; // grey, not an accent
        count[h] = (count[h] || 0) + (k === "backgroundColor" ? 2 : 1);
      }
    }
    const accents = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([h]) => h);
    const logos = [...document.querySelectorAll("img, svg, link[rel*=icon]")].filter((el) => {
      const s = `${el.getAttribute("alt") || ""} ${el.getAttribute("class") || ""} ${el.getAttribute("src") || el.getAttribute("href") || ""} ${el.id}`;
      return /logo|brand|icon/i.test(s) || el.closest("header, nav, [class*=logo]");
    }).slice(0, 8).map((el) => el.tagName === "svg" ? { svg: el.outerHTML } : { src: el.src || el.href });
    return {
      ground: hex(css(document.body, "backgroundColor")) || "#FFFFFF",
      ink: hex(css(document.querySelector("h1, h2") || document.body, "color")) || hex(css(document.body, "color")),
      inkSoft: hex(css(document.querySelector("p") || document.body, "color")),
      accents,
      font: css(document.body, "fontFamily"),
      logos,
    };
  });
  const files = [];
  for (const [i, l] of found.logos.entries()) {
    try {
      if (l.svg) { const f = path.join(OUT, `logo-${i}.svg`); fs.writeFileSync(f, l.svg); files.push(f); continue; }
      const r = await ctx.request.get(l.src);
      if (!r.ok()) continue;
      const type = r.headers()["content-type"] || "";
      const ext = type.includes("svg") ? "svg" : type.includes("icon") ? "ico" : type.includes("jpeg") ? "jpg" : type.includes("webp") ? "webp" : "png";
      const f = path.join(OUT, `logo-${i}.${ext}`); fs.writeFileSync(f, await r.body()); files.push(f);
    } catch {}
  }
  await browser.close();
  console.log(JSON.stringify({
    colors: { ground: found.ground, ink: found.ink, inkSoft: found.inkSoft || found.ink, accent: found.accents[0] || null },
    otherAccents: found.accents.slice(1),
    pageFont: found.font,
    logoFiles: files.map((f) => path.relative(ROOT, f)),
    screenshot: "out/brand-page.png",
  }, null, 2));
})().catch((e) => { console.error(e.message || e); process.exit(1); });

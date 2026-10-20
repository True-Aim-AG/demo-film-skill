// Look at one page of the app the way the capture sees it, to write targets and actions.
//
//   pnpm inspect <id> [<path>]
//
// Signs in as the timeline says (app.login), opens <path> (default app.start) at 1920x1080 and
// writes out/inspect.png (the page) and out/inspect.json: every visible button, link, input and
// heading with its box and a selector to use. Nothing is recorded.
const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const [id, where] = process.argv.slice(2);
const TL_FILE = path.join(ROOT, "timelines", `${id}.json`);
if (!id || !fs.existsSync(TL_FILE)) { console.error("usage: pnpm inspect <id> [<path>]"); process.exit(1); }
const APP = JSON.parse(fs.readFileSync(TL_FILE, "utf8")).app || {};
const LOGIN = APP.login || { type: "none" };
const BASE = (process.env.BASE || APP.base || "").replace(/\/$/, "");
if (!BASE) { console.error("Set BASE or app.base"); process.exit(1); }
const AUTH = path.join(ROOT, ".auth", `${LOGIN.state || "session"}.json`);

(async () => {
  fs.mkdirSync(path.join(ROOT, "out"), { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 }, colorScheme: APP.colorScheme || "light",
    ...(LOGIN.type === "saved" && fs.existsSync(AUTH) ? { storageState: AUTH } : {}),
  });
  const page = await ctx.newPage();
  if (LOGIN.type === "form") {
    if (!process.env.FILM_USER || !process.env.FILM_PASSWORD) throw new Error("Set FILM_USER and FILM_PASSWORD");
    await page.goto(BASE + (LOGIN.url || "/"), { waitUntil: "networkidle", timeout: 120000 });
    await page.fill(LOGIN.user || 'input[type="email"]', process.env.FILM_USER);
    await page.fill(LOGIN.password || 'input[type="password"]', process.env.FILM_PASSWORD);
    await page.click(LOGIN.submit || 'button[type="submit"]');
    await page.waitForLoadState("networkidle");
  }
  await page.goto(BASE + (where || APP.start || "/"), { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ROOT, "out", "inspect.png") });
  const els = await page.evaluate(() => {
    const q = (s) => (window.CSS && CSS.escape ? CSS.escape(s) : s);
    const selOf = (el) => {
      for (const a of ["data-testid", "data-test", "data-cy", "id", "name", "aria-label"]) {
        const v = el.getAttribute(a);
        if (v) return a === "id" ? `#${q(v)}` : `[${a}="${v.replace(/"/g, '\\"')}"]`;
      }
      const text = (el.innerText || "").trim().split("\n")[0].slice(0, 40);
      if (text && /^(A|BUTTON)$/.test(el.tagName)) return `${el.tagName.toLowerCase()}:has-text("${text.replace(/"/g, '\\"')}")`;
      const cls = [...el.classList].filter((c) => !/\d{3,}|^css-|^sc-/.test(c)).slice(0, 2);
      return el.tagName.toLowerCase() + cls.map((c) => "." + q(c)).join("");
    };
    return [...document.querySelectorAll("a, button, input, textarea, select, [role=button], [role=tab], [role=link], h1, h2, h3, label, [data-testid]")]
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0)
      .slice(0, 300)
      .map(({ el, r }) => ({
        sel: selOf(el), tag: el.tagName.toLowerCase(), text: (el.innerText || el.value || el.placeholder || "").trim().split("\n")[0].slice(0, 60),
        box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      }));
  });
  fs.writeFileSync(path.join(ROOT, "out", "inspect.json"), JSON.stringify(els, null, 1));
  console.log(`${page.url()}: ${els.length} elements. See out/inspect.png and out/inspect.json`);
  await browser.close();
})().catch((e) => { console.error(e.message || e); process.exit(1); });

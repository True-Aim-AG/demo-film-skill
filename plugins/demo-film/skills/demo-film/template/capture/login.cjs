// Sign in to the app once, by hand, and save the session for the captures.
//
//   BASE=https://app.example.com pnpm login <id>
//
// Opens a visible Chrome window on the app. You sign in as you always do: password, Microsoft or
// Google SSO, MFA code, passkey. The session (cookies, local storage, IndexedDB) is saved to
// .auth/<app.login.state or "session">.json every 2 s. The script ends when you close the window,
// or by itself once `app.login.signedIn` (a selector only a signed-in page has) shows.
//
// .auth/ is in .gitignore: the file is a live session in the app. Never commit or share it.
// Sign in with a test account that holds fake data only.
const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ID = process.argv[2];
const TL_FILE = path.join(ROOT, "timelines", `${ID}.json`);
if (!ID || !fs.existsSync(TL_FILE)) {
  console.error("usage: pnpm login <id>   (the timeline gives the app address and start page)");
  process.exit(1);
}
const APP = JSON.parse(fs.readFileSync(TL_FILE, "utf8")).app || {};
const LOGIN = APP.login || {};
const BASE = (process.env.BASE || APP.base || "").replace(/\/$/, "");
if (!BASE) { console.error("Set the app's address: BASE=https://... pnpm login <id>, or app.base in the timeline"); process.exit(1); }
const AUTH = path.join(ROOT, ".auth", `${LOGIN.state || "session"}.json`);

(async () => {
  fs.mkdirSync(path.dirname(AUTH), { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: false, args: ["--window-size=1400,900"] });
  const ctx = await browser.newContext({ viewport: null });
  const page = await ctx.newPage();
  let saved = 0;
  const save = async () => {
    try { await ctx.storageState({ path: AUTH, indexedDB: true }); saved++; } catch {}
  };
  console.log("A Chrome window is open. Sign in to the app there, then close the window.");
  await page.goto(BASE + (APP.start || "/"), { timeout: 120000 }).catch(() => {});
  let done = false;
  browser.on("disconnected", () => { done = true; });
  page.on("close", () => { done = true; });
  while (!done) {
    await save();
    if (LOGIN.signedIn && (await page.locator(LOGIN.signedIn).first().isVisible().catch(() => false))) {
      await page.waitForTimeout(3000);
      await save();
      console.log("Signed in.");
      break;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  await browser.close().catch(() => {});
  if (!saved) throw new Error("nothing was saved: sign in, wait a few seconds, then close the window");
  console.log(`Saved the sign-in to ${path.relative(ROOT, AUTH)}. Set app.login.type to "saved" in the timeline.`);
})().catch((e) => { console.error(e.message || e); process.exit(1); });

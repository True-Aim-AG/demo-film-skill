// Record one film's take from the live app, on the film's clock.
//
//   BASE=https://app.example.com pnpm capture <id>
//
// Reads timelines/<id>.json. Signs in (`app.login`), runs `app.setup` off camera (warm-up,
// settings), then performs `actions` at their film times, measures `targets` just before they are
// needed, and writes public/rec/<id>/: every repainted frame (Chrome DevTools screencast,
// 3840x2160), events.json (frame times, mouse path, element rects, sync cuts) and recording.mp4
// (60 fps, CFR). Runs `app.teardown` afterwards.
//
// Sign-in, `app.login.type`:
//   "none"   the app needs no sign-in (default).
//   "saved"  reuse the session that `pnpm login` saved in .auth/ (any sign-in: SSO, MFA, passkeys).
//   "form"   fill a sign-in form with FILM_USER and FILM_PASSWORD from the environment.
//
// `--check` (pnpm check-films) runs the same sign-in and setup, then walks the actions without
// recording or waiting on the film's clock: every target must resolve and every waitFor must
// succeed. It writes nothing under public/rec and prints one line: ok, or what drifted.
//
// Never write a password into a timeline or any other file in the project.
const { chromium } = require("playwright-core");
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ID = process.argv[2];
const CHECK = process.argv.includes("--check");
const TL_FILE = path.join(ROOT, "timelines", `${ID}.json`);
if (!ID || !fs.existsSync(TL_FILE)) {
  const films = fs.readdirSync(path.join(ROOT, "timelines")).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
  console.error(`usage: pnpm capture <id>   films: ${films.join(", ") || "none"}`);
  process.exit(1);
}
const TL = JSON.parse(fs.readFileSync(TL_FILE, "utf8"));
const APP = TL.app || {};
// The take is written next to the last good one and replaces it only when it succeeds.
const DEST = path.join(ROOT, "public/rec", ID);
const OUT = DEST + ".take";
const FRAMES = path.join(OUT, "frames");
const BASE = (process.env.BASE || APP.base || "").replace(/\/$/, "");
if (!BASE) { console.error("Set the app's address: BASE=https://... pnpm capture <id>, or app.base in the timeline"); process.exit(1); }
const LOGIN = APP.login || { type: "none" };
const AUTH = path.join(ROOT, ".auth", `${LOGIN.state || "session"}.json`);
const FILES = Object.fromEntries(Object.entries(APP.files || {}).map(([k, p]) => [k, path.resolve(ROOT, p)]));

// `app.hideCss` hides what must not be filmed (a real name, a notification badge, a chat widget);
// `app.textFixes` replaces text on screen. Both are listed in plan.md with their reason.
const HIDE_CSS = (APP.hideCss || []).join("\n");
const TEXT_FIXES = APP.textFixes || [];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const withQuery = (p) => (APP.query ? p + (p.includes("?") ? "&" : "?") + APP.query : p);

// On failure, a screenshot of what the browser saw lands in public/rec/<id>.take/failure.png
// (out/<id>-check.png in check mode).
let failShot = async () => {};
// In check mode a failure names the step that drifted.
let step = "sign-in";

(async () => {
  if (!APP.permission) throw new Error("app.permission is empty: write down why you may film this app (you own it, or its owner agreed) before the first take");
  if (!["none", "saved", "form"].includes(LOGIN.type)) throw new Error(`unknown app.login.type: ${LOGIN.type}`);
  if (LOGIN.type === "saved" && !fs.existsSync(AUTH)) throw new Error(`no saved sign-in at ${path.relative(ROOT, AUTH)}: run pnpm login ${ID} first`);
  if (LOGIN.type === "form" && (!process.env.FILM_USER || !process.env.FILM_PASSWORD)) throw new Error("Set FILM_USER and FILM_PASSWORD in the environment (never in a file)");
  for (const [k, f] of Object.entries(FILES)) if (!fs.existsSync(f)) throw new Error(`file ${k} not found: ${f}`);
  if (CHECK) fs.mkdirSync(path.join(ROOT, "out"), { recursive: true });
  else {
    fs.rmSync(OUT, { recursive: true, force: true });
    fs.mkdirSync(FRAMES, { recursive: true });
  }

  // Device scale 2 comes from the browser, not page emulation: the DevTools screencast ignores an
  // emulated scale and would deliver 1920-wide frames. The window is then sized to a 1920x1080 page.
  const browser = await chromium.launch({
    channel: "chrome", headless: true,
    args: [`--window-size=${TL.width},${TL.height}`, "--force-device-scale-factor=2"],
  });
  const ctx = await browser.newContext({
    viewport: null, colorScheme: APP.colorScheme || "light", reducedMotion: "no-preference",
    ...(LOGIN.type === "saved" ? { storageState: AUTH } : {}),
  });
  await ctx.addInitScript(({ css, fixes, store }) => {
    // `app.localStorage`: keys the app reads on load (a theme, a dismissed banner), set before it starts.
    for (const [k, v] of Object.entries(store)) try { localStorage.setItem(k, v); } catch {}
    const add = () => { const s = document.createElement("style"); s.textContent = css; document.documentElement.appendChild(s); };
    if (document.documentElement) add(); else document.addEventListener("DOMContentLoaded", add);
    if (!fixes.length) return;
    const fix = (node) => {
      const w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode())
        for (const [from, to] of fixes) if (n.nodeValue.includes(from)) n.nodeValue = n.nodeValue.split(from).join(to);
    };
    new MutationObserver((ms) => ms.forEach((m) => { m.addedNodes.forEach((n) => fix(n.nodeType === 3 ? n.parentNode || document.body : n)); if (m.type === "characterData") fix(m.target.parentNode); }))
      .observe(document, { childList: true, subtree: true, characterData: true });
  }, { css: HIDE_CSS, fixes: TEXT_FIXES, store: APP.localStorage || {} });
  // Chrome's screencast sends a frame only when the compositor draws, and on a quiet page it can go
  // silent for seconds while the DOM changes (seen: a result card missed for 5 s after a waitFor).
  // A 1 px, near-transparent square that changes every animation frame keeps it drawing. Invisible:
  // at most one level of one channel on one pixel.
  if (!CHECK) await ctx.addInitScript(() => {
    const go = () => {
      const d = document.createElement("div");
      d.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;opacity:0.004;pointer-events:none;z-index:2147483647;background:#000";
      document.documentElement.appendChild(d);
      let k = 0;
      const tick = () => { k ^= 1; d.style.opacity = k ? "0.004" : "0.005"; requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    };
    if (document.documentElement) go(); else document.addEventListener("DOMContentLoaded", go);
  });
  const page = await ctx.newPage();
  failShot = () => page.screenshot({ path: CHECK ? path.join(ROOT, "out", `${ID}-check.png`) : path.join(OUT, "failure.png") });
  {
    const cdp0 = await ctx.newCDPSession(page);
    const { windowId } = await cdp0.send("Browser.getWindowForTarget");
    for (let i = 0; i < 3; i++) {
      const [iw, ih] = await page.evaluate(() => [innerWidth, innerHeight]);
      if (iw === TL.width && ih === TL.height) break;
      const { bounds } = await cdp0.send("Browser.getWindowBounds", { windowId });
      await cdp0.send("Browser.setWindowBounds", { windowId, bounds: { width: bounds.width + TL.width - iw, height: bounds.height + TL.height - ih } });
      await page.waitForTimeout(200);
    }
    const [iw, ih, dpr] = await page.evaluate(() => [innerWidth, innerHeight, devicePixelRatio]);
    if (iw !== TL.width || ih !== TL.height || dpr !== 2) throw new Error(`page is ${iw}x${ih} at ${dpr}x, wanted ${TL.width}x${TL.height} at 2x`);
  }

  // Sign in. A cold server can take 30 s and more per route: navigation off camera gets two minutes.
  const start = APP.start || "/";
  if (LOGIN.type === "form") {
    // The sign-in page often redirects (?next=..., an identity provider), so wait on the pathname.
    await page.goto(BASE + withQuery(LOGIN.url || "/"), { waitUntil: "networkidle", timeout: 120000 });
    await page.fill(LOGIN.user || 'input[type="email"]', process.env.FILM_USER);
    await page.fill(LOGIN.password || 'input[type="password"]', process.env.FILM_PASSWORD);
    await page.click(LOGIN.submit || 'button[type="submit"]');
    const done = LOGIN.done || start;
    await page.waitForURL((u) => u.pathname.startsWith(done), { timeout: 120000 });
    await page.waitForLoadState("networkidle");
  }
  if (LOGIN.type === "saved") {
    // A saved session that has expired lands on a sign-in page instead of `start`.
    await page.goto(BASE + withQuery(start), { waitUntil: "networkidle", timeout: 120000 });
    if (LOGIN.signedIn) await page.waitForSelector(LOGIN.signedIn, { timeout: 30000 })
      .catch(() => { throw new Error(`the saved sign-in has expired: run pnpm login ${ID} again`); });
  }

  let mx = TL.width * 0.8, my = TL.height * 0.9;

  // Off-camera steps: `app.setup` before the take, `app.teardown` after it. Sequential, untimed.
  const offCamera = async (st) => {
    switch (st.do) {
      case "goto": await page.goto(BASE + withQuery(st.path), { waitUntil: "networkidle", timeout: 120000 }); break;
      case "click": await page.click(st.sel); break;
      case "waitFor": await page.waitForSelector(st.sel, { timeout: 120000 }); break;
      case "waitUrl": await page.waitForURL((u) => u.pathname.startsWith(st.path), { timeout: 120000 }); break;
      case "wait": await page.waitForTimeout(st.ms); break;
      case "switch": {
        // Set a switch to on or off, whichever way the component reports its state.
        const sw = page.locator(st.sel);
        const on = (await sw.getAttribute("aria-checked")) === "true" || (await sw.getAttribute("data-checked")) !== null;
        if (on !== st.on) { await sw.click(); await page.waitForTimeout(500); }
        break;
      }
      case "closeAll": for (const c of await page.locator(st.sel).all()) await c.click().catch(() => {}); break;
      case "type": await page.locator(st.sel).first().fill(st.text); break;
      case "press": await page.keyboard.press(st.key); break;
      // Click only if it is there: a cookie banner, a "what's new" dialog.
      case "clickIf": { const el = page.locator(st.sel).first(); if (await el.isVisible().catch(() => false)) await el.click(); break; }
      case "mouse": [mx, my] = st.to; await page.mouse.move(mx, my); break;
      default: throw new Error(`unknown setup step: ${JSON.stringify(st)}`);
    }
  };
  for (const st of APP.setup || [{ do: "goto", path: start }]) { step = `setup ${JSON.stringify(st)}`; await offCamera(st); }
  await page.mouse.move(mx, my);
  await page.waitForTimeout(1500);

  // Record.
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  let epoch0 = 0;
  if (!CHECK) cdp.on("Page.screencastFrame", async (f) => {
    const file = String(frames.length).padStart(5, "0") + ".jpg";
    fs.writeFileSync(path.join(FRAMES, file), Buffer.from(f.data, "base64"));
    frames.push({ file, ts: f.metadata.timestamp });
    cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  epoch0 = Date.now() / 1000;
  if (!CHECK) await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: TL.width * 2, maxHeight: TL.height * 2, everyNthFrame: 1 });
  // Raw time is wall clock since the take began; film time is raw minus any waits cut out at a
  // sync point (a `waitFor` action), so the app's own speed never drifts the timeline.
  const raw = () => TL.recStart + (Date.now() / 1000 - epoch0);
  const cuts = [];
  const toFilm = (r) => {
    let t = r;
    for (const c of cuts) { if (r >= c.to) t -= c.to - c.from; else if (r > c.from) return null; }
    return t;
  };
  const film = () => toFilm(raw()) ?? raw();
  // Check mode skips the film's clock but still lets a panel or scroll settle (up to 0.5 s a step),
  // or it clicks where a sliding panel's button was mid-animation.
  const until = async (t) => { const d = (t - film()) * 1000; if (d > 0) await sleep(CHECK ? Math.min(d, 500) : d); };

  const mouse = [[raw(), mx, my]];
  const rects = {};
  const actual = [];

  const rectOf = async (sel) => {
    const sels = Array.isArray(sel) ? sel : [sel];
    const rs = [];
    for (const s of sels) {
      const b = await page.locator(s).first().boundingBox().catch(() => null);
      if (b) rs.push(b);
    }
    if (!rs.length) return null;
    const x0 = Math.min(...rs.map((r) => r.x)), y0 = Math.min(...rs.map((r) => r.y));
    const x1 = Math.max(...rs.map((r) => r.x + r.width)), y1 = Math.max(...rs.map((r) => r.y + r.height));
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  };
  const pointOf = (name, a) => {
    const r = rects[name];
    if (!r) throw new Error(`target ${name} not measured before it was used`);
    return [r.x + (a.px ?? r.w / 2) + (a.dx ?? 0), r.y + r.h / 2 + (a.dy ?? 0)];
  };
  const selOf = (name) => {
    const tg = TL.targets[name];
    if (!tg) throw new Error(`unknown target ${name}`);
    return Array.isArray(tg.sel) ? tg.sel[0] : tg.sel;
  };
  const moveTo = async (x, y, dur) => {
    const sx = mx, sy = my, t0 = Date.now();
    const ms = dur * 1000;
    while (true) {
      const k = ms ? Math.min(1, (Date.now() - t0) / ms) : 1;
      mx = sx + (x - sx) * ease(k); my = sy + (y - sy) * ease(k);
      await page.mouse.move(mx, my);
      mouse.push([raw(), Math.round(mx * 10) / 10, Math.round(my * 10) / 10]);
      if (k >= 1) break;
      await sleep(12);
    }
  };
  // A file drag onto a drop zone, dispatched as DOM events: one file or a list dropped together.
  const dispatchDrag = async (types, fileKeys, sel) => {
    const files = (Array.isArray(fileKeys) ? fileKeys : [fileKeys]).map((k) => {
      if (!FILES[k]) throw new Error(`file ${k} is not in app.files`);
      return { b64: fs.readFileSync(FILES[k]).toString("base64"), name: path.basename(FILES[k]) };
    });
    await page.evaluate(({ types, files, sel }) => {
      const dt = new DataTransfer();
      for (const { b64, name } of files) {
        const bin = atob(b64); const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        dt.items.add(new File([bytes], name, { type: name.endsWith(".pdf") ? "application/pdf" : /\.jpe?g$/i.test(name) ? "image/jpeg" : /\.png$/i.test(name) ? "image/png" : "" }));
      }
      const el = document.querySelector(sel);
      if (!el) throw new Error(`drop target ${sel} not on the page`);
      for (const type of types) el.dispatchEvent(new DragEvent(type, { dataTransfer: dt, bubbles: true, cancelable: true }));
    }, { types, files, sel });
  };

  // One queue of timed steps: target measurements and actions, in film-time order.
  const steps = [
    ...Object.entries(TL.targets).map(([name, tg]) => ({ t: tg.at, kind: "measure", name, sel: tg.sel })),
    ...TL.actions.map((a) => ({ ...a, kind: "action" })),
  ].sort((a, b) => a.t - b.t);
  const moving = [];
  for (const s of steps) {
    await until(s.t);
    step = s.kind === "measure" ? `target ${s.name} at ${s.t}` : `${s.type} ${s.target ?? s.sel ?? ""} at ${s.t}`;
    if (s.kind === "measure" && CHECK) {
      // Nothing waits on the film's clock here, so give each selector time to appear. A box, not
      // Playwright's "visible": a zero-width SVG line is a fine target but never "visible".
      for (const sel of Array.isArray(s.sel) ? s.sel : [s.sel]) {
        const loc = page.locator(sel).first();
        const ok = await loc.waitFor({ state: "attached", timeout: 30000 }).then(() => loc.boundingBox(), () => null);
        if (!ok) throw new Error(`${sel} did not resolve`);
      }
    }
    if (s.kind === "measure") { rects[s.name] = await rectOf(s.sel); continue; }
    actual.push({ type: s.type, target: s.target ?? null, planned: s.t, at: film() });
    if (s.type === "mouseTo") {
      const [x, y] = s.target ? pointOf(s.target, s) : s.to;
      if (CHECK) await moveTo(x, y, 0); else moving.push(moveTo(x, y, s.dur));
    } else if (s.type === "waitFor") {
      await page.waitForSelector(s.sel, { timeout: 30000 });
      const late = film() - s.t;
      if (late > 0) { const r = raw(); cuts.push({ from: r - late, to: r }); }
    } else if (s.type === "click") {
      await page.mouse.down(); await sleep(70); await page.mouse.up();
    } else if (s.type === "dragOver") {
      await dispatchDrag(["dragenter", "dragover"], s.file, selOf(s.target));
    } else if (s.type === "drop") {
      await dispatchDrag(["dragover", "drop"], s.file, selOf(s.target));
    } else if (s.type === "scrollBottom") {
      await page.evaluate(({ sel, ms }) => new Promise((done) => {
        const el = document.querySelector(sel); const from = el.scrollTop; const to = el.scrollHeight - el.clientHeight;
        const e = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2); const t0 = performance.now();
        const step = (now) => { const k = Math.min(1, (now - t0) / ms); el.scrollTop = from + (to - from) * e(k); k < 1 ? requestAnimationFrame(step) : done(); };
        requestAnimationFrame(step);
      }), { sel: s.sel, ms: CHECK ? 1 : s.dur * 1000 });
    } else if (s.type === "scrollTo") {
      // Scroll container `sel` so element `to` has its top at `top` px, eased over `dur`.
      await page.evaluate(({ sel, to, top, ms }) => new Promise((done) => {
        const el = document.querySelector(sel); const t = document.querySelector(to);
        const from = el.scrollTop; const dest = from + t.getBoundingClientRect().top - top;
        const e = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2); const t0 = performance.now();
        const step = (now) => { const k = Math.min(1, (now - t0) / ms); el.scrollTop = from + (dest - from) * e(k); k < 1 ? requestAnimationFrame(step) : done(); };
        requestAnimationFrame(step);
      }), { sel: s.sel, to: s.to, top: s.top, ms: CHECK ? 1 : s.dur * 1000 });
    } else if (s.type === "type") {
      // Type `text` into `sel` over `dur` seconds; `select` replaces what is there.
      const el = page.locator(s.sel).first();
      if (s.select) await el.selectText();
      await el.pressSequentially(s.text, { delay: CHECK ? 0 : Math.round((s.dur * 1000) / Math.max(1, s.text.length)) });
    } else if (s.type === "press") {
      await page.keyboard.press(s.key);
    } else {
      throw new Error(`unknown action: ${JSON.stringify(s)}`);
    }
  }
  await Promise.all(moving);
  if (CHECK) {
    step = "teardown";
    for (const st of APP.teardown || []) await offCamera(st).catch(() => {});
    await browser.close();
    console.log(`ok ${ID}`);
    return;
  }
  await until(TL.recEnd);
  await cdp.send("Page.stopScreencast");
  await sleep(500);

  for (const st of APP.teardown || []) await offCamera(st).catch(() => {});
  await browser.close();

  // Frame times on the film clock, then a constant-rate 60 fps master.
  // A frame inside a cut is dropped, except the last one of each cut: it is what the page showed
  // when the wait ended, placed at the cut, so a page that is static afterwards is not stuck on the
  // picture from before the wait.
  const rawOf = (f) => TL.recStart + (f.ts - epoch0);
  const timed = [];
  frames.forEach((f, i) => {
    const r = rawOf(f);
    let t = toFilm(r);
    if (t === null) {
      const c = cuts.find((c) => r > c.from && r < c.to);
      if (i + 1 < frames.length && rawOf(frames[i + 1]) < c.to) return;
      t = toFilm(c.to);
    }
    if (t !== null && t <= TL.recEnd) timed.push({ file: f.file, t });
  });
  if (timed.length < 10) throw new Error(`only ${timed.length} frames captured`);
  const list = timed.map((f, i) => {
    const next = i + 1 < timed.length ? timed[i + 1].t : TL.recEnd;
    return `file 'frames/${f.file}'\nduration ${Math.max(0.001, next - f.t).toFixed(4)}`;
  }).join("\n") + `\nfile 'frames/${timed[timed.length - 1].file}'\n`;
  fs.writeFileSync(path.join(OUT, "frames.txt"), list);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", "frames.txt",
    "-vf", "fps=60,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "12", "recording.mp4"], { cwd: OUT });

  const mouseFilm = mouse.map(([r, x, y]) => [toFilm(r), x, y]).filter(([t]) => t !== null);
  const events = { videoStart: timed[0].t, recEnd: TL.recEnd, frames: timed.length, mouse: mouseFilm, rects, actual, cuts };
  fs.writeFileSync(path.join(OUT, "events.json"), JSON.stringify(events, null, 1));
  fs.rmSync(DEST, { recursive: true, force: true });
  fs.renameSync(OUT, DEST);
  const late = actual.filter((a) => a.at - a.planned > 0.15);
  console.log(`ok ${ID}: ${timed.length} frames, video starts at ${timed[0].t.toFixed(2)} s, ${Object.keys(rects).length} rects`);
  for (const c of cuts) console.log(`  sync: cut ${(c.to - c.from).toFixed(2)} s of waiting`);
  for (const a of late) console.log(`  late: ${a.type} ${a.target ?? ""} planned ${a.planned} at ${a.at.toFixed(2)}`);
  for (const [k, v] of Object.entries(rects)) if (!v) console.log(`  missing rect: ${k}`);
})().catch(async (e) => {
  if (CHECK) {
    console.log(`drift ${ID}: ${step}: ${String(e.message || e).split("\n")[0]}`);
    await failShot().catch(() => {});
    process.exit(1);
  }
  console.error(e);
  await failShot().then(() => console.error(`what the browser saw: ${path.join(OUT, "failure.png")}`)).catch(() => {});
  process.exit(1);
});

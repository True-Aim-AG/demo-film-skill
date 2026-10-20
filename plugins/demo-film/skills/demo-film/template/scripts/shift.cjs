// Move a film's screen part later or earlier without a new take:
//
//   node scripts/shift.cjs <id> <seconds>
//
// Every film-clock time from the screen part on moves by <seconds>: recStart, recEnd, screenIn,
// screenOut, endCard, duration, callouts, spots, camera, cursor, clicks, fileCard, targets and
// actions. Cards are left alone (they are rewritten by hand around the new screen times). The take in
// public/rec/<id>/events.json moves with it (videoStart, recEnd, the mouse path, the action log), so
// the cut stays in sync and a later re-capture of the shifted timeline lands at the same times.
// The raw-clock sync cuts in events.json are recording time, not film time, and do not move.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const [id, arg] = process.argv.slice(2);
const d = Number(arg);
const tlPath = path.join(ROOT, "timelines", `${id}.json`);
if (!id || !fs.existsSync(tlPath) || !Number.isFinite(d)) {
  console.error("usage: node scripts/shift.cjs <id> <seconds>");
  process.exit(1);
}
const r = (x) => Math.round((x + d) * 1000) / 1000;

const tl = JSON.parse(fs.readFileSync(tlPath, "utf8"));
for (const k of ["duration", "recStart", "recEnd", "screenIn", "screenOut", "endCard"]) tl[k] = r(tl[k]);
for (const c of tl.callouts) { c.from = r(c.from); c.to = r(c.to); }
for (const s of tl.spots) { s.from = r(s.from); s.to = r(s.to); }
for (const m of tl.camera) { m.start = r(m.start); m.end = r(m.end); }
tl.cursorOn = tl.cursorOn.map(r);
tl.clicks = tl.clicks.map(r);
if (tl.fileCard) { tl.fileCard.from = r(tl.fileCard.from); tl.fileCard.to = r(tl.fileCard.to); }
for (const t of Object.values(tl.targets ?? {})) if (typeof t.at === "number") t.at = r(t.at);
for (const a of tl.actions ?? []) if (typeof a.t === "number") a.t = r(a.t);
fs.writeFileSync(tlPath, JSON.stringify(tl, null, 2) + "\n");

const evPath = path.join(ROOT, "public/rec", id, "events.json");
if (fs.existsSync(evPath)) {
  const ev = JSON.parse(fs.readFileSync(evPath, "utf8"));
  const rr = (x) => x + d;
  ev.videoStart = rr(ev.videoStart);
  ev.recEnd = rr(ev.recEnd);
  ev.mouse = ev.mouse.map(([t, x, y]) => [rr(t), x, y]);
  for (const a of ev.actual ?? []) { a.planned = rr(a.planned); a.at = rr(a.at); }
  fs.writeFileSync(evPath, JSON.stringify(ev, null, 1));
  console.log(`${id}: timeline and take moved by ${d} s`);
} else {
  console.log(`${id}: timeline moved by ${d} s (no take yet)`);
}

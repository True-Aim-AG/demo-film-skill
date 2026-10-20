// Reading time: every card and callout stays on screen long enough to read, in proportion to its
// words. Run it after writing copy and before `pnpm capture`, because it moves the actions.
//
//   pnpm pace <id>            report only: which cards and callouts are short, by how much
//   pnpm pace <id> --write    lengthen them and save the timeline
//
// A short item gets extra hold inserted just before it ends: everything from that moment on
// (actions, targets, camera, spots, later words, the end card) moves later by the same amount,
// and the item and any spotlight or cursor span crossing that moment stretch with it. Nothing is
// ever shortened.
const fs = require("fs");
const path = require("path");

// Seconds on screen = BASE + PER_WORD x words (title plus sub, or every card line).
const BASE = 1.0;
const PER_WORD = 0.3;
// Hold is inserted this long before the item ends, so a screen or move that starts in the item's
// last moments (the screen scaling in under the last card) moves with it.
const LEAD = 0.3;

const ROOT = path.resolve(__dirname, "..");
const [id, flag] = process.argv.slice(2);
const file = path.join(ROOT, "timelines", `${id}.json`);
if (!id || !fs.existsSync(file)) {
  console.error("usage: pnpm pace <id> [--write]");
  process.exit(1);
}
const tl = JSON.parse(fs.readFileSync(file, "utf8"));

const words = (s) => (s ? s.split(/\s+/).filter(Boolean).length : 0);
const textOf = (it) => (it.lines ? it.lines.join(" ") : `${it.title} ${it.sub ?? ""}`);
const need = (it) => Math.round((BASE + PER_WORD * words(textOf(it))) * 10) / 10;
const r1 = (x) => Math.round(x * 100) / 100;

// Insert `d` seconds at film time `t`.
function insert(t, d) {
  const pt = (x) => (x >= t ? r1(x + d) : x);
  const span = (o, a, b) => { if (o[a] >= t) o[a] = r1(o[a] + d); if (o[b] >= t) o[b] = r1(o[b] + d); };
  for (const k of ["duration", "recStart", "recEnd", "screenIn", "screenOut", "endCard"]) if (k in tl) tl[k] = pt(tl[k]);
  for (const c of [...(tl.cards ?? []), ...(tl.callouts ?? []), ...(tl.spots ?? [])]) span(c, "from", "to");
  if (tl.fileCard) span(tl.fileCard, "from", "to");
  for (const c of tl.camera ?? []) span(c, "start", "end");
  for (const a of tl.actions ?? []) a.t = pt(a.t);
  for (const g of Object.values(tl.targets ?? {})) g.at = pt(g.at);
  if (tl.cursorOn) tl.cursorOn = tl.cursorOn.map(pt);
  if (tl.clicks) tl.clicks = tl.clicks.map(pt);
}

const items = [...(tl.cards ?? []).map((c) => ["card", c]), ...(tl.callouts ?? []).map((c) => ["callout", c])];
let added = 0;
for (const [kind, it] of items.sort((a, b) => a[1].from - b[1].from)) {
  const has = r1(it.to - it.from), want = need(it);
  const short = r1(want - has);
  if (short <= 0.05) continue;
  console.log(`${kind.padEnd(7)} ${has.toFixed(1)} s, needs ${want.toFixed(1)} s (+${short.toFixed(1)})  ${textOf(it)}`);
  // Each insert moves every later item, so the loop reads the live values.
  insert(r1(it.to - LEAD), short);
  added += short;
}
console.log(added ? `${id}: +${r1(added)} s, ${r1(tl.duration)} s in all` : `${id}: every card and callout has its reading time`);
if (added && flag === "--write") {
  fs.writeFileSync(file, JSON.stringify(tl, null, 2) + "\n");
  console.log(`wrote timelines/${id}.json: re-capture before rendering, the actions moved`);
}

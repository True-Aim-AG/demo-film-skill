// Render helpers, one film at a time. The film id is the timeline's file name in timelines/.
//
//   pnpm render <id>          out/<id>.mp4, 1920x1080 H.264, the cut
//   pnpm draft <id>           out/<id>-draft.mp4, 1280x720, fast, for review
//   pnpm still <id> <sec>     out/<id>-<sec>.png, one frame
//   pnpm sheet <id> [every]   out/<id>-sheet.png, a frame every N seconds (default 2) from the cut
//   pnpm check-films <id|all> walk each timeline against the running app without recording:
//                             one line per film, ok or the target or action that drifted
const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const [mode, id, arg] = process.argv.slice(2);
const films = fs.readdirSync(path.join(ROOT, "timelines")).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
if (mode === "check" && (id === "all" || films.includes(id))) {
  // The capture script itself, in --check mode: same sign-in, setup and actions.
  let failed = 0;
  for (const film of id === "all" ? films : [id]) {
    const r = spawnSync(process.execPath, [path.join(ROOT, "capture/record.cjs"), film, "--check"], { cwd: ROOT, encoding: "utf8" });
    const line = (r.stdout || "").trim().split(/\r?\n/).pop() || `drift ${film}: ${(r.stderr || "no output").trim().split(/\r?\n/)[0]}`;
    console.log(line);
    if (r.status !== 0) failed++;
  }
  process.exit(failed ? 1 : 0);
}
if (!id || !films.includes(id)) {
  console.error(`usage: pnpm ${mode === "check" ? "check-films" : mode ?? "render"} <id${mode === "check" ? "|all" : ""}>   films: ${films.join(", ") || "none"}`);
  process.exit(1);
}
fs.mkdirSync(path.join(ROOT, "out"), { recursive: true });
const run = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, stdio: "inherit" });
const REMOTION = path.join(path.dirname(require.resolve("@remotion/cli/package.json", { paths: [ROOT] })), "remotion-cli.js");
const remotion = (args) => run(process.execPath, [REMOTION, ...args]);
const rec = path.join(ROOT, "public/rec", id, "events.json");
if (mode !== "sheet" && !fs.existsSync(rec)) console.warn(`no recording for ${id} yet: run pnpm capture ${id} (the film renders without the screen)`);

if (mode === "render") {
  remotion(["render", id, `out/${id}.mp4`, "--codec=h264", "--crf=16"]);
} else if (mode === "draft") {
  remotion(["render", id, `out/${id}-draft.mp4`, "--codec=h264", "--crf=26", `--scale=${2 / 3}`]);
} else if (mode === "still") {
  const sec = Number(arg ?? 0);
  const tl = JSON.parse(fs.readFileSync(path.join(ROOT, "timelines", id + ".json"), "utf8"));
  remotion(["still", id, `out/${id}-${sec}.png`, `--frame=${Math.round(sec * tl.fps)}`]);
} else if (mode === "sheet") {
  const every = Number(arg ?? 2);
  const src = ["", "-draft"].map((s) => `out/${id}${s}.mp4`).find((f) => fs.existsSync(path.join(ROOT, f)));
  if (!src) throw new Error(`render ${id} first`);
  const tl = JSON.parse(fs.readFileSync(path.join(ROOT, "timelines", id + ".json"), "utf8"));
  const n = Math.ceil(tl.duration / every), cols = 6, rows = Math.ceil(n / cols);
  // select keeps each frame's own time, so a tile's label is the moment it shows (fps= resamples).
  run("ffmpeg", ["-y", "-loglevel", "error", "-i", src, "-vf",
    `select='isnan(prev_selected_t)+gte(t-prev_selected_t\\,${every - 0.001})',scale=480:-1,drawtext=text='%{pts\\:hms}':x=8:y=8:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.5,tile=${cols}x${rows}`,
    "-fps_mode", "vfr", "-frames:v", "1", `out/${id}-sheet.png`]);
} else {
  console.error("modes: render, draft, still, sheet, check");
  process.exit(1);
}

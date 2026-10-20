export type Rect = { x: number; y: number; w: number; h: number };
export type Target = string | string[] | [number, number];

/** One film: timelines/<id>.json. The capture reads `app`, `targets` and `actions`; the film reads the rest. */
export type Timeline = {
  fps: number;
  width: number;
  height: number;
  duration: number;
  recStart: number;
  recEnd: number;
  screenIn: number;
  screenOut: number;
  endCard: number;
  cards: { from: number; to: number; lines: string[]; accent?: number }[];
  callouts: { from: number; to: number; title: string; sub?: string }[];
  cursorOn: [number, number];
  clicks: number[];
  /** Thumbnails the cursor carries onto a drop zone, from public/. Several fan out like a bundle. */
  fileCard?: { from: number; to: number; img: string[] };
  camera: { start: number; end: number; zoom: number; target: Target; fy?: number }[];
  spots: { from: number; to: number; targets: string[] }[];
  /** Under the logo on the end card: the first step, then the url. */
  end?: { line?: string; url?: string };
};

/** What the capture script logged: frame timing, the real mouse path, measured element boxes. */
export type Events = {
  videoStart: number;
  recEnd: number;
  mouse: [number, number, number][];
  rects: Record<string, Rect | null>;
};

// ---- Motion helpers: ease-in-out and ease-out only, nothing springy ----
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const out = (x: number) => 1 - Math.pow(1 - x, 3);
/** 0 outside [a, b], eased in over `fi` and out over `fo` seconds. */
export const win = (t: number, a: number, b: number, fi = 0.35, fo = 0.35) =>
  t < a || t > b ? 0 : Math.min(out(clamp((t - a) / fi, 0, 1)), out(clamp((b - t) / fo, 0, 1)));

export const union = (rs: Rect[]): Rect => {
  const x0 = Math.min(...rs.map((r) => r.x)), y0 = Math.min(...rs.map((r) => r.y));
  const x1 = Math.max(...rs.map((r) => r.x + r.w)), y1 = Math.max(...rs.map((r) => r.y + r.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
};

const isPoint = (t: Target): t is [number, number] => Array.isArray(t) && typeof t[0] === "number";

export function targetPoint(tl: Timeline, ev: Events, target: Target, fy = 0.5): [number, number] {
  if (isPoint(target)) return target;
  const names = Array.isArray(target) ? target : [target];
  const rs = names.map((n) => ev.rects[n]).filter((r): r is Rect => !!r);
  if (!rs.length) return [tl.width / 2, tl.height / 2];
  const r = union(rs);
  return [r.x + r.w / 2, r.y + r.h * fy];
}

/** Camera at film time t: zoom and the page point at the centre of the frame. Holds between moves. */
export function cameraAt(tl: Timeline, ev: Events, t: number) {
  let v: [number, number, number] = [1, tl.width / 2, tl.height / 2];
  for (const m of tl.camera) {
    const [cx, cy] = targetPoint(tl, ev, m.target, m.fy);
    const to: [number, number, number] = [m.zoom, cx, cy];
    if (t >= m.end) v = to;
    else if (t > m.start) {
      const k = ease((t - m.start) / (m.end - m.start));
      v = v.map((a, i) => a + (to[i] - a) * k) as [number, number, number];
      break;
    } else break;
  }
  const [z, cx, cy] = v;
  const tx = clamp(tl.width / 2 - cx * z, tl.width - tl.width * z, 0);
  const ty = clamp(tl.height / 2 - cy * z, tl.height - tl.height * z, 0);
  return { z, tx, ty };
}

/** The logged mouse position at film time t, linear between samples. */
export function mouseAt(tl: Timeline, ev: Events, t: number): [number, number] {
  const m = ev.mouse;
  if (!m.length) return [tl.width / 2, tl.height / 2];
  if (t <= m[0][0]) return [m[0][1], m[0][2]];
  let lo = 0, hi = m.length - 1;
  if (t >= m[hi][0]) return [m[hi][1], m[hi][2]];
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (m[mid][0] <= t) lo = mid; else hi = mid;
  }
  const [t0, x0, y0] = m[lo], [t1, x1, y1] = m[hi];
  const k = t1 > t0 ? (t - t0) / (t1 - t0) : 1;
  return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k];
}

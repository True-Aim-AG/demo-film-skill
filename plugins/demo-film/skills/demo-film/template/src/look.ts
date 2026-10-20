// The film's look and motion, in one place. Change the house style here, never in Film.tsx.
// Colours, logo and font come from brand.json at the project root. Sizes are px at 1920x1080.
import brandFile from "../brand.json";

export type Brand = {
  mode: "none" | "custom";
  name?: string;
  /** A file under public/ (SVG or PNG) that reads well on `colors.ground`. Empty: no logo. */
  logo?: string;
  colors: { ground: string; ink: string; inkSoft: string; accent: string };
  /** A font file under public/ (woff2, woff, ttf, otf). Empty: Inter. */
  font?: { file?: string; family?: string };
};

const NEUTRAL: Brand["colors"] = { ground: "#FAFAFA", ink: "#1F2328", inkSoft: "#4B5058", accent: "#2F6FEB" };
const raw = brandFile as unknown as Brand;
export const BRAND: Brand = raw.mode === "custom" ? raw : { mode: "none", colors: { ...NEUTRAL, ...(raw.colors || {}) } };

const rgb = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};

export const COLOR = {
  ground: BRAND.colors.ground, // cards, end card, callout glass
  ink: BRAND.colors.ink, // titles, cursor
  inkSoft: BRAND.colors.inkSoft, // callout sub line
  accent: BRAND.colors.accent, // the only accent
  groundRgb: rgb(BRAND.colors.ground),
  shade: rgb(BRAND.colors.ink), // shadows and the spotlight dim
  accentRgb: rgb(BRAND.colors.accent),
};

export const TYPE = {
  weights: ["500", "600"] as ("500" | "600")[],
  card: { size: 104, weight: 600, leading: 1.05, tracking: "-0.035em" },
  title: { size: 58, weight: 600, leading: 1.08, tracking: "-0.025em" },
  sub: { size: 40, weight: 500, leading: 1.2, tracking: "-0.015em" },
};

export const CARDS = {
  logo: { left: 96, top: 84, height: 44 }, // a small logo top left on the cards, custom brand only
  fadeIn: 0.45, fadeOut: 0.4, rise: 14,
};

export const SCREEN = {
  inDur: 1.1, outDur: 1.4, // scale-in after the cards, recede before the end card
  inset: 0.1, // the screen starts and ends at 90 %
  radius: 14, shadow: `0 30px 80px rgba(${COLOR.shade},.22)`,
};

export const SPOT = { dim: 0.45, edge: 3, fadeIn: 0.4, fadeOut: 0.35 };

export const CURSOR = {
  width: 46, height: 58, halo: 68, haloAlpha: 0.16,
  ring: { from: 10, grow: 60, dur: 0.6, width: 3 }, // click ring
  press: { scale: 0.88, dur: 0.12 },
  fadeIn: 0.4, fadeOut: 0.5,
  file: { width: 132, dx: 18, dy: 22, fan: 26, tilt: -4, fanTilt: 5, shrink: 0.25 },
};

export const CALLOUT = {
  left: 96, bottom: 104, maxWidth: 1200, padding: "30px 40px 32px 36px",
  glass: 0.62, blur: 22, bar: 6, shadow: `0 20px 60px rgba(${COLOR.shade},.18)`,
  fadeIn: 0.45, fadeOut: 0.35, rise: 18,
};

// lineDelay: the end line follows the logo. logoHeight caps a tall logo.
export const END = { fade: 1.2, logoWidth: 640, logoHeight: 260, grow: 0.03, lineDelay: 1.0, gap: 72 };

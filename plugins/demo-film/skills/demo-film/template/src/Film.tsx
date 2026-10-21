import React, { useEffect, useState } from "react";
import {
  AbsoluteFill, Img, OffthreadVideo, Sequence, continueRender, delayRender, staticFile, useCurrentFrame,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadFontFile } from "@remotion/fonts";
import { Timeline, Events, cameraAt, clamp, ease, mouseAt, out, win, Rect } from "./lib/timeline";
import { BRAND, CALLOUT, CARDS, COLOR, CURSOR, END, POWERED, SCREEN, SPOT, TYPE } from "./look";

// Inter always loads, as the fallback. A custom brand font file (brand.json `font.file`) goes first.
const inter = loadFont("normal", { weights: TYPE.weights, subsets: ["latin"] });
const brandFamily = BRAND.mode === "custom" && BRAND.font?.file ? BRAND.font.family || "BrandFont" : null;
if (brandFamily && BRAND.font?.file) loadFontFile({ family: brandFamily, url: staticFile(BRAND.font.file) });
const fontFamily = brandFamily ? `"${brandFamily}", ${inter.fontFamily}` : inter.fontFamily;
const logo = BRAND.mode === "custom" && BRAND.logo ? staticFile(BRAND.logo) : null;
const font = (s: { size: number; weight: number; leading: number }) => `${s.weight} ${s.size}px/${s.leading} ${fontFamily}`;

type P = { tl: Timeline; t: number };
type PE = P & { ev: Events };

export const Film: React.FC<{ id: string; tl: Timeline }> = ({ id, tl }) => {
  const frame = useCurrentFrame();
  const t = frame / tl.fps;
  const [ev, setEv] = useState<Events | null>(null);
  const [handle] = useState(() => delayRender(`rec/${id}/events.json`));
  useEffect(() => {
    fetch(staticFile(`rec/${id}/events.json`))
      .then((r) => r.json())
      .then((e: Events) => { setEv(e); continueRender(handle); })
      .catch(() => { setEv({ videoStart: tl.recStart, recEnd: tl.recEnd, mouse: [], rects: {} }); continueRender(handle); });
  }, [handle, id, tl]);
  if (!ev) return null;

  return (
    <AbsoluteFill style={{ background: COLOR.ground, fontFamily }}>
      <Cards tl={tl} t={t} />
      <Screen id={id} tl={tl} t={t} ev={ev} />
      <Pointer tl={tl} t={t} ev={ev} />
      <Callout tl={tl} t={t} />
      <EndCard tl={tl} t={t} />
    </AbsoluteFill>
  );
};

/** Type-only cards: the opening ones before the screen, closing ones (if any) after it recedes.
 *  A card from 0 is already on the first frame, so a paused or autoplaying film shows words, not blank ground. */
const Cards: React.FC<P> = ({ tl, t }) => {
  if (!tl.cards.length) return null;
  const opening = tl.cards.filter((c) => c.from < tl.screenIn);
  const closing = tl.cards.filter((c) => c.from >= tl.screenIn);
  const mark = Math.max(
    opening.length ? win(t, -1, opening[opening.length - 1].to, 0.6, 0.4) : 0,
    closing.length ? win(t, closing[0].from, closing[closing.length - 1].to, 0.6, 0.4) : 0,
  );
  return (
    <>
      {logo && (
        <Img src={logo} style={{ position: "absolute", left: CARDS.logo.left, top: CARDS.logo.top, height: CARDS.logo.height, opacity: mark }} />
      )}
      {tl.cards.map((c) => {
        const k = win(t, c.from <= 0 ? -1 : c.from, c.to, CARDS.fadeIn, CARDS.fadeOut);
        if (!k) return null;
        return (
          <AbsoluteFill key={c.from} style={{ display: "grid", placeContent: "center", textAlign: "center", opacity: k, transform: `translateY(${(1 - k) * CARDS.rise}px)` }}>
            {c.lines.map((l, i) => (
              <div key={l} style={{ font: font(TYPE.card), letterSpacing: TYPE.card.tracking, color: i === c.accent ? COLOR.accent : COLOR.ink }}>{l}</div>
            ))}
          </AbsoluteFill>
        );
      })}
    </>
  );
};

const Screen: React.FC<PE & { id: string }> = ({ id, tl, t, ev }) => {
  const inK = out(clamp((t - tl.screenIn) / SCREEN.inDur, 0, 1));
  const outK = ease(clamp((t - tl.screenOut) / SCREEN.outDur, 0, 1));
  if (t < tl.screenIn || outK >= 1) return null;
  const s = (1 - SCREEN.inset + SCREEN.inset * inK) * (1 - SCREEN.inset * outK);
  const framed = s < 0.999;
  const { z, tx, ty } = cameraAt(tl, ev, t);
  return (
    <AbsoluteFill style={{
      opacity: Math.min(inK, 1 - outK), transform: `scale(${s})`, transformOrigin: "50% 50%",
      borderRadius: framed ? SCREEN.radius : 0, overflow: "hidden", boxShadow: framed ? SCREEN.shadow : "none",
    }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: tl.width, height: tl.height, transformOrigin: "0 0", transform: `translate(${tx}px,${ty}px) scale(${z})` }}>
        {ev.mouse.length > 0 && (
          <Sequence from={Math.round(ev.videoStart * tl.fps)} layout="none">
            <OffthreadVideo src={staticFile(`rec/${id}/recording.mp4`)} muted style={{ position: "absolute", left: 0, top: 0, width: tl.width, height: tl.height }} />
          </Sequence>
        )}
        <Spotlight tl={tl} t={t} ev={ev} />
      </div>
    </AbsoluteFill>
  );
};

const Spotlight: React.FC<PE> = ({ tl, t, ev }) => {
  const layers = tl.spots.map((s) => {
    const k = win(t, s.from, s.to, SPOT.fadeIn, SPOT.fadeOut);
    const rs = s.targets.map((n) => ev.rects[n]).filter((r): r is Rect => !!r);
    if (!k || !rs.length) return null;
    const holes = rs.map((r) => `M${r.x} ${r.y}h${r.w}v${r.h}h${-r.w}z`).join("");
    return (
      <g key={s.from}>
        <path d={`M0 0H${tl.width}V${tl.height}H0z${holes}`} fillRule="evenodd" fill={`rgba(${COLOR.shade},${SPOT.dim * k})`} />
        {rs.map((r) => <rect key={`${r.x}${r.y}`} x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke={`rgba(${COLOR.accentRgb},${k})`} strokeWidth={SPOT.edge} />)}
      </g>
    );
  });
  return <svg viewBox={`0 0 ${tl.width} ${tl.height}`} style={{ position: "absolute", inset: 0, width: tl.width, height: tl.height }}>{layers}</svg>;
};

/** The cursor, drawn in film space from the logged mouse path, so it stays large and sharp at any zoom. */
const Pointer: React.FC<PE> = ({ tl, t, ev }) => {
  const k = win(t, tl.cursorOn[0], tl.cursorOn[1], CURSOR.fadeIn, CURSOR.fadeOut);
  if (!k) return null;
  const { z, tx, ty } = cameraAt(tl, ev, t);
  const [px, py] = mouseAt(tl, ev, t);
  const x = px * z + tx, y = py * z + ty;
  const { ring, press, file } = CURSOR;
  const click = tl.clicks.map((c) => t - c).find((d) => d >= 0 && d <= ring.dur);
  const fc = tl.fileCard;
  const fk = fc ? win(t, fc.from, fc.to, 0.3, 0.25) : 0;
  const drop = fc ? clamp((t - (fc.to - 0.4)) / 0.4, 0, 1) : 0;
  const h = CURSOR.halo / 2;
  return (
    <>
      {fc && fk > 0 && fc.img.map((img, i) => {
        // The last file is on top; the ones under it fan out to the left.
        const back = fc.img.length - 1 - i;
        return (
          <Img key={img} src={staticFile(img)} style={{
            position: "absolute", left: 0, top: 0, width: file.width, opacity: fk, transformOrigin: "0 0",
            transform: `translate(${x + file.dx - back * file.fan}px,${y + file.dy + back * 6}px) scale(${1 - file.shrink * drop}) rotate(${file.tilt - back * file.fanTilt}deg)`,
            boxShadow: `0 18px 40px rgba(${COLOR.shade},.3)`,
          }} />
        );
      })}
      <div style={{ position: "absolute", left: 0, top: 0, opacity: k, transform: `translate(${x}px,${y}px)` }}>
        <div style={{ position: "absolute", left: -h, top: -h, width: CURSOR.halo, height: CURSOR.halo, borderRadius: "50%", background: `rgba(${COLOR.accentRgb},${CURSOR.haloAlpha})` }} />
        {click !== undefined && (() => {
          const r = ring.from + ring.grow * out(click / ring.dur);
          return <div style={{ position: "absolute", left: -r, top: -r, width: 2 * r, height: 2 * r, borderRadius: "50%", border: `${ring.width}px solid ${COLOR.accent}`, opacity: 1 - click / ring.dur }} />;
        })()}
        <svg viewBox="0 0 24 30" style={{ position: "absolute", left: -4, top: -3, width: CURSOR.width, height: CURSOR.height, filter: "drop-shadow(0 4px 8px rgba(0,0,0,.28))", transform: `scale(${click !== undefined && click < press.dur ? press.scale : 1})`, transformOrigin: "4px 3px" }}>
          <path d="M2 1.5 L2 24 L8 18.5 L12 27.5 L15.6 26 L11.7 17.2 L19.5 17.2 Z" fill={COLOR.ink} stroke={COLOR.ground} strokeWidth={1.6} strokeLinejoin="round" />
        </svg>
      </div>
    </>
  );
};

/** A glass panel: translucent ground over a blurred background, one accent edge. */
const Callout: React.FC<P> = ({ tl, t }) => {
  const c = tl.callouts.find((x) => t >= x.from && t <= x.to);
  if (!c) return null;
  const k = win(t, c.from, c.to, CALLOUT.fadeIn, CALLOUT.fadeOut);
  const blur = `blur(${CALLOUT.blur}px) saturate(1.2)`;
  return (
    <div style={{
      position: "absolute", left: CALLOUT.left, bottom: CALLOUT.bottom, maxWidth: CALLOUT.maxWidth, padding: CALLOUT.padding,
      background: `rgba(${COLOR.groundRgb},${CALLOUT.glass})`, backdropFilter: blur, WebkitBackdropFilter: blur,
      borderLeft: `${CALLOUT.bar}px solid ${COLOR.accent}`, boxShadow: CALLOUT.shadow,
      opacity: k, transform: `translateY(${(1 - k) * CALLOUT.rise}px)`,
    }}>
      <div style={{ font: font(TYPE.title), letterSpacing: TYPE.title.tracking, color: COLOR.ink }}>{c.title}</div>
      {c.sub && <div style={{ font: font(TYPE.sub), letterSpacing: TYPE.sub.tracking, color: COLOR.inkSoft, marginTop: 8 }}>{c.sub}</div>}
    </div>
  );
};

/** The logo (or the brand name) with an optional first step and url under it. No brand: the words only. */
const EndCard: React.FC<P> = ({ tl, t }) => {
  const e = ease(clamp((t - tl.endCard) / END.fade, 0, 1));
  if (!e) return null;
  // The first step and the url land under the logo once it has settled.
  const k = win(t, tl.endCard + END.lineDelay, tl.duration + 1, CARDS.fadeIn, 0.1);
  return (
    <AbsoluteFill style={{ background: COLOR.ground, opacity: e, display: "grid", placeContent: "center", justifyItems: "center" }}>
      <div style={{ transform: `scale(${1 - END.grow + END.grow * e})` }}>
        {logo ? <Img src={logo} style={{ width: END.logoWidth, height: END.logoHeight, objectFit: "contain", display: "block" }} />
          : BRAND.mode === "custom" && BRAND.name ? <div style={{ font: font(TYPE.card), letterSpacing: TYPE.card.tracking, color: COLOR.ink }}>{BRAND.name}</div>
          : null}
      </div>
      {tl.end && (
        <div style={{ marginTop: logo || BRAND.name ? END.gap : 0, textAlign: "center", opacity: k, transform: `translateY(${(1 - k) * CARDS.rise}px)` }}>
          {tl.end.line && <div style={{ font: font(TYPE.title), letterSpacing: TYPE.title.tracking, color: COLOR.ink }}>{tl.end.line}</div>}
          {tl.end.url && <div style={{ font: font(TYPE.sub), letterSpacing: TYPE.sub.tracking, color: COLOR.accent, marginTop: 14 }}>{tl.end.url}</div>}
        </div>
      )}
      {POWERED.on && (
        <div style={{
          position: "absolute", right: POWERED.right, bottom: POWERED.bottom, display: "flex", alignItems: "center", gap: POWERED.gap,
          opacity: POWERED.opacity * win(t, tl.endCard + POWERED.delay, tl.duration + 1, CARDS.fadeIn, 0.1),
        }}>
          <span style={{ font: `500 ${POWERED.size}px/1 ${fontFamily}`, color: COLOR.inkSoft }}>Powered by</span>
          <Img src={staticFile(POWERED.logo)} style={{ width: POWERED.logoWidth, display: "block" }} />
        </div>
      )}
    </AbsoluteFill>
  );
};

import React from "react";
import { Composition } from "remotion";
import { Film } from "./Film";
import type { Timeline } from "./lib/timeline";

// One composition per timelines/<id>.json. The file name is the film id: pnpm capture/render <id>.
const ctx = import.meta.webpackContext("../timelines", { recursive: false, regExp: /\.json$/ });
const FILMS = ctx.keys()
  .filter((k) => k.startsWith("./"))
  .map((k) => ({ id: k.slice(2, -5), tl: ctx(k) as Timeline }));

export const Root: React.FC = () => (
  <>
    {FILMS.map(({ id, tl }) => (
      <Composition key={id} id={id} component={Film} defaultProps={{ id, tl }}
        durationInFrames={Math.round(tl.duration * tl.fps)} fps={tl.fps} width={tl.width} height={tl.height} />
    ))}
  </>
);

// Webpack's module context, which Remotion's bundler provides: it lists timelines/ at build time.
interface ImportMeta {
  webpackContext(dir: string, opts: { recursive?: boolean; regExp?: RegExp }): {
    keys(): string[];
    (id: string): unknown;
  };
}

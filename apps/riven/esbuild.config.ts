import dedent from "dedent";
import * as esbuild from "esbuild";

/**
 * Polyfills for Node.js ESM modules to allow using `require` in bundled code.
 *
 * @see https://github.com/evanw/esbuild/issues/1921#issuecomment-3453406735
 */
const requirePolyfill = dedent`
  import { createRequire } from "node:module";
  const require = createRequire(import.meta.url);
`;

await esbuild.build({
  entryPoints: ["lib/message-queue/sandboxed-jobs/jobs/**/*.processor.ts"],
  outdir: "dist/workers",
  bundle: true,
  platform: "node",
  splitting: true,
  format: "esm",
  sourcemap: true,
  treeShaking: true,
  banner: {
    js: requirePolyfill,
  },
});

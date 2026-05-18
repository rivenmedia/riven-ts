import dedent from "dedent";
import * as esbuild from "esbuild";

const requirePolyfill = dedent`
  import { createRequire } from "module";
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
  external: ["bullmq", "winston"],
  banner: {
    js: requirePolyfill,
  },
});

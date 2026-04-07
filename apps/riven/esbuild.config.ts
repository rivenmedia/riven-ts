import * as esbuild from "esbuild";

// import { nodeExternalsPlugin } from "esbuild-node-externals";

await esbuild.build({
  entryPoints: ["lib/message-queue/sandboxed-jobs/jobs/**/*.processor.ts"],
  outdir: "dist/workers",
  bundle: true,
  platform: "node",
  splitting: true,
  format: "esm",
  sourcemap: true,
  treeShaking: true,
});
